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
