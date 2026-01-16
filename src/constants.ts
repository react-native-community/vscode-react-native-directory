export const BASE_API_URL = 'https://reactnative.directory/api/libraries';
export const KEYWORD_REGEX = /:\w+/g;

export enum ENTRY_OPTION {
  INSTALL = 'Install package in the current workspace',
  INSTALL_SPECIFIC_VERSION = 'Install specific package version in the current workspace',
  VISIT_HOMEPAGE = 'Visit homepage',
  VISIT_REPO = 'Visit GitHub repository',
  VISIT_DIRECTORY = 'Visit React Native Directory page',
  VISIT_NPM = 'Visit npm registry entry',
  VIEW_BUNDLEPHOBIA = 'View BundlePhobia analysis',
  VIEW_LICENSE = 'View license details',
  VIEW_DEPENDENCIES = 'View dependencies',
  VIEW_NIGHTLY_RESULTS = 'View results of Nightly Program tests',
  COPY_NAME = 'Copy package name',
  COPY_REPO_URL = 'Copy GitHub repository URL',
  COPY_NPM_URL = 'Copy npm registry URL',
  COPY_DIRECTORY_URL = 'Copy React Native Directory page URL',
  GO_BACK = '$(newline) Go back to search',
  PLATFORMS = 'Platforms',
  COMPATIBILITY = 'Compatibility',
  CONFIG_PLUGIN = 'Config plugin',
  DIRECTORY_SCORE = 'Directory score',
}

export enum VERSIONS_OPTION {
  CANCEL = '$(newline) Cancel',
}

export enum STRINGS {
  DEFAULT_TITLE = 'Search in React Native Directory',
  PACKAGES_PLACEHOLDER_BUSY = 'Loading directory data...',
  PACKAGES_PLACEHOLDER = 'Search for a package',
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
  horizon: 'horizon',
  tvos: 'tvos',
  visionos: 'visionos',
  vegaos: 'vegaos',
  web: 'web',
  windows: 'windows',
  hasexample: 'hasExample',
  hasimage: 'hasImage',
  hastypes: 'hasTypes',
  ismaintained: 'isMaintained',
  ispopular: 'isPopular',
  wasrecentlyupdated: 'wasRecentlyUpdated',
  newarchitecture: 'newArchitecture',
  configplugin: 'configPlugin',
  nightlyprogram: 'nightlyProgram',
};
