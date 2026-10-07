import { test } from '@playwright/test';

test('debug offline banner', async ({ page }) => {
  page.on('console', msg => console.log('CONSOLE', msg.type(), msg.text()));
  page.on('request', req => { if (req.url().includes('/api/')) console.log('REQ', req.method(), req.url()); });
  page.on('response', res => { if (res.url().includes('/api/')) console.log('RESP', res.status(), res.url()); });
  await page.route('/api/**', route => route.fulfill({ status: 503, body: 'Service Unavailable' }));
  await page.goto('/');
  await page.waitForTimeout(3000);
  console.log('TITLE', await page.locator('body').innerText());
});
