const { test, expect } = require('@playwright/test');
const { writeResultsToCSV } = require('../src/utils/fileHandler');

test('monitor page load times', async ({ page }) => {
  const websites = [
    'https://playwright.dev/',
    'https://example.com/',
    'https://github.com/'
  ];

  for (const url of websites) {
    const startTime = Date.now();
    await page.goto(url);
    const loadTime = (Date.now() - startTime) / 1000; // Convert to seconds

    await writeResultsToCSV(url, loadTime);
    await expect(page).toHaveTitle(/Playwright|Example Domain|GitHub/);
  }
});