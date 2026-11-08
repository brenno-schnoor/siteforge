# SiteForge — entregas

## Editor visual 3D funcional
- [x] Interface completa de editor visual com barra de ferramentas, painel de propriedades, navegador de páginas e canvas central.
- [x] Criação, renomeação, duplicação, ordenação e exclusão de múltiplas páginas dentro de um projeto.
- [x] Montagem visual por botões de inserção de seções e componentes como textos, botões, imagens, contêineres e blocos de conteúdo.
- [x] Biblioteca de elementos 3D em Three.js, com seleção, posicionamento, rotação, escala e ajuste de materiais e iluminação.
- [x] Configuração visual de interações e animações acionadas por movimento, entrada, saída e clique do mouse.
- [x] Controles de design para famílias tipográficas, pesos, tamanhos, espaçamentos, paleta de cores, gradientes, fundos e estilos dos componentes.
- [x] Edição responsiva com modos de visualização para desktop, tablet e celular.
- [x] Pré-visualização interativa em tempo real para testar navegação, cenas 3D e animações sem sair do editor.
- [x] Estrutura de camadas e hierarquia para selecionar, reordenar, agrupar, ocultar e bloquear elementos da página.
- [x] Persistência local do projeto e sincronização remota do projeto autenticado com o banco gerenciado.
- [x] Criar uma tela protegida `/projects` antes do editor, com projeto salvo, ação “Abrir editor” e ação “Novo projeto”.
- [x] Fazer a ação “Novo projeto” persistir o payload inicial explícito, sem depender de uma atualização de estado assíncrona.

## Site público multipágina
- [x] Criar uma tela inicial pública na raiz `/`, com proposta de valor, hero com cena 3D Three.js responsiva, CTAs para o editor e navegação do produto.
- [x] Criar as páginas públicas `/work`, `/integrations` e `/about`, com conteúdo, navegação ativa, rodapé, tipografia e identidade visual coerentes.
- [x] Separar o editor do site público em `/editor`, mantendo `/editor/work`, `/editor/about` e `/preview` navegáveis.
- [x] Implementar tema claro e escuro persistido no navegador, aplicável ao site público e ao workspace do editor.
- [x] Carregar o editor e a cena Three.js pública sob demanda para reduzir o bundle inicial das páginas de marketing.

## Conta e integrações
- [x] Implementar login oficial Manus OAuth com cookie de sessão `SameSite=None; Secure`, callback validado por state/nonce e logout.
- [x] Implementar cadastro persistente de usuários e snapshots de projeto em MySQL gerenciado, com migração aditiva no startup.
- [x] Manter o centro de integrações focado em GitHub, Notion e Analytics, sem billing acoplado.
- [x] Adicionar seção MCP no editor para registrar servidores `https://`, `mcp://` e `manus://`, com escopo local/workspace e aviso para não armazenar tokens no navegador.
- [x] Tornar o login Manus obrigatório para abrir `/editor`, `/editor/work`, `/editor/about` e `/preview`; o site público continua acessível sem sessão.
- [x] Manter o login obrigatório também para `/projects` e mostrar a mesma barreira de sessão antes de listar ou criar projetos.
- [x] Adicionar seletor de idioma PT/EN/ES no cabeçalho público, login, dashboard de projetos e barra superior do editor, com preferência persistida.
- [x] Exibir bandeiras do Brasil, Estados Unidos e Espanha no seletor de idioma, com menu limpo mostrando nome e código de cada idioma.
- [x] Fazer a tradução realmente funcionar: conteúdo da Home, Work, Integrations, About, login, projetos e canvas principal do editor reage imediatamente a PT/EN/ES.
- [x] Manter as bandeiras 🇧🇷 🇺🇸 🇪🇸 visíveis permanentemente no seletor e permitir troca direta por clique, sem exigir abrir o menu.
- [x] Remover o seletor em lista e manter somente os três botões de bandeira: 🇧🇷 Português, 🇺🇸 English e 🇪🇸 Español, com destaque para o idioma ativo.
- [x] Corrigir o erro de WebSocket do Vite no Preview público: HMR desativado por padrão, HTML servido sem `/@vite/client` e apenas um runtime residente na porta 3000.
- [x] Refinar a tela de projetos com hierarquia editorial, maior respiro, cards arredondados, bordas sutis e navegação de conta mais discreta.

## Qualidade de entrega
- [x] Corrigir fallback SPA do Express 5, normalizar `/preview/` e evitar que APIs inexistentes retornem HTML com status 200.
- [x] Corrigir `allowedHosts` no Vite e no middleware Express para o host HTTPS do Preview carregar fora de `localhost`.
- [x] Corrigir descarte de materiais e geometrias Three.js durante desmontagem de cenas para reduzir vazamentos.
- [x] Corrigir round-trip de projetos removendo ícones React do JSON salvo e reidratando ícones por tipo de layer.
- [x] Isolar rascunhos locais pela conta autenticada para evitar mistura de projetos entre usuários do mesmo navegador.
- [x] Corrigir validação de cores, deep-links de páginas novas/duplicadas e comportamento de layers ocultas ou bloqueadas.
- [x] Validar build TypeScript/Vite, rotas públicas, rotas do editor, healthcheck e runtime de produção.
- [x] Remover código, dependências e rotas de planos, Stripe, billing e Google Cloud OAuth; manter apenas Manus OAuth e integrações de workflow/conteúdo.
- [x] Criar README específico sobre vibecoding, objetivo do projeto, arquitetura, vídeo de anúncio e instruções de execução.
- [x] Criar `contributors.md` com escopo técnico, padrões de contribuição, commits e processo de pull request.
