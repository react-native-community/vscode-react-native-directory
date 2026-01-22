import { commands, type ExtensionContext, workspace } from 'vscode';

import { createPackageJsonDependencyAnnotator } from './annotatePackageJson';
import { createSearchQuickPickHandler } from './createSearchQuickPickHandler';
import { detectPackageManager } from './detectPackageManager';

export async function activate(context: ExtensionContext) {
  const workspacePath = workspace.workspaceFolders?.[0].uri.fsPath ?? workspace.rootPath;

  const manager = workspace.getConfiguration('npm').get<string>('packageManager', 'npm');
  const shouldCheckPreferred = workspacePath && (!manager || manager === 'auto');
  const preferredManager = shouldCheckPreferred
    ? ((await detectPackageManager({ cwd: workspacePath })) ?? 'npm')
    : manager;

  context.subscriptions.push(
    commands.registerCommand('extension.showQuickPick', createSearchQuickPickHandler(preferredManager, workspacePath)),
    createPackageJsonDependencyAnnotator()
  );
}
