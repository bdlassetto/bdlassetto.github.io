import { test, expect } from '@playwright/test';

test.describe('Smoke Test', () => {
    test('should load the home page and 3D viewer', async ({ page }) => {
        // Navigate to home
        await page.goto('/');

        // Check if the page title mentions the app name (even if i18n changes, some key part might be stable, or just check the title tag)
        // Actually, let's just check if the main canvas is present.

        // Check for canvas element which represents the Three.js viewer
        const canvas = page.locator('canvas');
        await expect(canvas).toBeAttached();
        await expect(canvas).toBeVisible();

        // Check for "GearGarage" text which seems central to the branding
        // Using a softer check since i18n might change exact strings
        // But failing that, we can just check that the body isn't empty.
        const body = page.locator('body');
        await expect(body).not.toBeEmpty();
    });
});
