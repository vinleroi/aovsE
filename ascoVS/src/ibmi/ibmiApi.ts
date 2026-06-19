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

export type IBMiApiError = 'not-installed' | 'not-connected';

export function getIBMiApi(): IBMiApi | IBMiApiError {
  const ext = vscode.extensions.getExtension<CodeForIBMiExports>('halcyontech.vscode-ibmi');
  if (!ext || !ext.isActive) return 'not-installed';

  const connection = ext.exports.instance.getConnection();
  if (!connection) return 'not-connected';

  return {
    downloadMemberContent: (library, file, member) =>
      connection.content.downloadMemberContent(undefined, library, file, member),
  };
}
