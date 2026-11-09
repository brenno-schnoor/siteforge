# Changelog

Todas as mudanças notáveis do SiteForge estão documentadas aqui.

## Desktop v0.0.2

Primeiro aplicativo para Windows, macOS e Linux.

- Editor em janela própria, com servidor local (rotas do editor funcionam offline)
- Arquivos de projeto **SiteForge Project (.psf)**, associados ao aplicativo
- Projetos locais sem limite; nuvem continua disponível com login Google (quando houver internet)
- Menu *Ajuda → Verificar atualizações*
- Versões: instalador e portátil no Windows; `.dmg` e `.zip` no macOS; `.AppImage` e `.deb` no Linux

## v0.0.2

**Editor**
- Camadas por página, arrastar, redimensionar, desfazer/refazer e atalhos de teclado
- Alinhamento estilo Canva, guias e encaixe, com edição de texto no canvas
- Páginas, links entre páginas e upload de imagens
- Transformações e animações ao mover o mouse e ao rolar a página
- Templates: Landing, Portfólio, Produto, Restaurante e Loja
- Busca rápida (⌘K) e nome do projeto editável
- Cor de destaque do editor e do site
- Salvar e abrir projetos em arquivo `.psf`
- Limite de 1 projeto por conta na nuvem, para não sobrecarregar o banco de dados

**Elementos**
- Texto, botão, imagem, contêiner e objetos 3D (6 formas)
- Vídeo (YouTube ou Vimeo), mapa, forma e texto rolante
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
- Publicar gera um `.zip` com o site completo em HTML, CSS e JavaScript, com `sitemap.xml`, `robots.txt` e `seo.json`

**Site público**
- Rastro do mouse, revelação ao rolar, parallax e barra de progresso

**Layout, tema e acessibilidade**
- Tema claro em tom branco amarelado (o site criado não muda com o tema)
- Layout responsivo para celular, tablet e notebook (ajuste fino em andamento)
- Avisos de texto alternativo e de envio de formulário; aviso de projeto grande
- Favicon e ícone da marca em `assets/`

**Correções**
- Botões da barra superior sem ação
- Seletor de idioma que não trocava os textos
- Botões de página e paleta de busca com contraste ruim
- Barra inferior sobreposta ao inspetor em telas menores
- Botão de conta duplicado no canto inferior esquerdo

**Conhecido**
- Interface em telas pequenas ainda precisa de ajustes finos
- Tradução automática usa serviço gratuito com limite diário
- Formulário só envia para endereço https configurado

## v0.0.1

- Primeira versão do editor, publicada no GitHub Pages
- Login com Google e salvamento de projetos no Supabase
- Página 404 e publicação inicial
