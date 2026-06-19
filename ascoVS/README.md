# ascoVS — IBM i Member Compare

Extension VS Code qui permet de comparer un membre source IBM i entre deux bibliothèques directement depuis l'explorateur **Code for IBM i**.

## Fonctionnalités

- **Comparaison visuelle** — Ouvre le diff natif VS Code côte à côte
- **Rouge** = lignes supprimées par rapport à la bibliothèque de référence
- **Vert** = lignes ajoutées dans votre bibliothèque de développement
- **Même membre, deux bibliothèques** — compare automatiquement le membre du même nom (ex: `DEVLIB/QRPGSRC(MYPGM)` vs `PRODLIB/QRPGSRC(MYPGM)`)
- **Saisie rapide** — tape juste le nom de la bibliothèque de référence, le membre est résolu automatiquement
- **100% en mémoire** — aucun fichier temporaire créé sur le disque

## Prérequis

| Dépendance | Version minimum |
|------------|----------------|
| VS Code | `^1.85.0` |
| [Code for IBM i](https://marketplace.visualstudio.com/items?itemName=HalcyonTech.vscode-ibmi) | Dernière version |
| Connexion active à un système IBM i | — |

> L'extension ne fonctionne pas sans une connexion IBM i active dans Code for IBM i.

## Installation

### Via le fichier .vsix (recommandé)

1. Télécharge [`ascovs-0.0.1.vsix`](./ascovs-0.0.1.vsix)
2. Dans VS Code : `Cmd+Shift+P` → **Extensions: Install from VSIX...**
3. Sélectionne le fichier téléchargé

### Via le code source

```bash
git clone git@github.com:vinleroi/aovsE.git
cd aovsE/ascoVS
npm install
npm run build
```

Puis `F5` dans VS Code pour lancer l'Extension Development Host.

## Utilisation

1. Ouvre le panneau **Code for IBM i** (barre latérale)
2. Connecte-toi à ton système IBM i
3. Navigue jusqu'à un membre source (ex: `DEVLIB > QRPGSRC > MYPGM`)
4. **Clic-droit** sur le membre → **Comparer avec une autre bibliothèque**
5. Saisis le nom de la bibliothèque de référence (ex: `PRODLIB`) et appuie sur Entrée

Le diff s'ouvre avec :
- **Gauche** — bibliothèque de référence (ex: `PRODLIB`) — ce qui existait avant
- **Droite** — ta bibliothèque de dev (ex: `DEVLIB`) — tes modifications

## Gestion des erreurs

| Situation | Message affiché |
|-----------|----------------|
| Pas de connexion IBM i active | `Aucune connexion IBM i active.` |
| Membre introuvable dans la bibliothèque de référence | `Membre MYPGM introuvable dans PRODLIB/QRPGSRC.` |
| Membre introuvable dans la bibliothèque de dev | `Membre MYPGM introuvable dans DEVLIB/QRPGSRC.` |
| Saisie annulée (Échap) | Fermeture silencieuse |

## Stack technique

| Outil | Version | Rôle |
|-------|---------|------|
| TypeScript | `^5.0.0` | Langage |
| VS Code Extension API | `^1.85.0` | API extensions |
| Code for IBM i API | — | Lecture des membres sur le mainframe |
| Jest + ts-jest | `^29.0.0` | Tests unitaires |
| `@vscode/vsce` | `^3.9.2` | Packaging `.vsix` |

## Développement

```bash
npm install       # installe les dépendances
npm test          # lance les 13 tests unitaires
npm run build     # compile TypeScript → out/
npx vsce package  # génère le .vsix
```

### Structure du code

```
src/
├── extension.ts                    # Point d'entrée (activate/deactivate)
├── commands/
│   └── compareWithLibrary.ts       # Logique principale de la commande
├── ibmi/
│   └── ibmiApi.ts                  # Adaptateur API Code for IBM i
└── providers/
    └── memberContentProvider.ts    # TextDocumentContentProvider (in-memory)
```

## Changelog

### 0.0.1
- Comparaison de membres entre deux bibliothèques IBM i
- Diff natif VS Code (rouge/vert)
- Gestion d'erreur par bibliothèque (dev et référence séparément)
- Normalisation automatique du nom de bibliothèque (trim + uppercase)
