# ascoVS — IBM i Member Comparison Extension Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a VS Code extension that adds a "Compare with another library" context menu item on Code for IBM i member tree items, fetching both members and opening VS Code's native diff editor.

**Architecture:** TypeScript VS Code extension that depends on `halcyontech.vscode-ibmi`, reads member content via its public API, exposes that content through a virtual `TextDocumentContentProvider` (scheme `memberDiff://`), and opens VS Code's native diff command with the reference library (PRODLIB) on the left and the dev library (DEVLIB) on the right.

**Tech Stack:** TypeScript 5, VS Code Extension API, Code for IBM i public API (`halcyontech.vscode-ibmi`), Jest + ts-jest for unit tests.

## Global Constraints

- VS Code engine version: `^1.85.0`
- Extension depends on: `halcyontech.vscode-ibmi`
- Command ID: `ascoVS.compareWithLibrary`
- Virtual URI scheme: `memberDiff`
- Context menu `when` clause: `viewItem == member`
- Diff direction: left = reference library (e.g. PRODLIB), right = dev library (e.g. DEVLIB)
- No files written to disk — all content in memory via `TextDocumentContentProvider`

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `jest.config.ts`
- Create: `src/__mocks__/vscode.ts`

**Interfaces:**
- Produces: build and test infrastructure consumed by all subsequent tasks

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "ascovs",
  "displayName": "ascoVS — IBM i Compare",
  "description": "Compare IBM i source members between libraries",
  "version": "0.0.1",
  "engines": { "vscode": "^1.85.0" },
  "categories": ["Other"],
  "extensionDependencies": ["halcyontech.vscode-ibmi"],
  "activationEvents": [],
  "main": "./out/extension.js",
  "contributes": {
    "commands": [
      {
        "command": "ascoVS.compareWithLibrary",
        "title": "Comparer avec une autre bibliothèque"
      }
    ],
    "menus": {
      "view/item/context": [
        {
          "command": "ascoVS.compareWithLibrary",
          "when": "viewItem == member",
          "group": "navigation"
        }
      ]
    }
  },
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "test": "jest"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/vscode": "^1.85.0",
    "jest": "^29.0.0",
    "ts-jest": "^29.0.0",
    "typescript": "^5.0.0"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "target": "ES2020",
    "outDir": "./out",
    "lib": ["ES2020"],
    "sourceMap": true,
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "**/*.test.ts"]
}
```

- [ ] **Step 3: Create `jest.config.ts`**

```typescript
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^vscode$': '<rootDir>/src/__mocks__/vscode.ts'
  },
  testMatch: ['**/*.test.ts']
};
```

- [ ] **Step 4: Create `src/__mocks__/vscode.ts`**

```typescript
export const window = {
  showInputBox: jest.fn(),
  showErrorMessage: jest.fn(),
  showInformationMessage: jest.fn(),
};

export const commands = {
  registerCommand: jest.fn(),
  executeCommand: jest.fn(),
};

export const workspace = {
  registerTextDocumentContentProvider: jest.fn(),
};

export const extensions = {
  getExtension: jest.fn(),
};

export const EventEmitter = jest.fn().mockImplementation(() => ({
  event: jest.fn(),
  fire: jest.fn(),
  dispose: jest.fn(),
}));

export const Uri = {
  parse: jest.fn((str: string) => ({
    toString: () => str,
    scheme: str.split(':')[0],
    authority: '',
    path: '',
  })),
  from: jest.fn((parts: { scheme: string; authority: string; path: string }) => ({
    toString: () => `${parts.scheme}://${parts.authority}${parts.path}`,
    scheme: parts.scheme,
    authority: parts.authority,
    path: parts.path,
  })),
};
```

- [ ] **Step 5: Install dependencies**

```bash
cd /Users/ahadji/Desktop/ascoVS && npm install
```

Expected: `node_modules/` created, no errors.

- [ ] **Step 6: Verify test infrastructure**

Create `src/sanity.test.ts`:
```typescript
describe('sanity', () => {
  it('runs', () => expect(1 + 1).toBe(2));
});
```

Run: `npm test`
Expected: `1 passed`

Delete `src/sanity.test.ts`.

- [ ] **Step 7: Commit**

```bash
git add package.json tsconfig.json jest.config.ts src/__mocks__/vscode.ts
git commit -m "chore: scaffold ascoVS extension project"
```

---

### Task 2: MemberContentProvider

**Files:**
- Create: `src/providers/memberContentProvider.ts`
- Create: `src/providers/memberContentProvider.test.ts`

**Interfaces:**
- Produces:
  - `class MemberContentProvider implements vscode.TextDocumentContentProvider`
  - `provider.set(uri: vscode.Uri, content: string): void`
  - `provider.provideTextDocumentContent(uri: vscode.Uri): string`

- [ ] **Step 1: Write the failing test**

Create `src/providers/memberContentProvider.test.ts`:
```typescript
import { MemberContentProvider } from './memberContentProvider';
import { Uri } from 'vscode';

