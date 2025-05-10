import { QuickPick, window } from 'vscode';

import { DirectoryEntry, PackageData } from './types';

export const BASE_API_URL = 'https://reactnative.directory/api/libraries';
export const KEYWORD_REGEX = /:\w+/g;

export const numberFormatter = new Intl.NumberFormat('en-EN', { notation: 'compact' });

export enum ENTRY_OPTION {
  INSTALL = 'Install package in the current workspace',
  VISIT_HOMEPAGE = 'Visit homepage',
  VISIT_REPO = 'Visit GitHub repository',
  VISIT_NPM = 'Visit npm registry entry',
  VIEW_BUNDLEPHOBIA = 'View BundlePhobia analysis',
  VIEW_LICENSE = 'View license details',
  COPY_NAME = 'Copy package name',
  COPY_REPO_URL = 'Copy GitHub repository URL',
  COPY_NPM_URL = 'Copy npm registry URL',
  GO_BACK = '$(newline) Go back to search',
  PLATFORMS = 'Platforms',
  COMPATIBILITY = 'Compatibility'
}

export enum STRINGS {
  DEFAULT_TITLE = 'Search in React Native Directory',
  PLACEHOLDER_BUSY = 'Loading directory data...',
  PLACEHOLDER = 'Search for a package'
}

/**
 * A subset of API query params mapped with normalized (lowercased) keyword values.
 * @see https://github.com/react-native-community/directory/blob/main/types/index.ts#L14
 */
export const VALID_KEYWORDS_MAP = {
  android: 'android',
  expogo: 'expoGo',
  ios: 'ios',
  macos: 'macos',
  fireos: 'fireos',
  tvos: 'tvos',
  visionos: 'visionos',
  web: 'web',
  windows: 'windows',
  hasexample: 'hasExample',
  hasimage: 'hasImage',
  hastypes: 'hasTypes',
  ismaintained: 'isMaintained',
  ispopular: 'isPopular',
  wasrecentlyupdated: 'wasRecentlyUpdated',
  newarchitecture: 'newArchitecture'
};
export type ValidKeyword = keyof typeof VALID_KEYWORDS_MAP;

function getDetailLabel(item: PackageData) {
  return [
    `$(star) ${numberFormatter.format(item.github.stats.stars)}`,
    `$(gist-fork) ${numberFormatter.format(item.github.stats.forks)}`,
    item.npm?.downloads && `$(arrow-circle-down) ${numberFormatter.format(item.npm.downloads)}`,
    '•',
    getPlatformsList(item).join(', '),
    (item.newArchitecture || item.expoGo || item.github.hasTypes) && '•',
    (item.newArchitecture || item.expoGo) && `$(verified) New Architecture`,
    item.github.hasTypes && `$(symbol-type-parameter) Types`
  ]
    .filter(Boolean)
    .join(' ');
}

export function getCommandToRun({ dev, npmPkg }: DirectoryEntry, preferredManager: string): string {
  switch (preferredManager) {
    case 'bun':
    case 'pnpm':
    case 'yarn':
      return `${preferredManager} add${dev ? ' -D' : ''} ${npmPkg}`;
    default:
      return `${preferredManager} install${dev ? ' -D' : ''} ${npmPkg}`;
  }
}

export async function fetchData(query?: string, keywords?: ValidKeyword[]): Promise<DirectoryEntry[]> {
  try {
    const apiUrl = new URL(BASE_API_URL);

    if (query) {
      apiUrl.searchParams.append('search', query);
      apiUrl.searchParams.append('order', 'downloads');
    }

    if (keywords) {
      keywords.forEach((keyword) => apiUrl.searchParams.append(keyword, 'true'));
    }

    const response = await fetch(apiUrl.href);

    if (response.ok) {
      const data = (await response.json()) as object;

      if ('libraries' in data && Array.isArray(data.libraries)) {
        return data.libraries.map((item: PackageData) => ({
          label: item.npmPkg,
          description: item.github.description,
          detail: getDetailLabel(item),
          alwaysShow: true,
          ...item
        }));
      }
      window.showErrorMessage(`Invalid React Native Directory API response content`);
      return [];
    }
    window.showErrorMessage(`Invalid React Native Directory API response: ${response.status}`);
    return [];
  } catch (error) {
    console.error(error);
    window.showErrorMessage('Failed to fetch data from React Native Directory API');
    return [];
  }
}

export function getPlatformsList(item: PackageData): string[] {
  return [
    item.android ? 'Android' : null,
    item.ios ? 'iOS' : null,
    item.macos ? 'macOS' : null,
    item.tvos ? 'tvOS' : null,
    item.visionos ? 'visionOS' : null,
    item.web ? 'Web' : null,
    item.windows ? 'Windows' : null
  ].filter((platform) => platform !== null);
}

export function getCompatibilityList(item: PackageData): string[] {
  return [item.expoGo ? 'Expo Go' : null, item.fireos ? 'FireOS' : null].filter((entry) => entry !== null);
}

export function formatAsSearchParams(list: string[]) {
  return list.map((entry) => `:${entry.replace(' ', '')}`);
}

export function deduplicateSearchTokens(query: string, tokens: string[]) {
  return Array.from(new Set([...query.split(' '), ...formatAsSearchParams(tokens)])).join(' ');
}

export async function openListWithSearch(packagesPick: QuickPick<DirectoryEntry>, query: string = packagesPick.value) {
  packagesPick.placeholder = STRINGS.PLACEHOLDER_BUSY;
  packagesPick.busy = true;

  packagesPick.value = query;

  packagesPick.show();
  packagesPick.items = await fetchData(query);

  packagesPick.placeholder = STRINGS.PLACEHOLDER;
  packagesPick.busy = false;
}
