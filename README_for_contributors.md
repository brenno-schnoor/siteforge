# Guia de colaboradores

Obrigado pelo interesse em contribuir com o SiteForge. Este projeto está em fase de evolução aberta e prioriza experimentação visual, código legível e pequenas entregas que possam ser revisadas com facilidade.

## Primeiros passos

1. Faça um fork ou clone do repositório.
2. Instale as dependências com `npm install`.
3. Rode `npm run dev` e abra o endereço local na porta `3000`.
4. Antes de abrir um pull request, execute `npm run build`.

## Onde contribuir

- **Editor:** novos elementos, propriedades, interações, atalhos e melhorias de acessibilidade.
- **3D:** cenas Three.js, materiais, iluminação, animações e performance.
- **Workspace:** projetos, persistência, navegação e estados de autenticação Google.
- **Interface pública:** páginas institucionais, responsividade, temas e traduções PT/EN/ES.
- **MCP:** descoberta, configuração e apresentação de servidores Model Context Protocol.
- **Qualidade:** testes, documentação, correções de bugs e redução de bundle.

## Padrões esperados

- Preserve a direção visual do SiteForge: tipografia editorial, contraste alto, lime como destaque e movimento com intenção.
- Prefira componentes pequenos e estados explícitos a condicionais difíceis de rastrear.
- Não adicione credenciais, tokens, cookies de sessão ou arquivos `.env` ao Git.
- Não reintroduza planos pagos, Stripe, billing ou login Google Cloud sem uma decisão explícita dos mantenedores.
- Mantenha o login com Google obrigatório para acessar o editor e respeite o isolamento dos projetos por usuário.
- Ao alterar rotas, atualize `public/manus-routes.json`.
- Ao alterar textos públicos, atualize os três idiomas quando aplicável.
- Para mudanças grandes, explique a motivação e inclua capturas de tela ou um vídeo curto quando isso ajudar a revisar o comportamento visual.

## Commits e pull requests

Use mensagens objetivas, por exemplo:

```text
feat: add draggable layer handles
fix: preserve project pages after refresh
refactor: split scene inspector controls
```

Um pull request deve explicar:

- o problema ou oportunidade;
- o que foi alterado;
- como validar localmente;
- limitações conhecidas;
- se houve impacto em banco, rotas ou autenticação.

## Relatando bugs

Inclua o navegador, sistema operacional, rota, passos para reproduzir, resultado esperado, resultado observado e qualquer erro do console. Para problemas visuais, informe também o tamanho aproximado da janela e o tema ativo.

## Direção do projeto

O objetivo é fazer o SiteForge parecer uma ferramenta visual profissional, não apenas um CRUD com um canvas. Contribuições devem buscar equilíbrio entre expressividade, clareza, acessibilidade e performance.

## Como registrar meu nome no projeto?

Adicione o seu nome e seu link do github em [Contributors.md](Contributors.md) por meio de uma nova branch com o seu nome.
