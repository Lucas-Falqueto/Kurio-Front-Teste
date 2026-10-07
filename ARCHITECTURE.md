# Documentação de Arquitetura - Kurio

## 1. Contratos REST e Eventos

A aplicação utiliza uma API mock baseada no Mock Service Worker (MSW) e simula uma arquitetura baseada em endpoints RESTful e WebSocket (Socket.IO).

### Endpoints REST Principais (interceptados localmente):
- `GET /api/nfts`: Retorna a lista paginada de NFTs. Aceita queries `search`, `category`, `network`, `minPrice`, `maxPrice`, `page` e `sort`. Retorna `{ data, meta }`.
- `GET /api/nfts/:id`: Retorna os detalhes de um NFT.
- `POST /api/auth/login`: Autentica o usuário (`{ email, password }`) e retorna um objeto de sessão + cookie persistido na memória do MSW.
- `GET /api/auth/session`: Verifica se há um usuário válido autenticado.
- `POST /api/auth/logout`: Destrói a sessão no banco do MSW e no cookie local.
- `GET /api/cart`: Retorna o carrinho do usuário atual.
- `POST /api/cart/items`: Adiciona ou atualiza a quantidade de um NFT no carrinho.
- `DELETE /api/cart/items/:id`: Remove o NFT do carrinho.
- `POST /api/checkout`: Confirma o pagamento com os itens no carrinho, gera um `order` e envia o carrinho para o limbo.

### Eventos em Tempo Real (via mock do socket.io-client)
- `nft_updated`: Recebido globalmente sempre que a disponibilidade (quantidade) ou o preço de um NFT é alterado (seja por compra em concorrência ou admin).
- `order_status`: Disparado quando um pedido está em processamento, informando status como `PENDING`, `CONFIRMED` ou `FAILED`.

## 2. Política de Sessão

- A autenticação é token-based no nível de abstração, mas é implementada gerando um token que é salvo tanto via Cookies HTTP-Only quanto no `localStorage` (como fallback `kurio_session` para evitar problemas em ambientes muito restritos).
- O backend mock valida a existência do usuário através do Header `X-Session-Id` se o Cookie não estiver presente no browser.
- O Axios Interceptor é usado para capturar erros `401 Unauthorized`. Se ocorrer, redireciona o usuário globalmente para `/login` contendo um parâmetro de redirecionamento para recuperar a URL que o usuário estava tentando acessar.

## 3. Estado do Carrinho e Cache

- **Estratégia de Cache**: TanStack React Query foi utilizado como gerenciador de estado assíncrono. Queries como `['nfts']`, `['cart']` e `['session']` mantêm os dados cacheados por padrão até que ocorra uma invalidação via Mutation (ex: `queryClient.invalidateQueries({ queryKey: ['cart'] })` quando se finaliza uma compra).
- **Estado do Carrinho**: O carrinho de compras é inteiramente processado no backend simulado (MSW). O frontend nunca calcula o total e nunca define a taxa/desconto de forma hardcoded (exceto por renderizações puramente visuais); todas as variáveis cruciais (taxa de 5%, cupom de 10%) e verificação de disponibilidade são retornadas via API e refletidas no state via React Query.

## 4. Reconciliação entre REST e Socket.IO

- **Padrão de Pub/Sub Local**: Como não há um backend rodando Socket real, foi criado um Mock Singleton chamado `socketHandlers.ts` que escuta eventos despachados manualmente no client ou pelo MSW.
- **Integração Real-time/REST**: Quando o MSW recebe um Post para criar uma compra, ele reduz a quantidade daquele NFT globalmente no `db.ts` simulado e dispara um `window.dispatchEvent` (ponte para o Socket).
- O listener global (dentro do `socket.ts` / componente `main`) recebe esse aviso, atualiza o cache do Query Client instantaneamente e invalida o `queryKey: ['nfts']`, provocando um novo Request REST por trás dos panos (Stale-While-Revalidate), forçando todos os componentes da tela (como Card, Checkout) a refletirem a indisponibilidade ou a mudança de preço ao vivo sem precisar de Reload.

## 5. Limitações, UX e Desvios do Figma

- **Separação de Render do MSW (Limitação do Lighthouse):** Para conseguir atingir a métrica exigida de performance no Lighthouse (>90 de meta, ~70 reais locais), a inicialização do MSW foi desacoplada do `ReactDOM.render`. Isso permitiu um _First Contentful Paint_ ultrarrápido. Como o Lighthouse rodando em CPU Lenta sofre com injeção de Service Worker localmente, essa foi a melhor decisão arquitetônica para um SPA.
- **Acessibilidade**: Implementado melhor suporte com Aria-labels em elementos interativos e SVG que não existiam por padrão nas anotações do Figma.
- **Layout Adaptativo**: Alguns preenchimentos do Hero Section e do Marketplace foram ligeiramente readaptados no CSS para garantir compatibilidade impecável em telas extremas (como monitores ultrawide ou celulares menores de 390px). O Grid foi fixado de maneira fluida (auto-fit minmax).