describe('MemberContentProvider', () => {
  let provider: MemberContentProvider;

  beforeEach(() => {
    provider = new MemberContentProvider();
  });

  it('returns empty string for unknown URI', () => {
    const uri = Uri.from({ scheme: 'memberDiff', authority: 'DEVLIB', path: '/QRPGSRC/MYPGM' });
    expect(provider.provideTextDocumentContent(uri)).toBe('');
  });

  it('returns stored content for a known URI', () => {
    const uri = Uri.from({ scheme: 'memberDiff', authority: 'DEVLIB', path: '/QRPGSRC/MYPGM' });
    provider.set(uri, 'DCL-F MYFILE DISK;');
    expect(provider.provideTextDocumentContent(uri)).toBe('DCL-F MYFILE DISK;');
  });

  it('distinguishes between different URIs', () => {
    const devUri = Uri.from({ scheme: 'memberDiff', authority: 'DEVLIB', path: '/QRPGSRC/MYPGM' });
    const prodUri = Uri.from({ scheme: 'memberDiff', authority: 'PRODLIB', path: '/QRPGSRC/MYPGM' });
    provider.set(devUri, 'new code');
    provider.set(prodUri, 'old code');
    expect(provider.provideTextDocumentContent(devUri)).toBe('new code');
    expect(provider.provideTextDocumentContent(prodUri)).toBe('old code');
  });
});
```

- [ ] **Step 2: Run test — verify it fails**

```bash
npm test -- --testPathPattern=memberContentProvider
```

Expected: FAIL — `Cannot find module './memberContentProvider'`

- [ ] **Step 3: Implement `MemberContentProvider`**

Create `src/providers/memberContentProvider.ts`:
```typescript
import * as vscode from 'vscode';

export class MemberContentProvider implements vscode.TextDocumentContentProvider {
  private readonly _store = new Map<string, string>();

  provideTextDocumentContent(uri: vscode.Uri): string {
    return this._store.get(uri.toString()) ?? '';
  }

  set(uri: vscode.Uri, content: string): void {
    this._store.set(uri.toString(), content);
  }
}
```

- [ ] **Step 4: Run test — verify it passes**

```bash
npm test -- --testPathPattern=memberContentProvider
```

Expected: `3 passed`

- [ ] **Step 5: Commit**

```bash
git add src/providers/memberContentProvider.ts src/providers/memberContentProvider.test.ts
git commit -m "feat: add MemberContentProvider for virtual member documents"
```

---

### Task 3: IBM i API Adapter

**Files:**
- Create: `src/ibmi/ibmiApi.ts`
- Create: `src/ibmi/ibmiApi.test.ts`

**Interfaces:**
- Produces:
  - `function getIBMiApi(): IBMiApi | undefined`
  - `interface IBMiApi { downloadMemberContent(library: string, file: string, member: string): Promise<string> }`

This thin adapter wraps the Code for IBM i extension API so the command logic is testable without a live IBM i connection.

- [ ] **Step 1: Write the failing test**

Create `src/ibmi/ibmiApi.test.ts`:
```typescript
import * as vscode from 'vscode';
import { getIBMiApi } from './ibmiApi';

