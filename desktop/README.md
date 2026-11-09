# SiteForge Desktop

Aplicativo do SiteForge para Windows, macOS e Linux.

- **Projetos locais ilimitados:** salve e abra arquivos `.psf` no seu computador.
- **Nuvem:** entre com Google para acessar o projeto salvo na nuvem quando tiver internet.
- **Verificar atualizações:** menu *Ajuda → Verificar atualizações*.
- **Formato de arquivo:** `.psf` (SiteForge Project), um JSON com `format`, `version` e `project`.

## Desenvolvimento

É preciso gerar o editor web antes, na raiz do projeto:

```bash
npm run build
cd desktop
npm install
npm start
```

## Gerar instaladores

```bash
cd desktop
npm install
npm run dist
```

Saídas em `desktop/release/`:
- Windows: instalador (`.exe`) e versão portátil (`.exe` sem instalação)
- macOS: `.dmg` e `.zip`
- Linux: `.AppImage` e `.deb`

Também é possível gerar os três sistemas pelo GitHub Actions (workflow *Build desktop app*).

## Login com Google no aplicativo

Adicione `http://127.0.0.1:47831/editor` nas URLs de redirecionamento permitidas do Supabase (Authentication → URL Configuration).
