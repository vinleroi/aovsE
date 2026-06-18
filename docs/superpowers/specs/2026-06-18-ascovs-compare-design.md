# ascoVS — Extension VS Code : Comparaison de membres IBM i entre bibliothèques

**Date :** 2026-06-18  
**Statut :** Approuvé

---

## Contexte

L'utilisateur travaille avec l'extension **Code for IBM i** (`halcyontech.vscode-ibmi`) pour accéder et modifier des membres sources sur un mainframe IBM i (AS/400). Les sources sont stockées dans des fichiers physiques sources (ex: `QRPGSRC`, `QCLSRC`) au sein de bibliothèques (ex: `DEVLIB`, `PRODLIB`).

Le besoin : comparer un membre dans la bibliothèque de développement (DEVLIB) avec le même membre dans une bibliothèque de référence (PRODLIB) pour visualiser ce qui a été ajouté, supprimé ou modifié.

---

## Objectif

Créer une extension VS Code (`ascoVS`) qui ajoute une commande "Comparer avec une autre bibliothèque" dans le menu contextuel de l'explorateur Code for IBM i. La comparaison s'affiche dans le diff natif VS Code, avec PRODLIB comme référence (gauche) et DEVLIB comme version de travail (droite).

---

## Architecture

### Approche retenue : API publique de Code for IBM i

L'extension s'appuie sur l'API publique exposée par `halcyontech.vscode-ibmi` pour lire les membres. Aucune connexion SSH propre n'est créée — la connexion existante est réutilisée. Les contenus sont exposés via un `TextDocumentContentProvider` virtuel (scheme `memberDiff://`), sans fichiers temporaires sur le disque.

### Flux

```
[Explorateur Code for IBM i]
        ↓ clic-droit → "Comparer avec une autre bibliothèque"
[InputBox → nom de la bibliothèque de référence (ex: PRODLIB)]
        ↓
[API Code for IBM i → lecture membre lib de référence + lib de dev]
        ↓
[2 Virtual TextDocuments via memberDiff:// scheme]
        ↓
[vscode.diff(refUri, devUri, titre) → diff natif VS Code]
```

### Sens du diff

| Côté gauche | Côté droit |
|---|---|
| Bibliothèque de référence (ex: PRODLIB) | Bibliothèque de dev (ex: DEVLIB) |
| Rouge = lignes supprimées par le dev | Vert = lignes ajoutées par le dev |

---

## Composants

### `package.json`
- `extensionDependencies`: `["halcyontech.vscode-ibmi"]`
- Commande : `ascoVS.compareWithLibrary` — "Comparer avec une autre bibliothèque"
- Menu contextuel : `view/item/context` avec `when: viewItem == member`

### `src/extension.ts`
Point d'entrée de l'extension. Active et enregistre la commande `ascoVS.compareWithLibrary` et le `TextDocumentContentProvider`.

### `src/commands/compareWithLibrary.ts`
Logique principale :
1. Récupère l'API Code for IBM i via `vscode.extensions.getExtension('halcyontech.vscode-ibmi')`
2. Extrait depuis l'item de l'arbre : nom du membre, fichier source, bibliothèque source (DEVLIB)
3. Affiche un `InputBox` : "Entrez le nom de la bibliothèque de référence"
4. Appelle l'API pour lire le membre dans les deux bibliothèques
5. Si le membre est introuvable dans la bibliothèque de référence → message d'erreur clair
6. Crée deux URIs virtuelles et ouvre `vscode.diff(refUri, devUri, titre)`

### `src/providers/memberContentProvider.ts`
`TextDocumentContentProvider` enregistré sur le scheme `memberDiff://`.
- Stocke le contenu des membres en mémoire (Map)
- Fournit le contenu à VS Code quand il ouvre les URIs virtuelles

---

## Gestion des erreurs

| Cas | Comportement |
|---|---|
| Membre introuvable dans la bibliothèque de référence | `vscode.window.showErrorMessage("Membre X introuvable dans LIB/FICHIER")` |
| Code for IBM i non connecté | `vscode.window.showErrorMessage("Aucune connexion IBM i active")` |
| Bibliothèque de référence saisie vide | Annulation silencieuse (InputBox annulée) |

---

## Fichiers à créer

```
ascoVS/
├── package.json
├── tsconfig.json
├── src/
│   ├── extension.ts
│   ├── commands/
│   │   └── compareWithLibrary.ts
│   └── providers/
│       └── memberContentProvider.ts
└── docs/
    └── superpowers/
        └── specs/
            └── 2026-06-18-ascovs-compare-design.md
```

---

## Hors périmètre (non inclus dans cette version)

- Édition directe depuis le diff
- Historique des comparaisons
- Comparaison de plusieurs membres à la fois
- Support multi-connexions IBM i simultanées
