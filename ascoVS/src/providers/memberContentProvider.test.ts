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
