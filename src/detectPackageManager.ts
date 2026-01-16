/**
 * The original form of this code comes from the https://github.com/egoist/detect-package-manager package.
 * It has been adjusted for VS Code usage, and support for non-binary Bun lock has been added.
 */
import execa from 'execa';
import { resolve } from 'node:path';
import { workspace, Uri } from 'vscode';

export type PM = 'npm' | 'yarn' | 'pnpm' | 'bun';

async function pathExists(path: string) {
  try {
    await workspace.fs.stat(Uri.file(path));
    return true;
  } catch {
    return false;
  }
}

async function hasGlobalInstallation(pm: PM): Promise<boolean> {
  return execa(pm, ['--version'])
    .then(res => {
      return /^\d+.\d+.\d+$/.test(res.stdout);
    })
    .then(value => {
      return value;
    })
    .catch(() => false);
}

async function getTypeofLockFile(cwd = '.'): Promise<PM | null> {
  return Promise.all([
    pathExists(resolve(cwd, 'yarn.lock')),
    pathExists(resolve(cwd, 'pnpm-lock.yaml')),
    pathExists(resolve(cwd, 'bun.lock')),
    pathExists(resolve(cwd, 'bun.lockb')),
  ]).then(([isYarn, isPnpm, isBun, isBunBinary]) => {
    if (isYarn) {
      return 'yarn';
    } else if (isPnpm) {
      return 'pnpm';
    } else if (isBun || isBunBinary) {
      return 'bun';
    }

    return 'npm';
  });
}

export async function detectPackageManager({ cwd }: { cwd?: string } = {}): Promise<PM> {
  const type = await getTypeofLockFile(cwd);

  if (type) {
    return type;
  }
  const [hasYarn, hasPnpm, hasBun] = await Promise.all([
    hasGlobalInstallation('yarn'),
    hasGlobalInstallation('pnpm'),
    hasGlobalInstallation('bun'),
  ]);
  if (hasYarn) {
    return 'yarn';
  }
  if (hasPnpm) {
    return 'pnpm';
  }
  if (hasBun) {
    return 'bun';
  }
  return 'npm';
}