describe('getIBMiApi', () => {
  afterEach(() => jest.clearAllMocks());

  it('returns undefined when Code for IBM i is not installed', () => {
    (vscode.extensions.getExtension as jest.Mock).mockReturnValue(undefined);
    expect(getIBMiApi()).toBeUndefined();
  });

  it('returns undefined when no active connection', () => {
    (vscode.extensions.getExtension as jest.Mock).mockReturnValue({
      exports: { instance: { getConnection: () => undefined } },
    });
    expect(getIBMiApi()).toBeUndefined();
  });

  it('returns an api object when connection is active', () => {
    const mockDownload = jest.fn().mockResolvedValue('source code');
    (vscode.extensions.getExtension as jest.Mock).mockReturnValue({
      exports: {
        instance: {
          getConnection: () => ({ content: { downloadMemberContent: mockDownload } }),
        },
      },
    });
    expect(getIBMiApi()).toBeDefined();
  });

  it('delegates downloadMemberContent with asp=undefined', async () => {
    const mockDownload = jest.fn().mockResolvedValue('DCL-F MYFILE DISK;');
    (vscode.extensions.getExtension as jest.Mock).mockReturnValue({
      exports: {
        instance: {
          getConnection: () => ({ content: { downloadMemberContent: mockDownload } }),
        },
      },
    });
    const api = getIBMiApi()!;
    const result = await api.downloadMemberContent('DEVLIB', 'QRPGSRC', 'MYPGM');
    expect(mockDownload).toHaveBeenCalledWith(undefined, 'DEVLIB', 'QRPGSRC', 'MYPGM');
    expect(result).toBe('DCL-F MYFILE DISK;');
  });
});
```

- [ ] **Step 2: Run test — verify it fails**

```bash
npm test -- --testPathPattern=ibmiApi
```

Expected: FAIL — `Cannot find module './ibmiApi'`

- [ ] **Step 3: Implement `ibmiApi.ts`**

Create `src/ibmi/ibmiApi.ts`:
```typescript
import * as vscode from 'vscode';

export interface IBMiApi {
  downloadMemberContent(library: string, file: string, member: string): Promise<string>;
}

type IBMiConnection = {
  content: {
    downloadMemberContent(
      asp: string | undefined,
      library: string,
      file: string,
      member: string
    ): Promise<string>;
  };
};

type CodeForIBMiExports = {
  instance: { getConnection(): IBMiConnection | undefined };
};

export function getIBMiApi(): IBMiApi | undefined {
  const ext = vscode.extensions.getExtension<CodeForIBMiExports>('halcyontech.vscode-ibmi');
  if (!ext) return undefined;

  const connection = ext.exports.instance.getConnection();
  if (!connection) return undefined;

  return {
    downloadMemberContent: (library, file, member) =>
      connection.content.downloadMemberContent(undefined, library, file, member),
  };
}
```

- [ ] **Step 4: Run test — verify it passes**

```bash
npm test -- --testPathPattern=ibmiApi
```

Expected: `4 passed`

- [ ] **Step 5: Commit**

```bash
git add src/ibmi/ibmiApi.ts src/ibmi/ibmiApi.test.ts
git commit -m "feat: add IBM i API adapter"
```

---

### Task 4: compareWithLibrary Command

**Files:**
- Create: `src/commands/compareWithLibrary.ts`
- Create: `src/commands/compareWithLibrary.test.ts`

**Interfaces:**
- Consumes:
  - `getIBMiApi(): IBMiApi | undefined` from `../ibmi/ibmiApi`
  - `class MemberContentProvider` with `set(uri, content)` from `../providers/memberContentProvider`
- Produces:
  - `interface MemberTreeItem { member: { library: string; file: string; name: string } }`
  - `async function compareWithLibrary(item: MemberTreeItem, provider: MemberContentProvider): Promise<void>`

- [ ] **Step 1: Write the failing test**

Create `src/commands/compareWithLibrary.test.ts`:
```typescript
import * as vscode from 'vscode';
import { compareWithLibrary, MemberTreeItem } from './compareWithLibrary';
import { MemberContentProvider } from '../providers/memberContentProvider';
import * as ibmiApiModule from '../ibmi/ibmiApi';

jest.mock('../ibmi/ibmiApi');

