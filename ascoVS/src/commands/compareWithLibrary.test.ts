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

  it('shows install prompt when Code for IBM i is not installed', async () => {
    (ibmiApiModule.getIBMiApi as jest.Mock).mockReturnValue('not-installed');
    (vscode.window.showErrorMessage as jest.Mock).mockResolvedValue(undefined);
    await compareWithLibrary(mockItem, provider);
    expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
      expect.stringContaining('Code for IBM i'),
      'Ouvrir le Marketplace'
    );
  });

  it('shows connection error when IBM i is not connected', async () => {
    (ibmiApiModule.getIBMiApi as jest.Mock).mockReturnValue('not-connected');
    await compareWithLibrary(mockItem, provider);
    expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
      'Aucune connexion IBM i active. Connecte-toi via le panneau Code for IBM i.'
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

  it('shows error with dev library name when dev member download fails', async () => {
    const mockApi = { downloadMemberContent: jest.fn() };
    mockApi.downloadMemberContent
      .mockRejectedValueOnce(new Error('dev not found'));
    (ibmiApiModule.getIBMiApi as jest.Mock).mockReturnValue(mockApi);
    (vscode.window.showInputBox as jest.Mock).mockResolvedValue('PRODLIB');

    await compareWithLibrary(mockItem, provider);

    expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
      'Membre MYPGM introuvable dans DEVLIB/QRPGSRC.'
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
