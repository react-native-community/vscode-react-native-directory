import {
  type DecorationOptions,
  type Disposable,
  MarkdownString,
  Range,
  type TextEditor,
  ThemeColor,
  window,
  workspace,
} from 'vscode';

import { BASE_API_URL } from './constants';
import { type PackageJSONDeps, type APICheckResponseData, type DependencyRef } from './types';
import { getCompatibilityList, getDetailLabel, getPlatformsList, numberFormatter } from './utils';

function tryParsePackageJson(text: string): PackageJSONDeps | null {
  try {
    return JSON.parse(text) as PackageJSONDeps;
  } catch {
    return null;
  }
}

function isPackageJsonEditor(editor?: TextEditor): editor is TextEditor {
  if (!editor) {
    return false;
  }

  const doc = editor.document;

  if (!/package\.json$/i.test(doc.fileName)) {
    return false;
  }

  return doc.languageId === 'json' || doc.languageId === 'jsonc';
}

const ENTRY_REGEXP = /^\s*"(?<name>[^"]+)"\s*:\s*"(?<version>(?:\\\\"|[^"])*)"/;

function getDependencyRefsFromPackageJsonText(text: string, editor: TextEditor): DependencyRef[] {
  const parsed = tryParsePackageJson(text);

  if (!parsed) {
    return [];
  }

  const wantedNames = new Set<string>([
    ...Object.keys(parsed.dependencies ?? {}),
    ...Object.keys(parsed.peerDependencies ?? {}),
  ]);

  if (wantedNames.size === 0) {
    return [];
  }

  const refs: DependencyRef[] = [];
  const lines = text.split(/\r?\n/);

  for (let lineNumber = 0; lineNumber < lines.length; lineNumber++) {
    const lineText = lines[lineNumber];
    const entryMatch = ENTRY_REGEXP.exec(lineText);
    const pkgName = entryMatch?.groups?.name;

    if (!pkgName || !wantedNames.has(pkgName)) {
      continue;
    }

    let endChar = lineText.length;
    while (endChar > 0 && /\s/.test(lineText[endChar - 1])) {
      endChar--;
    }

    const anchorPos = editor.document.lineAt(lineNumber).range.start.translate(0, endChar);

    refs.push({ name: pkgName, anchor: new Range(anchorPos, anchorPos) });
  }

  return refs;
}

async function fetchDirectoryInfo(packagesList: string, signal: AbortSignal): Promise<APICheckResponseData | null> {
  const apiUrl = new URL(`${BASE_API_URL}/library`);
  apiUrl.searchParams.append('name', packagesList);

  const response = await fetch(apiUrl.href, { signal });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as APICheckResponseData;
}

