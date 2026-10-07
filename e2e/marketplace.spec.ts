import { test, expect } from '@playwright/test';

test.describe('NFT Marketplace E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home before each test
    await page.goto('/');
  });

  test('should load the home page and display NFTs', async ({ page }) => {
    await expect(page.locator('h1', { hasText: 'SEJA DONO DA' })).toBeVisible();
    await page.waitForTimeout(2000); // Wait for MSW
    
    const nftCards = page.locator('a[href^="/nft/"]');
    await expect(nftCards.first()).toBeVisible();
  });

  test('should filter NFTs by search', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Buscar no marketplace');
    await searchInput.fill('Ape');
    await searchInput.press('Enter');
    
    await page.waitForTimeout(1000);
    const url = new URL(page.url());
    expect(url.searchParams.get('search')).toBe('Ape');
  });

  test('should apply category filter', async ({ page }) => {
    const categoryButton = page.getByRole('button', { name: /Arte digital/ });
    await categoryButton.click();
    
    await page.waitForTimeout(500);
    const url = new URL(page.url());
    expect(url.searchParams.get('category')).toBe('art');
  });

  test('should add NFT to cart and update badge', async ({ page }) => {
    await page.waitForTimeout(1000);
    await page.locator('a[href^="/nft/"]').first().click();
    await page.waitForURL(/\/nft\/.+/);

    const addToCartBtn = page.getByText('COMPRAR');
    await addToCartBtn.click();
    
    const cartBadge = page.locator('.cart-count');
    await expect(cartBadge).toHaveText('1');
  });

  test('should redirect to login if checking out while unauthenticated', async ({ page }) => {
    // Add item to cart first
    await page.waitForTimeout(1000);
    await page.locator('a[href^="/nft/"]').first().click();
    await page.getByText('COMPRAR').click();
    await expect(page.locator('.cart-count')).toHaveText('1');
    
    // Go to checkout
    await page.goto('/checkout');
    await page.waitForTimeout(1000);
    
    const checkoutBtn = page.getByText('Conectar e finalizar');
    await checkoutBtn.click();
    
    await page.waitForURL(/\/login\?redirect=%2Fcheckout/);
    await expect(page.locator('h1', { hasText: 'Acesse o marketplace' })).toBeVisible();
  });

  test('should authenticate and retain session', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'john@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.waitForURL('/');
    
    // Check if user menu or profile link is visible
    await expect(page.getByRole('button', { name: 'Sair' })).toBeVisible();
  });

  test('should toggle favorite state on NFT', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"]', 'john@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');

    // nft-1 and nft-2 are already favorited for the seeded user, so use nft-5
    await page.goto('/nft/nft-5');

    const favBtn = page.locator('.nft-favorite-button');
    await favBtn.click();
    
    await expect(favBtn).toHaveClass(/is-favorite/);
  });

  test('should perform full checkout flow when logged in', async ({ page }) => {
    // 1. Login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'john@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');

    // 2. Add to Cart
    await page.waitForTimeout(1000);
    await page.locator('a[href^="/nft/"]').first().click();
    await page.getByText('COMPRAR').click();
    await expect(page.locator('.cart-count')).toHaveText('1');

    // 3. Go to Checkout
    await page.goto('/checkout');
    
    // 4. Proceed to Payment
    await page.getByText('Conectar e finalizar').click();
    await page.waitForURL('/payment');

    // 5. Fill Payment Details
    await page.fill('input[name="displayName"]', 'John Doe');
    await page.fill('input[name="username"]', 'johndoe');
    await page.fill('input[name="profileName"]', 'john_collection');
    await page.fill('input[name="settlementCode"]', '123456');
    await page.fill('input[name="email"]', 'john@kurio.com');
    
    await page.click('.confirm-payment-button');

    // 6. Verify Order Receipt
    await page.waitForURL(/\/order\/.+/);
    await expect(page.locator('h1', { hasText: 'Seu pedido foi recebido.' })).toBeVisible({ timeout: 10000 });
  });

  test('should update profile display name', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'john@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');

    await page.goto('/profile');
    
    const nameInput = page.locator('input[name="name"]');
    await nameInput.fill('Novo Nome');
    await page.getByText('Salvar perfil').click();
    
    await expect(page.getByText('Perfil atualizado!')).toBeVisible();
  });

  test('should display and allow adding a new wallet', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'john@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');

    await page.goto('/profile/wallets');
    
    await page.fill('input[name="address"]', '0x1234567890abcdef');
    await page.fill('input[name="label"]', 'Minha Nova Carteira');
    await page.click('.btn-salvar');
    
    await expect(page.getByText('Carteira adicionada com sucesso!')).toBeVisible();
  });

  test('should simulate error offline banner', async ({ page }) => {
    await page.goto('/?simulate-error=true');
    await expect(page.locator('.marketplace-screen')).toContainText('Não foi possível carregar os NFTs');
  });

  test('should support simulated latency on network', async ({ page }) => {
    // We test that loading skeletons appear
    await page.goto('/');
    // Loading skeletons should be visible immediately
    await expect(page.locator('.nft-skeleton').first()).toBeVisible();
  });
});
