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
