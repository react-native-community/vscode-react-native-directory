import { type QuickPick, window } from 'vscode';

import { type APIResponseData, type DirectoryEntry, type PackageData, type ValidKeyword } from './types';
import { BASE_API_URL, STRINGS } from './constants';

export const numberFormatter = new Intl.NumberFormat('en-EN', { notation: 'compact' });

export function getDetailLabel(item: PackageData, skipPlatforms = false): string {
  const platforms = getPlatformsList(item);
  return [
    `$(star) ${numberFormatter.format(item.github.stats.stars)}`,
    `$(gist-fork) ${numberFormatter.format(item.github.stats.forks)}`,
    item.npm?.downloads && `$(arrow-circle-down) ${numberFormatter.format(item.npm.downloads)}`,
    (item.dev ?? item.template) && '•',
    item.dev && '$(tools) Dev Tool',
    item.template && '$(folder-library) Template',
    !skipPlatforms && platforms.length && '•',
    !skipPlatforms && platforms.join(', '),
    (item.newArchitecture ?? item.expoGo) && '•',
    (item.newArchitecture ?? item.expoGo) &&
      `$(verified) New Architecture${item.newArchitecture === 'new-arch-only' ? ' only' : ''}`,
    item.github.hasTypes && `• $(symbol-type-parameter) Types`,
    item.nightlyProgram && `• $(beaker) Nightly Program`,
  ]
    .filter(Boolean)
    .join(' ');
}

export function getCommandToRun({ dev, npmPkg }: DirectoryEntry, preferredManager: string, version?: string): string {
  switch (preferredManager) {
    case 'bun':
    case 'pnpm':
    case 'yarn':
      return `${preferredManager} add${dev ? ' -D' : ''} ${npmPkg}${version ? `@${version}` : ''}`;
    default:
      return `${preferredManager} install${dev ? ' -D' : ''} ${npmPkg}${version ? `@${version}` : ''}`;
  }
}

const EMPTY_RESULT = {
  libraries: [],
  total: 0,
};

export async function fetchData(query?: string, keywords?: ValidKeyword[]): Promise<APIResponseData> {
  try {
    const apiUrl = new URL(BASE_API_URL);

    if (query) {
      apiUrl.searchParams.append('search', query);
      apiUrl.searchParams.append('order', 'downloads');
    }

    if (keywords) {
      keywords.forEach(keyword => apiUrl.searchParams.append(keyword, 'true'));
    }

    const response = await fetch(apiUrl.href);

    if (response.ok) {
      const data = (await response.json()) as APIResponseData;

      if ('libraries' in data && Array.isArray(data.libraries)) {
        return {
          libraries: data.libraries.map((item: PackageData) => ({
            label: item.npmPkg,
            description: item.github.description ?? 'No description',
            detail: getDetailLabel(item),
            alwaysShow: true,
            ...item,
          })),
          total: data.total ?? 0,
        };
      }
      window.showErrorMessage(`Invalid React Native Directory API response content`);
      return EMPTY_RESULT;
    }
    window.showErrorMessage(`Invalid React Native Directory API response: ${response.status}`);
    return EMPTY_RESULT;
  } catch (error) {
    console.error(error);
    window.showErrorMessage('Failed to fetch data from React Native Directory API');
    return EMPTY_RESULT;
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
    item.windows ? 'Windows' : null,
  ].filter(platform => platform !== null);
}

export function getCompatibilityList(item: PackageData): string[] {
  return [
    item.expoGo ? 'Expo Go' : null,
    item.fireos ? 'FireOS' : null,
    item.horizon ? 'Meta Horizon OS' : null,
    item.vegaos ? 'Vega OS' : null,
  ].filter(entry => entry !== null);
}

export function formatAsSearchParams(list: string[]) {
  return list.map(entry => {
    if (entry === 'Meta Horizon OS') {
      return ':horizon';
    }
    return `:${entry.replaceAll(' ', '')}`;
  });
}

export function deduplicateSearchTokens(query: string, tokens: string[]) {
  return Array.from(new Set([...query.split(' '), ...formatAsSearchParams(tokens)])).join(' ');
}

export async function openListWithSearch(
  packagesPick: QuickPick<DirectoryEntry>,
  query: string | undefined = packagesPick.value
) {
  packagesPick.placeholder = STRINGS.PACKAGES_PLACEHOLDER_BUSY;
  packagesPick.busy = true;

  if (query) {
    packagesPick.value = query;
  }

  packagesPick.show();
  packagesPick.items = (await fetchData(query)).libraries;

  packagesPick.placeholder = STRINGS.PACKAGES_PLACEHOLDER;
  packagesPick.title = STRINGS.DEFAULT_TITLE;
  packagesPick.busy = false;
}

export function getEntryTypeLabel(entry: DirectoryEntry): string {
  if (entry.template) {
    return ' template';
  } else if (entry.dev) {
    return ' development tool';
  }
  return 'library';
}

export function getMatchesCountLabel(count: number = 0): string {
  return `${numberFormatter.format(count)} ${pluralize('match', count)}`;
}

export function invertObject(obj: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [v, k]));
}

export function pluralize(word: string, count: number) {
  if (count === 1) {
    return word;
  }

  if (/[^aeiou]y$/i.test(word)) {
    return word.replace(/y$/i, 'ies');
  }

  if (/(s|sh|ch|x|z)$/i.test(word)) {
    return `${word}es`;
  }

  return `${word}s`;
}
