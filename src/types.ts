import { type QuickPickItem } from 'vscode';

export type DirectoryEntry = QuickPickItem & PackageData;

/**
 * Mirror of https://github.com/react-native-community/directory/blob/main/types/index.ts#L41
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
  unmaintained?: boolean | string;
  dev?: boolean;
  template?: boolean;
  newArchitecture?: boolean | string;
  newArchitectureNote?: string;
  alternatives?: string[];
  github: {
    name: string;
    isPackagePrivate: boolean;
    fullName: string;
    description: string;
    registry?: string;
    topics?: string[];
    hasTypes?: boolean;
    newArchitecture?: boolean;
    isArchived?: boolean;
    urls: {
      repo: string;
      clone: string;
      homepage?: string | null;
    };
    stats: {
      hasIssues: boolean;
      hasWiki: boolean;
      hasSponsorships: boolean;
      hasTopics?: boolean;
      updatedAt: Date | string;
      createdAt: Date | string;
      pushedAt: Date | string;
      issues: number;
      subscribers: number;
      stars: number;
      forks: number;
    };
    license: {
      key: string;
      name: string;
      spdxId: string;
      url: string;
      id: string;
    };
    lastRelease?: {
      name: string;
      tagName: string;
      createdAt: Date | string;
      publishedAt: Date | string;
      isPrerelease: boolean;
    };
  };
  npm?: {
    downloads?: number;
    weekDownloads?: number;
    start?: string;
    end?: string;
    period?: string;
  };
  score: number;
  matchingScoreModifiers: string[];
  topicSearchString: string;
  examples?: string[];
  images?: string[];
  npmPkg: string;
  popularity?: number;
  matchScore?: number;
};
