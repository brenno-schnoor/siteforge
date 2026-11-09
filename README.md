# SiteForge

SiteForge é um editor visual de websites com foco em composição 3D, movimento e direção de arte. O projeto permite montar páginas visualmente, organizar camadas, editar tipografia e cores, visualizar diferentes dispositivos e experimentar cenas interativas com Three.js.

> Este projeto foi criado usando **vibecoding**: uma abordagem iterativa de desenvolvimento orientada por intenção, exploração visual, prototipagem rápida e refinamento contínuo com auxílio de inteligência artificial. O código continua aberto para revisão, evolução e colaboração da comunidade.


![Imagem do Site](assets/siteforge_home_ref.png)

## Objetivo

O objetivo do SiteForge é aproximar a criação de websites da linguagem de ferramentas visuais como After Effects, Figma e outros ambientes de composição: uma pessoa deve conseguir construir uma superfície digital com identidade, movimento e elementos 3D sem começar por uma tela vazia de código.

O foco atual está em:

- edição visual de páginas, camadas, tipografia, cores e composição;
- cenas 3D interativas com Three.js e resposta ao ponteiro;
- preview desktop, tablet e mobile;
- persistência de projetos por usuário no Supabase;
- login com Google para proteger o workspace;
- interface pública em português, inglês e espanhol;
- tema claro e escuro.

## Versão atual: v0.0.2

**Editor**
- Camadas por página, arrastar, redimensionar, desfazer/refazer e atalhos de teclado
- Alinhamento estilo Canva, guias e encaixe, com edição de texto direta no canvas
- Páginas, links entre páginas e upload de imagens
- Transformações, animação ao mover o mouse e ao rolar a página
- Templates: Landing, Portfólio, Produto, Restaurante e Loja
- Busca rápida (⌘K) e nome do projeto editável
- Limite de 1 projeto por conta, para não sobrecarregar o banco de dados

**Elementos**
- Texto, botão, imagem, contêiner e objetos 3D (6 formas)
- Vídeo (YouTube ou Vimeo), mapa, forma, texto rolante
- Redes sociais com logos e links
- Formulário de contato com campos configuráveis e envio para endereço https
- Anúncio AdSense (ID do editor e do bloco)

**Idiomas**
- Seletor de idioma (menu ou botões) no site
- Tradução automática dos textos, com opção "Não traduzir" por elemento
- Idioma original configurável

**SEO**
- Título, descrição e palavras-chave por página, com prévia de busca

**Publicação**
- Publicar gera um `.zip` com o site completo em HTML, CSS e JavaScript, incluindo `sitemap.xml`, `robots.txt` e `seo.json`

**Layout e tema**
- Tema claro em tom branco amarelado (o site criado não muda com o tema)
- Layout responsivo para celular, tablet e notebook (ainda em ajuste fino)

**Conhecido nesta versão**
- A interface em telas pequenas ainda precisa de ajustes finos
- A tradução automática usa um serviço gratuito com limite diário
- O formulário só envia para um endereço https configurado

## Stack

- React + TypeScript + Vite
- Three.js
- Supabase (autenticação com Google e tabela `projects` com RLS)
- GitHub Pages para publicação do próprio editor
- Express 5 (servidor de desenvolvimento e rotas de apoio)

## Execução local

```bash
npm install
npm run dev
```

O servidor de desenvolvimento escuta na porta `3000`. Para validar uma versão compilada:

```bash
npm run build
npm run preview
```

Para o login e a persistência, configure no ambiente de build as variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (ou use os valores padrão do projeto). Consulte `supabase/schema.sql` para criar a tabela `projects` com as regras de acesso por usuário. Não inclua segredos no repositório.

## Estrutura principal

```text
src/
  App.tsx          Editor protegido: páginas, camadas, elementos, SEO, idiomas e publicação
  PublicSite.tsx   Site público e páginas institucionais
  NotFound.tsx     Página 404
  main.tsx         Roteamento por pathname
  paths.ts         Caminhos com o prefixo do GitHub Pages
  supabase.ts      Login com Google, sessão e salvamento de projetos
  styles.css       Sistema visual e responsividade
  vite-env.d.ts    Tipos das variáveis de ambiente
server/
  index.mjs        Servidor Express de apoio ao desenvolvimento
  db.mjs           Schema auxiliar (não usado pelo site publicado)
supabase/
  schema.sql       Tabela `projects` e regras de acesso (RLS)
public/
  favicon.svg      Ícone do site
  manus-routes.json Manifesto de rotas do Preview
.github/workflows/
  deploy.yml       Build e publicação no GitHub Pages
```

## Como contribuir com uma nova versão

1. Crie uma branch a partir de `main`.
2. Faça as alterações e abra um Pull Request.
3. Depois do merge, o GitHub Pages publica automaticamente.
4. Crie uma tag e uma release no GitHub (por exemplo, `v0.0.3`), descrevendo as mudanças.

## Vídeo de anúncio

![Vídeo de Anúncio](assets/siteforge_ad_1024x576_audio.mp4)

## Estado do projeto

O SiteForge é um protótipo funcional em evolução. A contribuição mais útil neste momento é melhorar a arquitetura do editor, adicionar componentes visuais reutilizáveis, ampliar a persistência de projetos, fortalecer testes e propor novas interações 3D sem perder a clareza da interface.

Consulte [`README_for_contributors.md`](README_for_contributors.md) para orientações de colaboração.

## Licença

A licença ainda deve ser definida pelos mantenedores antes de uma distribuição pública formal.
