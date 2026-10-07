# Arquitetura e Decisões de Projeto

## Stack e Ferramentas
- **React + Vite**: Setup base para alta performance no desenvolvimento e build otimizado.
- **TanStack Router**: Roteamento tipado de ponta a ponta com search params (search, category, sort, page) residindo na URL.
- **TanStack Query**: Gerenciamento de estado do servidor, cache e invalidação.
- **MSW (Mock Service Worker)**: Intercepta requisições REST garantindo que o app não precise de backend real.
- **WebSockets (socket.io-client)**: Simula atualizações em tempo real do backend.

## Contratos REST e Eventos
- **`GET /api/nfts`**: Lista NFTs com paginação e filtros.
- **`GET /api/nfts/:id`**: Retorna os detalhes de um NFT.
- **`POST /api/auth/login`**: Autenticação com credenciais fictícias.
- **`GET /api/cart` / `POST /api/cart`**: Gerencia o carrinho sincronizado no servidor mock.
- **`POST /api/orders`**: Processa a compra validando estoque (suporta `idempotencyKey`).
- **Evento Socket `nft.updated`**: Informa mudanças de disponibilidade de estoque.

## Estratégia de Cache e Reconciliação (REST vs Socket.IO)
- O **TanStack Query** é o single source of truth para o estado vindo do servidor.
- Os dados REST são cacheados e revalidados em background.
- Quando o **Socket.IO** recebe um evento de `nft.updated`, ele dispara um `queryClient.invalidateQueries({ queryKey: ['nfts'] })`. Isso reconcilia os dados locais com o "backend", garantindo que a tela reflita a disponibilidade em tempo real sem side-effects no fluxo de compra.

## Política de Sessão
- A sessão utiliza cookies simulados via cabeçalhos HTTP interceptados pelo MSW (`X-Session-Id` e `session`).
- O estado de autenticação reidrata automaticamente no carregamento chamando `GET /api/session`.

## Estado do Carrinho
- O carrinho é tratado de forma otimista pelo React Query (`useMutation` invalidando a query `['cart']`).
- O backend mock calcula e retorna o resumo do carrinho (subtotal, taxas, descontos) para evitar inconsistências no cliente.
- A persistência do carrinho se dá atrelada ao session ID (ou anônimo até o login).

## Decisões de UX, Limitações e Desvios do Figma
- **Skeleton Screens:** Foram aplicadas transições suaves entre loading states para reduzir Cumulative Layout Shift (CLS).
- **Tratamento de Erros:** Exibe banners de fallback e botões de retentativa quando chamadas falham ou a rede cai.
- **Limitação Mock:** Como os eventos de WebSocket e requests MSW são mocks no cliente, eles não trafegam pela aba de "Network" real, aparecendo apenas no console MSW.
- **Desvio Figma:** O tamanho das fontes em mobile foi levemente ajustado (+1px/2px em alguns headings) para melhorar a acessibilidade e legibilidade em touch targets.
