import * as vscode from 'vscode';
import axios from 'axios';

import { DirectoryEntry, Library } from './types';

export const numberFormatter = new Intl.NumberFormat('en-EN', { notation: 'compact' });

export enum ENTRY_OPTION {
  INSTALL = 'Install package in the current workspace',
  VISIT_REPO = 'Visit GitHub repository',
  VISIT_NPM = 'Visit npm registry entry',
  COPY_NAME = 'Copy package name',
  COPY_REPO_URL = 'Copy GitHub repository URL',
  COPY_NPM_URL = 'Copy npm registry URL',
  GO_BACK = '$(newline) Go back to search'
}

function getDetailLabel(item: Library) {
  const platforms = [
    item.android ? 'Android' : null,
    item.ios ? 'iOS' : null,
    item.macos ? 'macOS' : null,
    item.tvos ? 'tvOS' : null,
    item.visionos ? 'visionOS' : null,
    item.web ? 'Web' : null,
    item.windows ? 'Windows' : null
  ].filter(Boolean);

  return [
    `$(star) ${numberFormatter.format(item.github.stats.stars)}`,
    `$(gist-fork) ${numberFormatter.format(item.github.stats.forks)}`,
    item.npm?.downloads && `$(arrow-circle-down) ${numberFormatter.format(item.npm.downloads)}`,
    '•',
    platforms.join(', '),
    (item.newArchitecture || item.github.hasTypes) && '•',
    item.newArchitecture && `$(verified) New Architecture`,
    item.github.hasTypes && `$(symbol-type-parameter) Types`
  ]
    .filter(Boolean)
    .join(' ');
}

export async function fetchData(query?: string): Promise<DirectoryEntry[]> {
  try {
    const url = query
      ? `https://reactnative.directory/api/libraries?search=${encodeURIComponent(query)}&order=downloads`
      : `https://reactnative.directory/api/libraries`;

    const { data } = await axios.get(url);

    if ('libraries' in data && Array.isArray(data.libraries)) {
      return data.libraries.map((item: Library) => ({
        label: item.npmPkg,
        description: item.github.description,
        detail: getDetailLabel(item),
        alwaysShow: true,
        ...item
      }));
    } else {
      vscode.window.showErrorMessage('Invalid React Native Directory API response');
      return [];
    }
  } catch (error) {
    console.error(error);
    vscode.window.showErrorMessage('Failed to fetch data from React Native Directory API');
    return [];
  }
}
