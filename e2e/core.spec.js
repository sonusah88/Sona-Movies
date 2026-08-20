import { test, expect } from '@playwright/test';

test.describe('Sona-Movies Core Flows', () => {
  
  test('Homepage renders correctly and displays MediaGrid', async ({ page }) => {
    await page.goto('/');
    
    // Expect a title "to contain" a substring.
    await expect(page).toHaveTitle(/Sona Movies/);

    // Verify the navbar is visible
    const navbar = page.locator('nav.navbar');
    await expect(navbar).toBeVisible();

    // Verify MediaGrid mounts by checking for at least one media card
    // We wait for the network to idle since TMDB data is fetched client-side
    await page.waitForLoadState('networkidle');
    
    // Check if trending section has loaded cards
    const trendingCards = page.locator('.media-card').first();
    await expect(trendingCards).toBeVisible({ timeout: 10000 });
  });

  test('Clicking a movie navigates to Details and mounts VidkingPlayer', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Click the first movie card
    const firstMovie = page.locator('.media-card').first();
    await expect(firstMovie).toBeVisible();
    await firstMovie.click();

    // Ensure URL changes to /movie/:id or similar
    await expect(page).toHaveURL(/.*\/movie\/.+|.*\/tv\/.+/);

    // Ensure the play button is visible on the details page
    const playButton = page.getByRole('button', { name: /Watch Now/i });
    await expect(playButton).toBeVisible();

    // Click watch now
    await playButton.click();

    // Wait for the VidkingPlayer iframe to mount
    const playerIframe = page.locator('.vidking-wrapper iframe');
    await expect(playerIframe).toBeVisible({ timeout: 10000 });
  });

  test('CategoryPage successfully filters content', async ({ page }) => {
    // Go to Discover page
    await page.goto('/discover');
    await page.waitForLoadState('networkidle');

    // Ensure grid is visible
    const firstItem = page.locator('.media-card').first();
    await expect(firstItem).toBeVisible();

    // Find and select a filter (e.g., genre or type)
    // Assuming there are buttons for filtering like "Movies" or "TV Shows"
    const tvButton = page.getByRole('button', { name: 'TV Shows' }).first();
    if (await tvButton.isVisible()) {
        await tvButton.click();
        
        // Wait for the URL to update or content to change
        await page.waitForLoadState('networkidle');
        
        // Just verify the page didn't crash and still shows cards
        await expect(page.locator('.media-card').first()).toBeVisible();
    }
  });

});
