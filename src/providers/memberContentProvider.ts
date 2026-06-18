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
