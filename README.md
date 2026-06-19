# aovsE — IBM i VS Code Extensions

Collection d'extensions VS Code pour le développement IBM i (AS/400), construites autour de [Code for IBM i](https://marketplace.visualstudio.com/items?itemName=HalcyonTech.vscode-ibmi).

## Extensions disponibles

| Extension | Description | Version |
|-----------|-------------|---------|
| [ascoVS](./ascoVS/) | Comparaison de membres sources entre bibliothèques | 0.0.1 |

## Structure du repo

Chaque extension a son propre dossier avec son `package.json`, ses sources et son `.vsix` prêt à l'emploi.

```
aovsE/
└── ascoVS/         ← Comparaison de membres IBM i
    ├── src/
    ├── ascovs-0.0.1.vsix
    └── README.md
```

## Installation rapide

Télécharge le `.vsix` de l'extension souhaitée, puis dans VS Code :
`Cmd+Shift+P` → **Extensions: Install from VSIX...**
