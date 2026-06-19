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
  if (api === 'not-installed') {
    vscode.window.showErrorMessage(
      'Code for IBM i n\'est pas installé. Installez l\'extension "Code for IBM i" (HalcyonTech) depuis le Marketplace VS Code.',
      'Ouvrir le Marketplace'
    ).then(action => {
      if (action === 'Ouvrir le Marketplace') {
        vscode.commands.executeCommand(
          'vscode.open',
          vscode.Uri.parse('vscode:extension/HalcyonTech.vscode-ibmi')
        );
      }
    });
    return;
  }
  if (api === 'not-connected') {
    vscode.window.showErrorMessage('Aucune connexion IBM i active. Connecte-toi via le panneau Code for IBM i.');
    return;
  }

  const rawLibrary = await vscode.window.showInputBox({
    prompt: 'Entrez le nom de la bibliothèque de référence',
    placeHolder: 'ex: PRODLIB',
  });
  if (!rawLibrary) return;

  const refLibrary = rawLibrary.trim().toUpperCase();

  const { library: devLibrary, file, name: memberName } = item.member;

  let devContent: string;
  let refContent: string;

  try {
    devContent = await api.downloadMemberContent(devLibrary, file, memberName);
  } catch (e) {
    console.error(e);
    vscode.window.showErrorMessage(
      `Membre ${memberName} introuvable dans ${devLibrary}/${file}.`
    );
    return;
  }

  try {
    refContent = await api.downloadMemberContent(refLibrary, file, memberName);
  } catch (e) {
    console.error(e);
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
