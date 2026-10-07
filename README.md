# Kurio - NFT Marketplace

Este é o projeto frontend para o marketplace de NFTs "Kurio", construído como uma Single Page Application (SPA) utilizando **React**, **Vite** e **TanStack Router**. O aplicativo utiliza um backend inteiramente simulado localmente no navegador via **MSW (Mock Service Worker)** e eventos em tempo real via **Socket.IO-client** com Mocking.

## Funcionalidades Implementadas
- **Navegação SPA:** Roteamento com TanStack Router (rotas baseadas em arquivos).
- **Mocks Completos:** API REST interceptada com MSW. O banco de dados fica persistido localmente via `localStorage`.
- **Eventos em Tempo Real:** Uma arquitetura simulada de Socket.IO despacha eventos (`nft_updated`, `order_status`) refletindo mudanças instantâneas na UI.
- **Carrinho e Pagamento:** Fluxo de e-commerce simulando validações, descontos (cupom `10OFF`), limites de estoque e pagamentos com falha/sucesso.
- **Acessibilidade:** Navegação por teclado, focos visíveis consistentes, contraste, uso de landmarks e ARIA roles.
- **Performance:** Divisão de código otimizada, imagens lazy-loaded e interceptação nativa sem tela em branco para o melhor FCP/LCP possível com a infraestrutura de mocks atual.

## Variáveis de Ambiente
O projeto não exige variáveis de ambiente estritas para rodar com Mocks (já que tudo é interceptado no cliente). A única configuração de Vercel está incluída no `vercel.json` na raiz para fallback em SPA. Nenhuma chave secreta é necessária.

## Comandos de Execução

Instalação das dependências:
```bash
npm install
```

Servidor de Desenvolvimento (com MSW ativado automaticamente):
```bash
npm run dev
```

Verificação de Tipos:
```bash
npm run typecheck
```

Linting:
```bash
npm run lint
```

Build e Preview (Modo de Produção):
```bash
npm run build
npm run preview
```

Testes End-to-End (Playwright):
```bash
npx playwright install
npm run test:e2e
```

Auditoria de Performance (Lighthouse):
```bash
npm run audit
```

## Credenciais Fictícias (Mocks)
O banco de dados é gerado dinamicamente na primeira execução e salvo no navegador.
Utilize as seguintes credenciais para testar fluxos autenticados:
- **Usuário 1**: `john@example.com` / Senha: `password123`
- **Usuário 2**: `jane@example.com` / Senha: `password123`

## Seleção e Reset de Cenários
Os dados da API mock são mantidos localmente via `localStorage` na chave `nft_marketplace_db`.
Para restaurar a API e os NFTs para o estado original determinístico:
1. Abra as ferramentas de desenvolvedor do navegador (F12) > Application > Local Storage
2. Apague a chave `nft_marketplace_db` (ou execute `localStorage.clear()` no console).
3. Recarregue a página e o estado limpo inicial será recriado.

## Instruções para Fluxos de Falha

A simulação intercepta chamadas via MSW e você pode forçar o frontend a entrar em estados de falha customizados passando parâmetros de cabeçalho. Para uso rápido, você também pode testar as seguintes interações na Interface:

- **Pagamento Recusado:** No checkout, selecione a Carteira simulada nomeada "Carteira Vazia" (se houver saldo menor que a compra) ou adicione propositalmente muitos NFTs até passar de `2.5 ETH` e escolha falhar a transação no modal de pagamento (a simulação de falha vai ocorrer randomicamente se configurado nos testes, ou ao passar do saldo).
- **Aviso de Estoque Indisponível em Tempo Real:** No arquivo `e2e/marketplace.spec.ts` existe o gatilho para atualizar a quantidade do banco via "Socket.IO" enquanto a página está aberta, o que bloqueia o usuário de comprar mais NFTs do que o disponível.
- **Cupom Inválido:** Digite qualquer cupom diferente de `10OFF` no carrinho para ver a mensagem de validação de erro de cupom.
- **Sessão Expirada (Proteção de Rotas):** Apague o cookie/localStorage `kurio_session` enquanto navega na área de `/profile` ou no Checkout. O interceptor de Axios detectará o 401 do Mock Server e redirecionará instantaneamente para a tela de `/login` com o parâmetro `?redirect`.
- **Skeletons de Carregamento Lento:** O MSW aplica nativamente um `delay(500)` na listagem de NFTs para que a Skeleton apareça. Se quiser testar lentidão extrema, adicione um tempo no script do DB MSW ou simule Throttling (Slow 4G) no DevTools.