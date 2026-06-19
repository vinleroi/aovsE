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
