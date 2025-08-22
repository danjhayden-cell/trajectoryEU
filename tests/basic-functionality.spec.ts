import { test, expect } from '@playwright/test';

test.describe('Basic App Functionality', () => {
  test('homepage loads successfully', async ({ page }) => {
    await page.goto('/');
    
    // Check main heading is visible
    await expect(page.locator('h1')).toContainText("Compare Europe's");
    
    // Check that indicators are visible
    await expect(page.locator('button:has-text("GDP per Capita")')).toBeVisible();
    await expect(page.locator('button:has-text("GDP Growth")')).toBeVisible();
    await expect(page.locator('button:has-text("R&D Spending")')).toBeVisible();
    await expect(page.locator('button:has-text("Investment")')).toBeVisible();
    await expect(page.locator('button:has-text("Productivity")')).toBeVisible();
    
    // Check that regions are visible
    await expect(page.locator('text="EU"')).toBeVisible();
    await expect(page.locator('text="USA"')).toBeVisible();
    await expect(page.locator('text="China"')).toBeVisible();
    
    // Check that chart canvas is present
    await expect(page.locator('canvas')).toBeVisible();
    
    // Check that time horizon controls are visible
    await expect(page.locator('button:has-text("10 years")')).toBeVisible();
    await expect(page.locator('button:has-text("20 years")')).toBeVisible();
    await expect(page.locator('button:has-text("50 years")')).toBeVisible();
  });

  test('can switch between indicators', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('canvas');
    
    // Test switching to GDP Growth
    await page.click('button:has-text("GDP Growth")');
    await page.waitForTimeout(1000);
    await expect(page.locator('button:has-text("GDP Growth")')).toHaveClass(/border-purple-400/);
    
    // Test switching to R&D
    await page.click('button:has-text("R&D Spending")');
    await page.waitForTimeout(1000);
    await expect(page.locator('button:has-text("R&D Spending")')).toHaveClass(/border-purple-400/);
    
    // Test switching to Investment
    await page.click('button:has-text("Investment")');
    await page.waitForTimeout(1000);
    await expect(page.locator('button:has-text("Investment")')).toHaveClass(/border-purple-400/);
    
    // Test switching to Productivity
    await page.click('button:has-text("Productivity")');
    await page.waitForTimeout(1000);
    await expect(page.locator('button:has-text("Productivity")')).toHaveClass(/border-purple-400/);
    
    // Switch back to GDP per Capita
    await page.click('button:has-text("GDP per Capita")');
    await page.waitForTimeout(1000);
    await expect(page.locator('button:has-text("GDP per Capita")')).toHaveClass(/border-purple-400/);
  });

  test('can select different regions', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('canvas');
    
    // EU should be selected by default
    await expect(page.locator('text="EU"').locator('..')).toHaveClass(/bg-blue-50/);
    
    // Click USA to select/deselect
    await page.click('button:has-text("USA")');
    await page.waitForTimeout(500);
    
    // Click China to select
    await page.click('button:has-text("China")');
    await page.waitForTimeout(500);
  });

  test('can change time horizons', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('canvas');
    
    // Default should be 20 years
    await expect(page.locator('button:has-text("20 years")')).toHaveClass(/border-purple-400/);
    
    // Switch to 10 years
    await page.click('button:has-text("10 years")');
    await page.waitForTimeout(500);
    await expect(page.locator('button:has-text("10 years")')).toHaveClass(/border-purple-400/);
    
    // Switch to 50 years
    await page.click('button:has-text("50 years")');
    await page.waitForTimeout(500);
    await expect(page.locator('button:has-text("50 years")')).toHaveClass(/border-purple-400/);
  });

  test('app loads real database data', async ({ page }) => {
    // Monitor console logs to verify database usage
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'log') {
        consoleLogs.push(msg.text());
      }
    });
    
    await page.goto('/');
    await page.waitForSelector('canvas');
    await page.waitForTimeout(3000); // Wait for data loading
    
    // Should see database configuration
    const hasDbConfig = consoleLogs.some(log => 
      log.includes('Data Source Config') && log.includes('USE_REAL_DATABASE: true')
    );
    
    expect(hasDbConfig).toBeTruthy();
  });
});