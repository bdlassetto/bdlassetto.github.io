import { test, expect } from '@playwright/test';

test.describe('Smoke Test', () => {
    test('should load the home page and 3D viewer', async ({ page }) => {
        // Navigate to home
        await page.goto('/');

        // Check for the container first
        const container = page.locator('.viewer-container');
        await expect(container).toBeVisible({ timeout: 10000 });

        // Check for "BDL CAR VIEWER" text which is present in all languages
        const body = page.locator('body');
        await expect(body).toContainText('BDL CAR VIEWER', { timeout: 10000 });

        // Check for canvas element which represents the Three.js viewer
        // We increase timeout significantly for slower CI environments or WebGL initialization
        const canvas = page.locator('canvas');
        await expect(canvas).toBeAttached({ timeout: 30000 });
        await expect(canvas).toBeVisible({ timeout: 30000 });
    });
});
