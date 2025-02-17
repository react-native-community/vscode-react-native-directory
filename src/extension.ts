import { exec } from 'node:child_process';
import * as vscode from 'vscode';
import { QuickPickItemKind } from 'vscode';
import preferredPM from 'preferred-pm';
import { DirectoryEntry } from './types';
import { ENTRY_OPTION, fetchData, getCommandToRun, STRINGS } from './utils';

export async function activate(context: vscode.ExtensionContext) {
  const workspacePath = vscode.workspace.workspaceFolders?.[0].uri.fsPath ?? vscode.workspace.rootPath;
  const manager = vscode.workspace.getConfiguration('npm').get<string>('packageManager', 'npm');

  const shouldCheckPreferred = workspacePath && (!manager || manager === 'auto');
  const preferredManager = shouldCheckPreferred ? ((await preferredPM(workspacePath))?.name ?? 'npm') : manager;

  const disposable = vscode.commands.registerCommand('extension.showQuickPick', async () => {
    const packagesPick = vscode.window.createQuickPick<DirectoryEntry>();

    packagesPick.placeholder = STRINGS.PLACEHOLDER_BUSY;
    packagesPick.title = 'Search in React Native Directory';
    packagesPick.matchOnDescription = false;
    packagesPick.matchOnDetail = false;
    packagesPick.busy = true;

    packagesPick.show();
    packagesPick.items = await fetchData();

    packagesPick.busy = false;
    packagesPick.placeholder = STRINGS.PLACEHOLDER;

    packagesPick.onDidChangeValue(async (value) => {
      packagesPick.busy = true;
      packagesPick.title = 'Search in React Native Directory';
      packagesPick.items = await fetchData(value);
      packagesPick.busy = false;
    });

    packagesPick.onDidAccept(() => {
      const selectedEntry = packagesPick.selectedItems[0];

      const possibleActions = [
        workspacePath && {
          label: ENTRY_OPTION.INSTALL,
          description: `with ${preferredManager}${selectedEntry.dev ? ' as devDependency' : ''}`
        },
        { label: `open URLs`, kind: QuickPickItemKind.Separator },
        selectedEntry.github.urls.homepage && {
          label: ENTRY_OPTION.VISIT_HOMEPAGE,
          description: selectedEntry.github.urls.homepage
        },
        { label: ENTRY_OPTION.VISIT_REPO },
        { label: ENTRY_OPTION.VISIT_NPM },
        { label: ENTRY_OPTION.VIEW_BUNDLEPHOBIA },
        selectedEntry.github.license && {
          label: ENTRY_OPTION.VIEW_LICENSE,
          description: selectedEntry.github.license.name
        },
        { label: 'copy data', kind: QuickPickItemKind.Separator },
        { label: ENTRY_OPTION.COPY_NAME },
        { label: ENTRY_OPTION.COPY_REPO_URL },
        { label: ENTRY_OPTION.COPY_NPM_URL },
        { label: '', kind: QuickPickItemKind.Separator },
        { label: ENTRY_OPTION.GO_BACK }
      ].filter((option) => !!option && typeof option === 'object');

      const optionPick = vscode.window.createQuickPick();
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
                vscode.window.showErrorMessage(
                  `An error occurred while trying to install the \`${selectedEntry.npmPkg}\` package: ${error.message}`
                );
                return;
              }
              vscode.window.showInformationMessage(
                `\`${selectedEntry.npmPkg}\` package has been installed${selectedEntry.dev ? ' as `devDependency`' : ''} in current workspace using \`${preferredManager}\`: ${stout}`
              );
              optionPick.hide();
            });
            break;
          }
          case ENTRY_OPTION.VISIT_HOMEPAGE: {
            vscode.env.openExternal(vscode.Uri.parse(selectedEntry.github.urls.homepage!));
            break;
          }
          case ENTRY_OPTION.VISIT_REPO: {
            vscode.env.openExternal(vscode.Uri.parse(selectedEntry.githubUrl));
            break;
          }
          case ENTRY_OPTION.VISIT_NPM: {
            vscode.env.openExternal(vscode.Uri.parse(`https://www.npmjs.com/package/${selectedEntry.npmPkg}`));
            break;
          }
          case ENTRY_OPTION.VIEW_BUNDLEPHOBIA: {
            vscode.env.openExternal(vscode.Uri.parse(`https://bundlephobia.com/package/${selectedEntry.npmPkg}`));
            break;
          }
          case ENTRY_OPTION.VIEW_LICENSE: {
            vscode.env.openExternal(vscode.Uri.parse(selectedEntry.github.license.url));
            break;
          }
          case ENTRY_OPTION.COPY_NAME: {
            vscode.env.clipboard.writeText(selectedEntry.npmPkg);
            vscode.window.showInformationMessage('Package name copied to clipboard');
            break;
          }
          case ENTRY_OPTION.COPY_REPO_URL: {
            vscode.env.clipboard.writeText(selectedEntry.githubUrl);
            vscode.window.showInformationMessage('Repository URL copied to clipboard');
            break;
          }
          case ENTRY_OPTION.COPY_NPM_URL: {
            vscode.env.clipboard.writeText(`https://www.npmjs.com/package/${selectedEntry.npmPkg}`);
            vscode.window.showInformationMessage('npm registry URL copied to clipboard');
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
