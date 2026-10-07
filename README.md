# Kurio NFT Marketplace

Plataforma de compra de colecionáveis digitais.

## Requisitos e Setup
O projeto utiliza **Node.js (>= 18)** e o gerenciador de pacotes padrão `npm`. Não há dependências de serviços externos.

1. Instale as dependências:
   ```bash
   npm install
   ```

2. Variáveis de ambiente:
   Nenhuma variável de ambiente complexa é necessária para o ambiente local, pois os mocks já substituem a API.
   *Nota: O `playwright.config.ts` utiliza variáveis internas, mas todas possuem fallbacks padrão.*

## Comandos de Execução
- **Desenvolvimento (com mocks)**: `npm run dev`
- **Build de Produção**: `npm run build`
- **Preview de Produção**: `npm run preview`
- **Verificação de Tipos (TS)**: `npm run build`
- **Lint (Oxlint)**: `npm run lint`
- **Testes E2E (Playwright)**: `npm run test:e2e`
- **Testes E2E com UI**: `npx playwright test --ui`
- **Auditoria Lighthouse**: `npm run audit`

## Credenciais Fictícias (Mocks)
O banco de dados MOCK é reiniciado caso não encontre dados locais. Utilize para login:
- **Usuário 1**: `john@example.com` / Senha: `password123`
- **Usuário 2**: `jane@example.com` / Senha: `password123`

## Seleção e Reset de Cenários
Os dados da API mock são mantidos localmente via `localStorage` na chave `nft_marketplace_db`.
Para restaurar a API e os NFTs para o estado original determinístico:
1. Abra as ferramentas de desenvolvedor do navegador (F12) > Application > Local Storage
2. Apague a chave `nft_marketplace_db` (ou execute `localStorage.clear()` no console)
3. Atualize a página.

## Instruções para Fluxos de Falha
Você pode forçar o frontend a entrar em estados de erro para visualizá-los e testá-los:
- **Erro de rede simulado no feed**: Navegue até `/?simulate-error=true` para forçar um status 503 na rota de listagem e ver o componente de tela de offline.
- **Requisições lentas**: Você pode forçar os mocks a demorarem, para testar as Skeletons. Exemplo no código: os handlers suportam um custom header `x-simulate-latency` e os testes brincam com interceptações via framework.
- **Double Checkout / Falha no pagamento**: Tentar efetuar pagamento clicando repetidamente bloqueia múltiplos `POST` através de botões desativados. Erros retornam alertas nativos da interface usando toast/sonner.

Consulte o arquivo `ARCHITECTURE.md` para documentação sobre contratos REST, política de sessão, sincronização via websockets e detalhes de UX.