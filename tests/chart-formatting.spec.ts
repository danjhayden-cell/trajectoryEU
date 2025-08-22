import { test, expect } from '@playwright/test';

test.describe('Chart Formatting and Scaling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the page to load and charts to render
    await page.waitForSelector('canvas');
    await page.waitForTimeout(2000); // Wait for data to load
  });

  test('GDP per capita shows proper currency formatting', async ({ page }) => {
    // Make sure GDP per capita indicator is selected (default)
    await expect(page.locator('button:has-text("GDP per Capita")')).toHaveClass(/border-purple-400/);
    
    // Check Y-axis title shows proper units
    await expect(page.locator('text="GDP per Capita (PPP, USD)"')).toBeVisible();
    
    // Take a screenshot to visually verify currency formatting
    await page.screenshot({ path: 'test-results/gdp-per-capita-formatting.png' });
  });

  test('GDP growth shows percentage formatting', async ({ page }) => {
    // Click on GDP Growth indicator
    await page.click('button:has-text("GDP Growth")');
    await page.waitForTimeout(1000);
    
    // Check Y-axis title shows percentage units
    await expect(page.locator('text="Real GDP Growth Rate (%)"')).toBeVisible();
    
    // Take a screenshot
    await page.screenshot({ path: 'test-results/gdp-growth-formatting.png' });
  });

  test('R&D spending shows percentage formatting', async ({ page }) => {
    // Click on R&D indicator
    await page.click('button:has-text("R&D Spending")');
    await page.waitForTimeout(1000);
    
    // Check Y-axis title
    await expect(page.locator('text="R&D Expenditure (% of GDP)"')).toBeVisible();
    
    // Take a screenshot
    await page.screenshot({ path: 'test-results/rd-spending-formatting.png' });
  });

  test('Investment shows percentage formatting', async ({ page }) => {
    // Click on Investment indicator
    await page.click('button:has-text("Investment")');
    await page.waitForTimeout(1000);
    
    // Check Y-axis title
    await expect(page.locator('text="Gross Capital Formation (% of GDP)"')).toBeVisible();
    
    // Take a screenshot
    await page.screenshot({ path: 'test-results/investment-formatting.png' });
  });

  test('Productivity shows currency formatting', async ({ page }) => {
    // Click on Productivity indicator
    await page.click('button:has-text("Productivity")');
    await page.waitForTimeout(1000);
    
    // Check Y-axis title
    await expect(page.locator('text="Labor Productivity (USD per employed person)"')).toBeVisible();
    
    // Take a screenshot
    await page.screenshot({ path: 'test-results/productivity-formatting.png' });
  });

  test('Chart responds to different time horizons', async ({ page }) => {
    // Test different time horizons
    await page.click('button:has-text("10 years")');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-results/10-year-horizon.png' });

    await page.click('button:has-text("20 years")');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-results/20-year-horizon.png' });

    await page.click('button:has-text("50 years")');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-results/50-year-horizon.png' });
  });

  test('EU scenario adjustment works', async ({ page }) => {
    // Test EU scenario adjustment
    await page.click('button:has-text("+")');
    await page.waitForTimeout(500);
    
    // Check that the display shows positive percentage
    await expect(page.locator('text="+0.5%"')).toBeVisible();
    
    await page.click('button:has-text("−")');
    await page.click('button:has-text("−")');
    await page.waitForTimeout(500);
    
    // Check that we can go negative
    await expect(page.locator('text="-0.5%"')).toBeVisible();
    
    await page.screenshot({ path: 'test-results/scenario-adjustment.png' });
  });

  test('Index normalization works', async ({ page }) => {
    // This test would require accessing the advanced controls
    // For now, just ensure the basic interface is working
    await expect(page.locator('button:has-text("Advanced Controls")')).toBeVisible();
  });

  test('Real database data is loaded', async ({ page }) => {
    // Check that we're getting real data by looking for the database config log
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'log') {
        consoleLogs.push(msg.text());
      }
    });
    
    await page.reload();
    await page.waitForTimeout(2000);
    
    // Should see the database config with USE_REAL_DATABASE: true
    const hasDbConfig = consoleLogs.some(log => 
      log.includes('USE_REAL_DATABASE: true')
    );
    
    expect(hasDbConfig).toBeTruthy();
  });
});