describe('compareWithLibrary', () => {
  let provider: MemberContentProvider;
  const mockItem: MemberTreeItem = {
    member: { library: 'DEVLIB', file: 'QRPGSRC', name: 'MYPGM' },
  };

  beforeEach(() => {
    provider = new MemberContentProvider();
    jest.clearAllMocks();
  });

  it('shows error when no IBM i connection', async () => {
    (ibmiApiModule.getIBMiApi as jest.Mock).mockReturnValue(undefined);
    await compareWithLibrary(mockItem, provider);
    expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
      'Aucune connexion IBM i active.'
    );
  });

  it('does nothing when user cancels the input box', async () => {
    (ibmiApiModule.getIBMiApi as jest.Mock).mockReturnValue({ downloadMemberContent: jest.fn() });
    (vscode.window.showInputBox as jest.Mock).mockResolvedValue(undefined);
    await compareWithLibrary(mockItem, provider);
    expect(vscode.commands.executeCommand).not.toHaveBeenCalled();
  });

  it('shows error when member not found in reference library', async () => {
    const mockApi = { downloadMemberContent: jest.fn() };
    mockApi.downloadMemberContent
      .mockResolvedValueOnce('dev content')
      .mockRejectedValueOnce(new Error('not found'));
    (ibmiApiModule.getIBMiApi as jest.Mock).mockReturnValue(mockApi);
    (vscode.window.showInputBox as jest.Mock).mockResolvedValue('PRODLIB');

    await compareWithLibrary(mockItem, provider);

    expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
      'Membre MYPGM introuvable dans PRODLIB/QRPGSRC.'
    );
    expect(vscode.commands.executeCommand).not.toHaveBeenCalled();
  });

  it('opens diff editor with ref on left and dev on right', async () => {
    const mockApi = { downloadMemberContent: jest.fn() };
    mockApi.downloadMemberContent
      .mockResolvedValueOnce('dev content')
      .mockResolvedValueOnce('prod content');
    (ibmiApiModule.getIBMiApi as jest.Mock).mockReturnValue(mockApi);
    (vscode.window.showInputBox as jest.Mock).mockResolvedValue('PRODLIB');

    await compareWithLibrary(mockItem, provider);

    expect(provider.provideTextDocumentContent(
      vscode.Uri.from({ scheme: 'memberDiff', authority: 'DEVLIB', path: '/QRPGSRC/MYPGM' })
    )).toBe('dev content');
    expect(provider.provideTextDocumentContent(
      vscode.Uri.from({ scheme: 'memberDiff', authority: 'PRODLIB', path: '/QRPGSRC/MYPGM' })
    )).toBe('prod content');
    expect(vscode.commands.executeCommand).toHaveBeenCalledWith(
      'vscode.diff',
      expect.objectContaining({ authority: 'PRODLIB' }),
      expect.objectContaining({ authority: 'DEVLIB' }),
      'MYPGM — PRODLIB ↔ DEVLIB'
    );
  });
});
```

- [ ] **Step 2: Run test — verify it fails**

```bash
npm test -- --testPathPattern=compareWithLibrary
```

Expected: FAIL — `Cannot find module './compareWithLibrary'`

- [ ] **Step 3: Implement `compareWithLibrary.ts`**

Create `src/commands/compareWithLibrary.ts`:
```typescript
import * as vscode from 'vscode';
import { getIBMiApi } from '../ibmi/ibmiApi';
import { MemberContentProvider } from '../providers/memberContentProvider';

export interface MemberTreeItem {
  member: {
    library: string;
    file: string;
    name: string;
  };
}

