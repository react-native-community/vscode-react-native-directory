import { commands, type Disposable, type ExtensionContext, workspace } from 'vscode';

import { createPackageJsonDependencyAnnotator } from './annotatePackageJson';
import { CONFIG_KEY } from './constants';
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
    commands.registerCommand('extension.showQuickPick', createSearchQuickPickHandler(preferredManager, workspacePath))
  );

  const annotatePackageJson =
    workspace.getConfiguration(CONFIG_KEY).get<boolean>('enablePackageJsonAnnotations') ?? true;

  let annotatorDisposable: Disposable | undefined;

  function enableAnnotator() {
    if (!annotatorDisposable) {
      annotatorDisposable = createPackageJsonDependencyAnnotator();
      context.subscriptions.push(annotatorDisposable);
    }
  }

  function disableAnnotator() {
    if (annotatorDisposable) {
      annotatorDisposable.dispose();
      annotatorDisposable = undefined;
    }
  }

  if (annotatePackageJson) {
    enableAnnotator();
  }

  const configChangeDisposable = workspace.onDidChangeConfiguration(event => {
    if (event.affectsConfiguration(`${CONFIG_KEY}.enablePackageJsonAnnotations`)) {
      const enabled = workspace.getConfiguration(CONFIG_KEY).get<boolean>('enablePackageJsonAnnotations') ?? true;
      if (enabled) {
        enableAnnotator();
      } else {
        disableAnnotator();
      }
    }
  });

  context.subscriptions.push(configChangeDisposable);
}
