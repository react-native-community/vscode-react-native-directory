import { exec } from 'node:child_process';
import { workspace, commands, window, type ExtensionContext, QuickPickItemKind, env, Uri } from 'vscode';

import { detectPackageManager } from './detectPackageManager';
import { DirectoryEntry } from './types';
import {
  ENTRY_OPTION,
  fetchData,
  getCommandToRun,
  KEYWORD_REGEX,
  numberFormatter,
  STRINGS,
  VALID_KEYWORDS_MAP,
  ValidKeyword
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

    packagesPick.placeholder = STRINGS.PLACEHOLDER_BUSY;
    packagesPick.title = STRINGS.DEFAULT_TITLE;
    packagesPick.matchOnDescription = false;
    packagesPick.matchOnDetail = false;
    packagesPick.busy = true;

    packagesPick.show();
    packagesPick.items = await fetchData();

    packagesPick.busy = false;
    packagesPick.placeholder = STRINGS.PLACEHOLDER;

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

      const possibleActions = [
        workspacePath && {
          label: ENTRY_OPTION.INSTALL,
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
        {
          label: ENTRY_OPTION.VISIT_NPM,
          description: selectedEntry.npm?.downloads
            ? `$(arrow-circle-down) ${numberFormatter.format(selectedEntry.npm.downloads)}`
            : ''
        },
        selectedEntry.github.urls.homepage && {
          label: ENTRY_OPTION.VISIT_HOMEPAGE,
          description: selectedEntry.github.urls.homepage
        },
        selectedEntry.github.license && {
          label: ENTRY_OPTION.VIEW_LICENSE,
          description: selectedEntry.github.license.name
        },
        { label: ENTRY_OPTION.VIEW_BUNDLEPHOBIA },
        ...examplesActions,
        { label: 'copy data', kind: QuickPickItemKind.Separator },
        { label: ENTRY_OPTION.COPY_NAME },
        { label: ENTRY_OPTION.COPY_REPO_URL },
        { label: ENTRY_OPTION.COPY_NPM_URL },
        { label: '', kind: QuickPickItemKind.Separator },
        { label: ENTRY_OPTION.GO_BACK }
      ].filter((option) => !!option && typeof option === 'object');

      const optionPick = window.createQuickPick();
      optionPick.title = `Actions for "${selectedEntry.label}"`;
      optionPick.placeholder = 'Select an action';
      optionPick.items = possibleActions;
      optionPick.show();

      optionPick.onDidAccept(async () => {
        const selectedAction = optionPick.selectedItems[0];

        switch (selectedAction.label) {
          case ENTRY_OPTION.INSTALL: {
            exec(getCommandToRun(selectedEntry, preferredManager), { cwd: workspacePath }, (error, stout) => {
              if (error) {
                window.showErrorMessage(
                  `An error occurred while trying to install the \`${selectedEntry.npmPkg}\` package: ${error.message}`
                );
                return;
              }
              window.showInformationMessage(
                `\`${selectedEntry.npmPkg}\` package has been installed${selectedEntry.dev ? ' as `devDependency`' : ''} in current workspace using \`${preferredManager}\`: ${stout}`
              );
              optionPick.hide();
            });
            break;
          }
          case ENTRY_OPTION.VISIT_HOMEPAGE: {
            env.openExternal(Uri.parse(selectedEntry.github.urls.homepage!));
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
          case ENTRY_OPTION.VIEW_BUNDLEPHOBIA: {
            env.openExternal(Uri.parse(`https://bundlephobia.com/package/${selectedEntry.npmPkg}`));
            break;
          }
          case ENTRY_OPTION.VIEW_LICENSE: {
            env.openExternal(Uri.parse(selectedEntry.github.license.url));
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
          case ENTRY_OPTION.GO_BACK: {
            packagesPick.placeholder = STRINGS.PLACEHOLDER_BUSY;
            packagesPick.busy = true;

            packagesPick.show();
            packagesPick.items = await fetchData(packagesPick.value);

            packagesPick.placeholder = STRINGS.PLACEHOLDER;
            packagesPick.busy = false;
            break;
          }
        }

        optionPick.hide();
      });
    });
  });

  context.subscriptions.push(disposable);
}