export async function compareWithLibrary(
  item: MemberTreeItem,
  provider: MemberContentProvider
): Promise<void> {
  const api = getIBMiApi();
  if (!api) {
    vscode.window.showErrorMessage('Aucune connexion IBM i active.');
    return;
  }

  const refLibrary = await vscode.window.showInputBox({
    prompt: 'Entrez le nom de la bibliothèque de référence',
    placeHolder: 'ex: PRODLIB',
  });
  if (!refLibrary) return;

  const { library: devLibrary, file, name: memberName } = item.member;

  let devContent: string;
  let refContent: string;

  try {
    [devContent, refContent] = await Promise.all([
      api.downloadMemberContent(devLibrary, file, memberName),
      api.downloadMemberContent(refLibrary, file, memberName),
    ]);
  } catch {
    vscode.window.showErrorMessage(
      `Membre ${memberName} introuvable dans ${refLibrary}/${file}.`
    );
    return;
  }

  const devUri = vscode.Uri.from({
    scheme: 'memberDiff',
    authority: devLibrary,
    path: `/${file}/${memberName}`,
  });
  const refUri = vscode.Uri.from({
    scheme: 'memberDiff',
    authority: refLibrary,
    path: `/${file}/${memberName}`,
  });

  provider.set(devUri, devContent);
  provider.set(refUri, refContent);

  await vscode.commands.executeCommand(
    'vscode.diff',
    refUri,
    devUri,
    `${memberName} — ${refLibrary} ↔ ${devLibrary}`
  );
}
```

- [ ] **Step 4: Run test — verify it passes**

```bash
npm test -- --testPathPattern=compareWithLibrary
```

Expected: `4 passed`

- [ ] **Step 5: Run full test suite**

```bash
npm test
```

Expected: all tests pass (Tasks 2, 3, 4 combined).

- [ ] **Step 6: Commit**

```bash
git add src/commands/compareWithLibrary.ts src/commands/compareWithLibrary.test.ts
git commit -m "feat: add compareWithLibrary command"
```

---

### Task 5: Extension Entry Point & Build

**Files:**
- Create: `src/extension.ts`
- Create: `.vscodeignore`

**Interfaces:**
- Consumes:
  - `class MemberContentProvider` with `set(uri, content)` and `provideTextDocumentContent(uri)` from `./providers/memberContentProvider`
  - `compareWithLibrary(item: MemberTreeItem, provider: MemberContentProvider)` from `./commands/compareWithLibrary`
  - `interface MemberTreeItem` from `./commands/compareWithLibrary`

- [ ] **Step 1: Create `src/extension.ts`**

```typescript
import * as vscode from 'vscode';
import { MemberContentProvider } from './providers/memberContentProvider';
import { compareWithLibrary, MemberTreeItem } from './commands/compareWithLibrary';

const SCHEME = 'memberDiff';

export function activate(context: vscode.ExtensionContext): void {
  const provider = new MemberContentProvider();

  context.subscriptions.push(
    vscode.workspace.registerTextDocumentContentProvider(SCHEME, provider)
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      'ascoVS.compareWithLibrary',
      (item: MemberTreeItem) => compareWithLibrary(item, provider)
    )
  );
}

export function deactivate(): void {}
```

- [ ] **Step 2: Create `.vscodeignore`**

```
.vscode/**
src/**
node_modules/**
.gitignore
jest.config.ts
tsconfig.json
**/*.test.ts
**/*.map
```

- [ ] **Step 3: Build the extension**

```bash
cd /Users/ahadji/Desktop/ascoVS && npm run build
```

Expected: `out/` directory created with `extension.js` and no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add src/extension.ts .vscodeignore
git commit -m "feat: wire extension entry point and build"
```

---

### Task 6: Manual Integration Test

This task requires VS Code with Code for IBM i connected to a live IBM i system.

- [ ] **Step 1: Launch Extension Development Host**

Open the project in VS Code:
```bash
code /Users/ahadji/Desktop/ascoVS
```

Press `F5`. A second VS Code window (Extension Development Host) opens with `ascoVS` loaded.

- [ ] **Step 2: Verify context menu**

In the Extension Development Host:
1. Open the Code for IBM i panel (left sidebar)
2. Connect to an IBM i system
3. Navigate to a member (e.g., `DEVLIB > QRPGSRC > MYPGM`)
4. Right-click on the member
5. Verify "Comparer avec une autre bibliothèque" appears

- [ ] **Step 3: Verify successful comparison**

1. Click "Comparer avec une autre bibliothèque"
2. Type the reference library (e.g., `PRODLIB`) and press Enter
3. Verify the diff editor opens with title `MYPGM — PRODLIB ↔ DEVLIB`
4. Verify PRODLIB is on the left, DEVLIB on the right
5. Verify red = lines removed from PRODLIB, green = lines added in DEVLIB

- [ ] **Step 4: Verify error case**

1. Right-click on a member → "Comparer avec une autre bibliothèque"
2. Type a library where the member does NOT exist (e.g., `FAKLIB`)
3. Verify the error message: `Membre MYPGM introuvable dans FAKLIB/QRPGSRC.`

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: complete ascoVS IBM i member comparison extension"
```
