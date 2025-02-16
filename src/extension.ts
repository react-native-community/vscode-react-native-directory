import { exec } from 'node:child_process';
import * as vscode from 'vscode';
import { QuickPickItemKind } from 'vscode';
import preferredPM from 'preferred-pm';
import { DirectoryEntry } from './types';
import { ENTRY_OPTION, fetchData } from './utils';

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand('extension.showQuickPick', async () => {
    const packagesPick = vscode.window.createQuickPick<DirectoryEntry>();

    packagesPick.placeholder = 'Loading directory data...';
    packagesPick.title = 'Search in React Native Directory';
    packagesPick.matchOnDescription = false;
    packagesPick.matchOnDetail = false;

    packagesPick.busy = true;
    packagesPick.show();

    packagesPick.items = await fetchData();
    packagesPick.busy = false;
    packagesPick.placeholder = 'Search for a package';

    packagesPick.onDidChangeValue(async (value) => {
      packagesPick.busy = true;
      packagesPick.title = 'Search in React Native Directory';
      packagesPick.items = await fetchData(value);

      packagesPick.busy = false;
    });

    packagesPick.onDidAccept(() => {
      const selectedEntry = packagesPick.selectedItems[0];

      const optionPick = vscode.window.createQuickPick();
      optionPick.title = `"${selectedEntry.label}" options`;
      optionPick.items = [
        { label: ENTRY_OPTION.INSTALL, alwaysShow: true },
        { label: `Open URLs`, kind: QuickPickItemKind.Separator },
        { label: ENTRY_OPTION.VISIT_REPO, alwaysShow: true },
        { label: ENTRY_OPTION.VISIT_NPM, alwaysShow: true },
        { label: 'Copy data', kind: QuickPickItemKind.Separator },
        { label: ENTRY_OPTION.COPY_NAME, alwaysShow: true },
        { label: ENTRY_OPTION.COPY_REPO_URL, alwaysShow: true },
        { label: ENTRY_OPTION.COPY_NPM_URL, alwaysShow: true },
        { label: '', kind: QuickPickItemKind.Separator },
        { label: ENTRY_OPTION.GO_BACK, alwaysShow: true }
      ];
      optionPick.show();

      optionPick.onDidAccept(async () => {
        const actionOption = optionPick.selectedItems[0];

        switch (actionOption.label) {
          case ENTRY_OPTION.INSTALL: {
            const workspacePath =
              vscode.workspace.workspaceFolders?.[0].uri.fsPath ?? vscode.env.appRoot ?? vscode.workspace.rootPath;

            const manager = vscode.workspace.getConfiguration('npm').get('packageManager');

            if (workspacePath) {
              const preferredManager =
                !manager || manager === 'auto' ? ((await preferredPM(workspacePath))?.name ?? 'npm') : manager;

              exec(`${preferredManager} install ${selectedEntry.label}`, { cwd: workspacePath }, (error, stout) => {
                if (error) {
                  vscode.window.showErrorMessage(
                    `An error occurred while trying to install the package: ${error.message}`
                  );
                  return;
                }
                vscode.window.showInformationMessage(
                  `\`${selectedEntry.npmPkg}\` package has been installed in current workspace using \`${preferredManager}\`: ${stout}`
                );
                optionPick.hide();
              });
            } else {
              vscode.window.showErrorMessage(`Cannot determine current workspace path`);
            }
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
            packagesPick.items = await fetchData(packagesPick.value);
            packagesPick.show();
            break;
          }
        }

        optionPick.hide();
      });
    });
  });

  context.subscriptions.push(disposable);
}
