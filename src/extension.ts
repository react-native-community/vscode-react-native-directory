import { exec } from 'node:child_process';
import { commands, env, type ExtensionContext, QuickPickItemKind, Uri, window, workspace } from 'vscode';

import { ENTRY_OPTION, KEYWORD_REGEX, STRINGS, VALID_KEYWORDS_MAP, VERSIONS_OPTION } from './constants';
import { detectPackageManager } from './detectPackageManager';
import { DirectoryEntry, NpmRegistryData, ValidKeyword } from './types';
import {
  deduplicateSearchTokens,
  fetchData,
  getCommandToRun,
  getCompatibilityList,
  getEntryTypeLabel,
  getPlatformsList,
  invertObject,
  numberFormatter,
  openListWithSearch
} from './utils';

export async function activate(context: ExtensionContext) {
  const workspacePath = workspace.workspaceFolders?.[0].uri.fsPath ?? workspace.rootPath;
  const manager = workspace.getConfiguration('npm').get<string>('packageManager', 'npm');

  const shouldCheckPreferred = workspacePath && (!manager || manager === 'auto');
  const preferredManager = shouldCheckPreferred
    ? ((await detectPackageManager({ cwd: workspacePath })) ?? 'npm')
    : manager;

  const disposable = commands.registerCommand('extension.showQuickPick', async () => {
    const packagesPick = window.createQuickPick<DirectoryEntry>();

    packagesPick.placeholder = STRINGS.PACKAGES_PLACEHOLDER_BUSY;
    packagesPick.matchOnDescription = false;
    packagesPick.matchOnDetail = false;

    await openListWithSearch(packagesPick);

    packagesPick.onDidChangeValue(async (value) => {
      packagesPick.busy = true;

      if (value.includes(':')) {
        const keywords = (value.match(KEYWORD_REGEX) ?? []).map((token) => token.slice(1));
        const searchString = value.replace(KEYWORD_REGEX, '').trim();

        const validKeywords = keywords
          .map((keyword) => keyword.toLowerCase())
          .filter((keyword): keyword is ValidKeyword => keyword in VALID_KEYWORDS_MAP)
          .map((keyword) => VALID_KEYWORDS_MAP[keyword] as ValidKeyword);

        if (validKeywords.length > 0) {
          packagesPick.title = `Active filters: ${validKeywords.join(', ')}`;
        } else {
          packagesPick.title = STRINGS.DEFAULT_TITLE;
        }
        packagesPick.items = await fetchData(searchString, validKeywords);
      } else {
        packagesPick.items = await fetchData(value);
      }

      packagesPick.busy = false;
    });

    packagesPick.onDidAccept(() => {
      const selectedEntry = packagesPick.selectedItems[0];

      const examplesActions =
        selectedEntry.examples && selectedEntry.examples.length > 0
          ? [
              { label: 'view examples', kind: QuickPickItemKind.Separator },
              ...selectedEntry.examples.map((example, index) => ({
                label: `Example #${index + 1}`,
                description: example
              }))
            ]
          : [];

      const platformsList = getPlatformsList(selectedEntry);
      const compatibilityList = getCompatibilityList(selectedEntry);

      const possibleActions = [
        workspacePath && {
          label: ENTRY_OPTION.INSTALL,
          description: `with ${preferredManager}${selectedEntry.dev ? ' as devDependency' : ''}`
        },
        workspacePath && {
          label: ENTRY_OPTION.INSTALL_SPECIFIC_VERSION,
          description: `with ${preferredManager}${selectedEntry.dev ? ' as devDependency' : ''}`
        },
        { label: `open URLs`, kind: QuickPickItemKind.Separator },
        {
          label: ENTRY_OPTION.VISIT_REPO,
          description: [
            `$(star) ${numberFormatter.format(selectedEntry.github.stats.stars)}`,
            `$(gist-fork) ${numberFormatter.format(selectedEntry.github.stats.forks)}`,
            `$(eye) ${numberFormatter.format(selectedEntry.github.stats.subscribers)}`
          ].join(' ')
        },
        !selectedEntry.template && {
          label: ENTRY_OPTION.VISIT_NPM,
          description: selectedEntry.npm?.downloads
            ? `$(arrow-circle-down) ${numberFormatter.format(selectedEntry.npm.downloads)}`
            : ''
        },
        { label: ENTRY_OPTION.VISIT_DIRECTORY },
        selectedEntry.github.urls.homepage && {
          label: ENTRY_OPTION.VISIT_HOMEPAGE,
          description: selectedEntry.github.urls.homepage
        },
        selectedEntry.github.license && {
          label: ENTRY_OPTION.VIEW_LICENSE,
          description: selectedEntry.github.license.name
        },
        selectedEntry.github.stats.dependencies !== undefined && {
          label: ENTRY_OPTION.VIEW_DEPENDENCIES,
          description: `$(package) ${numberFormatter.format(selectedEntry.github.stats.dependencies)} ${selectedEntry.github.stats.dependencies === 1 ? 'dependency' : 'dependencies'}`
        },
        !selectedEntry.template && { label: ENTRY_OPTION.VIEW_BUNDLEPHOBIA },
        selectedEntry.nightlyProgram && { label: ENTRY_OPTION.VIEW_NIGHTLY_RESULTS },
        { label: 'details', kind: QuickPickItemKind.Separator },
        {
          label: ENTRY_OPTION.PLATFORMS,
          description: platformsList.join(', ')
        },
        compatibilityList.length > 0 && {
          label: ENTRY_OPTION.COMPATIBILITY,
          description: compatibilityList.join(', ')
        },
        selectedEntry.configPlugin && {
          label: ENTRY_OPTION.CONFIG_PLUGIN,
          description: typeof selectedEntry.configPlugin === 'string' ? selectedEntry.configPlugin : 'included'
        },
        {
          label: ENTRY_OPTION.DIRECTORY_SCORE,
          description: `$(${selectedEntry.score >= 100 ? 'verified-filled' : 'verified'}) ${selectedEntry.score}/100`
        },
        ...examplesActions,
        { label: 'copy data', kind: QuickPickItemKind.Separator },
        !selectedEntry.template && { label: ENTRY_OPTION.COPY_NAME },
        { label: ENTRY_OPTION.COPY_REPO_URL },
        !selectedEntry.template && { label: ENTRY_OPTION.COPY_NPM_URL },
        !selectedEntry.template && { label: ENTRY_OPTION.COPY_DIRECTORY_URL },
        { label: '', kind: QuickPickItemKind.Separator },
        { label: ENTRY_OPTION.GO_BACK }
      ].filter((option) => !!option && typeof option === 'object');

      function setupAndShowEntryPicker() {
        optionPick.title = `Actions for "${selectedEntry.label}" ${getEntryTypeLabel(selectedEntry)}`;
        optionPick.placeholder = 'Select an action';
        optionPick.items = possibleActions;
        optionPick.show();
      }

      const optionPick = window.createQuickPick();
      setupAndShowEntryPicker();

      optionPick.onDidAccept(async () => {
        const selectedAction = optionPick.selectedItems[0];

        switch (selectedAction.label) {
          case ENTRY_OPTION.INSTALL: {
            optionPick.busy = true;

            exec(getCommandToRun(selectedEntry, preferredManager), { cwd: workspacePath }, (error, stout) => {
              if (error) {
                window.showErrorMessage(
                  `An error occurred while trying to install the '${selectedEntry.npmPkg}' package: ${error.message}`
                );
                optionPick.busy = false;
                return;
              }
              window.showInformationMessage(
                `'${selectedEntry.npmPkg}' package has been installed${selectedEntry.dev ? ' as `devDependency`' : ''} in current workspace using '${preferredManager}': ${stout}`
              );
              optionPick.hide();
            });

            break;
          }
          case ENTRY_OPTION.INSTALL_SPECIFIC_VERSION: {
            const versionPick = window.createQuickPick();
            versionPick.title = `Select "${selectedEntry.label}" package version to install`;
            versionPick.busy = true;
            versionPick.placeholder = 'Loading versions...';
            versionPick.show();

            const apiUrl = new URL(`https://registry.npmjs.org/${selectedEntry.npmPkg}`);
            const response = await fetch(apiUrl.href);

            if (!response.ok) {
              window.showErrorMessage(`Cannot fetch package versions from npm registry`);
              versionPick.hide();
              setupAndShowEntryPicker();
              return;
            }

            const data = (await response.json()) as NpmRegistryData;
            const tags = invertObject(data['dist-tags']);

            if ('versions' in data) {
              const versions = Object.values(data.versions).map((item: NpmRegistryData['versions'][number]) => ({
                label: item.version,
                description: item.version in tags ? tags[item.version] : '',
                alwaysShow: true
              }));

              versionPick.busy = false;
              versionPick.placeholder = 'Select a version';
              versionPick.items = [
                ...versions.reverse(),
                { label: '', kind: QuickPickItemKind.Separator },
                { label: VERSIONS_OPTION.CANCEL }
              ];

              versionPick.onDidAccept(async () => {
                const selectedVersion = versionPick.selectedItems[0];

                if (selectedVersion.label === VERSIONS_OPTION.CANCEL) {
                  versionPick.hide();
                  setupAndShowEntryPicker();
                  return;
                }

                versionPick.busy = true;

                exec(
                  getCommandToRun(selectedEntry, preferredManager, selectedVersion.label),
                  { cwd: workspacePath },
                  (error, stout) => {
                    if (error) {
                      window.showErrorMessage(
                        `An error occurred while trying to install the '${selectedEntry.npmPkg}@${selectedVersion.label}' package: ${error.message}`
                      );
                      versionPick.hide();
                      setupAndShowEntryPicker();
                      return;
                    }
                    window.showInformationMessage(
                      `'${selectedEntry.npmPkg}@${selectedVersion.label}' package has been installed${selectedEntry.dev ? ' as `devDependency`' : ''} in current workspace using '${preferredManager}': ${stout}`
                    );
                    versionPick.hide();
                  }
                );
              });
            } else {
              window.showErrorMessage(`Recieved incorrect response from npm registry`);
              versionPick.hide();
              setupAndShowEntryPicker();
            }

            break;
          }
          case ENTRY_OPTION.VISIT_HOMEPAGE: {
            if (selectedEntry.github.urls.homepage) {
              env.openExternal(Uri.parse(selectedEntry.github.urls.homepage));
            }
            break;
          }
          case ENTRY_OPTION.VISIT_REPO: {
            env.openExternal(Uri.parse(selectedEntry.githubUrl));
            break;
          }
          case ENTRY_OPTION.VISIT_NPM: {
            env.openExternal(Uri.parse(`https://www.npmjs.com/package/${selectedEntry.npmPkg}`));
            break;
          }
          case ENTRY_OPTION.VISIT_DIRECTORY: {
            env.openExternal(Uri.parse(`https://reactnative.directory/package/${selectedEntry.npmPkg}`));
            break;
          }
          case ENTRY_OPTION.VIEW_LICENSE: {
            env.openExternal(Uri.parse(selectedEntry.github.license.url));
            break;
          }
          case ENTRY_OPTION.VIEW_BUNDLEPHOBIA: {
            env.openExternal(Uri.parse(`https://bundlephobia.com/package/${selectedEntry.npmPkg}`));
            break;
          }
          case ENTRY_OPTION.VIEW_NIGHTLY_RESULTS: {
            env.openExternal(Uri.parse(`https://react-native-community.github.io/nightly-tests/`));
            break;
          }
          case ENTRY_OPTION.PLATFORMS: {
            const searchValue = deduplicateSearchTokens(packagesPick.value, platformsList);
            await openListWithSearch(packagesPick, searchValue);
            break;
          }
          case ENTRY_OPTION.COMPATIBILITY: {
            const searchValue = deduplicateSearchTokens(packagesPick.value, compatibilityList);
            await openListWithSearch(packagesPick, searchValue);
            break;
          }
          case ENTRY_OPTION.COPY_NAME: {
            env.clipboard.writeText(selectedEntry.npmPkg);
            window.showInformationMessage('Package name copied to clipboard');
            break;
          }
          case ENTRY_OPTION.COPY_REPO_URL: {
            env.clipboard.writeText(selectedEntry.githubUrl);
            window.showInformationMessage('Repository URL copied to clipboard');
            break;
          }
          case ENTRY_OPTION.COPY_NPM_URL: {
            env.clipboard.writeText(`https://www.npmjs.com/package/${selectedEntry.npmPkg}`);
            window.showInformationMessage('npm registry URL copied to clipboard');
            break;
          }
          case ENTRY_OPTION.COPY_DIRECTORY_URL: {
            env.clipboard.writeText(`https://reactnative.directory/package/${selectedEntry.npmPkg}`);
            window.showInformationMessage('React Native Directory page URL copied to clipboard');
            break;
          }
          case ENTRY_OPTION.GO_BACK: {
            await openListWithSearch(packagesPick);
            break;
          }
          case ENTRY_OPTION.VIEW_DEPENDENCIES: {
            env.openExternal(Uri.parse(`https://www.npmjs.com/package/${selectedEntry.npmPkg}?activeTab=dependencies`));
            break;
          }
          case ENTRY_OPTION.CONFIG_PLUGIN: {
            if (typeof selectedEntry.configPlugin === 'string') {
              env.openExternal(Uri.parse(selectedEntry.configPlugin));
            } else {
              const searchValue = deduplicateSearchTokens(packagesPick.value, ['configPlugin']);
              await openListWithSearch(packagesPick, searchValue);
            }
            break;
          }
          case ENTRY_OPTION.DIRECTORY_SCORE: {
            env.openExternal(Uri.parse(`https://reactnative.directory/package/${selectedEntry.npmPkg}/score`));
            break;
          }
        }

        if (selectedAction.label !== ENTRY_OPTION.INSTALL) {
          optionPick.hide();
        }
      });
    });
  });

  context.subscriptions.push(disposable);
}
