import { type QuickPickItem } from 'vscode';
import { VALID_KEYWORDS_MAP } from './constants';

export type DirectoryEntry = QuickPickItem & PackageData;

export type ValidKeyword = keyof typeof VALID_KEYWORDS_MAP;

/**
 * Mirror of React Native Directory library type.
 * @see https://github.com/react-native-community/directory/blob/main/types/index.ts#L41
 */
export type PackageData = {
  githubUrl: string;
  ios?: boolean;
  android?: boolean;
  web?: boolean;
  expoGo?: boolean;
  windows?: boolean;
  macos?: boolean;
  fireos?: boolean;
  tvos?: boolean;
  visionos?: boolean;
  horizon?: boolean;
  vegaos?: boolean | string;
  unmaintained?: boolean;
  dev?: boolean;
  template?: boolean;
  newArchitecture?: boolean | 'new-arch-only';
  newArchitectureNote?: string;
  configPlugin?: boolean | string;
  alternatives?: string[];
  npmPkg: string;
  examples?: string[];
  images?: string[];
  github: {
    name: string;
    fullName: string;
    description?: string;
    registry?: string;
    topics?: string[];
    hasTypes?: boolean;
    newArchitecture?: boolean;
    isArchived?: boolean;
    isPrivate?: boolean;
    hasNativeCode: boolean;
    hasReadme?: boolean;
    configPlugin?: boolean;
    moduleType?: 'expo' | 'nitro' | 'turbo';
    urls: {
      repo: string;
      homepage?: string | null;
    };
    stats: {
      hasIssues: boolean;
      hasWiki: boolean;
      hasProjects: boolean;
      hasSponsorships: boolean;
      hasDiscussions: boolean;
      hasVulnerabilityAlerts: boolean;
      hasTopics?: boolean;
      updatedAt: Date | string;
      createdAt: Date | string;
      pushedAt: Date | string;
      issues: number;
      subscribers: number;
      stars: number;
      forks: number;
      dependencies?: number;
    };
    license: {
      key: string;
      name: string;
      spdxId: string;
      url: string;
      id: string;
    };
  };
  npm?: {
    downloads?: number;
    weekDownloads?: number;
    size?: number;
    versionsCount?: number;
    latestRelease?: string;
    latestReleaseDate?: string;
    hasReadme?: boolean;
  };
  score: number;
  matchingScoreModifiers: string[];
  topicSearchString: string;
  popularity?: number;
  matchScore?: number;
  nightlyProgram?: boolean;
};

export type APIResponseData = {
  libraries: DirectoryEntry[];
  total?: number;
};

export type NpmRegistryData = {
  'dist-tags': Record<string, string>;
  versions: Record<
    string,
    {
      version: string;
    } & Record<string, unknown>
  >;
};