export function createPackageJsonDependencyAnnotator(): Disposable {
  const decorationType = window.createTextEditorDecorationType({
    after: {
      margin: '0 0 0 1rem',
    },
  });

  let abortController = new AbortController();
  let refreshTimer: NodeJS.Timeout | undefined;

  function clearActiveEditor() {
    const editor = window.activeTextEditor;
    if (!editor) {
      return;
    }
    editor.setDecorations(decorationType, []);
  }

  function scheduleRefresh(delayMs = 500) {
    if (refreshTimer) {
      clearTimeout(refreshTimer);
    }
    refreshTimer = setTimeout(() => {
      void refreshActiveEditor();
    }, delayMs);
  }

  async function refreshActiveEditor() {
    const editor = window.activeTextEditor;

    if (!isPackageJsonEditor(editor)) {
      return;
    }

    abortController.abort();
    abortController = new AbortController();

    const doc = editor.document;
    const localAbort = abortController;
    const refs = getDependencyRefsFromPackageJsonText(doc.getText(), editor);

    if (refs.length === 0) {
      clearActiveEditor();
      return;
    }

    window.setStatusBarMessage(`React Native Directory: annotating ${refs.length} dependencies…`, 2500);

    const decorations: DecorationOptions[] = [];
    const depsList = refs.map(({ name }) => name).join(',');
    const result = await fetchDirectoryInfo(depsList, localAbort.signal).catch(() => null);

    if (!result) {
      window.setStatusBarMessage('React Native Directory: failed to load annotations', 2500);
      return;
    }

    for (const lib of Object.values(result)) {
      const anchor = refs.find(({ name }) => name === lib.npmPkg)?.anchor;

      if (!anchor) {
        continue;
      }

      const parts = [
        `★ ${numberFormatter.format(lib.github.stats.stars)}`,
        lib.npm?.downloads ? `⧨ ${numberFormatter.format(lib.npm.downloads)}` : undefined,
        lib.unmaintained ? ` • Unmaintained` : undefined,
        lib.newArchitecture || lib.expoGo
          ? ` • New Architecture${lib.newArchitecture === 'new-arch-only' ? ' only' : ''}`
          : undefined,
      ].filter(Boolean);

      const tooltip = new MarkdownString(undefined, true);
      tooltip.appendMarkdown(`$(package) **${lib.npmPkg}**${lib.unmaintained ? ' $(warning) Unmaintained' : ''}\n\n`);

      if (lib.github.description) {
        tooltip.appendMarkdown(`${lib.github.description}\n\n`);
      }

      tooltip.appendMarkdown(`- **Platforms:** ${getPlatformsList(lib).join(', ')}\n`);

      const compatibility = getCompatibilityList(lib);
      if (compatibility.length > 0) {
        tooltip.appendMarkdown(`- **Compatibility:** ${compatibility.join(', ')}\n`);
      }

      tooltip.appendMarkdown(`- **Directory score:** ${lib.score}/100\n\n`);

      if (lib.github.license) {
        tooltip.appendMarkdown(`- **License:**  ${lib.github.license.spdxId}\n\n`);
      }

      if (lib.unmaintained && lib.alternatives && lib.alternatives.length > 0) {
        tooltip.appendMarkdown(`- **Alternatives:** \`${lib.alternatives.join(', ')}\`\n\n`);
      } else {
        tooltip.appendMarkdown('\n');
      }

      tooltip.appendMarkdown(getDetailLabel(lib, true));
      tooltip.appendMarkdown(`\n\n---\n`);
      tooltip.appendMarkdown(`[React Native Directory](https://reactnative.directory/package/${lib.npmPkg}) 🞄 `);
      tooltip.appendMarkdown(`[GitHub](${lib.githubUrl}) 🞄 `);
      tooltip.appendMarkdown(`[npm](https://www.npmjs.com/package/${lib.npmPkg}) 🞄 `);
      tooltip.appendMarkdown(`[Bundlephobia](https://bundlephobia.com/package/${lib.npmPkg})`);

      decorations.push({
        range: anchor,
        hoverMessage: tooltip,
        renderOptions: {
          after: {
            contentText: `${parts.join(' ')}`,
            color: lib.unmaintained
              ? new ThemeColor('statusBarItem.warningBackground')
              : new ThemeColor('editorLineNumber.foreground'),
          },
        },
      });
    }

    if (localAbort.signal.aborted) {
      return;
    }

    editor.setDecorations(decorationType, decorations);
  }

  const disposables: Disposable[] = [
    decorationType,
    window.onDidChangeActiveTextEditor(() => scheduleRefresh()),
    workspace.onDidOpenTextDocument(() => scheduleRefresh()),
    workspace.onDidChangeTextDocument(event => {
      const active = window.activeTextEditor;
      if (!isPackageJsonEditor(active) || event.document.uri.toString() !== active.document.uri.toString()) {
        return;
      }
      scheduleRefresh();
    }),
  ];

  function dispose() {
    abortController.abort();
    if (refreshTimer) {
      clearTimeout(refreshTimer);
    }
    for (const disposable of disposables) {
      disposable.dispose();
    }
  }

  scheduleRefresh(0);

  return { dispose };
}
