import { test, expect } from '@playwright/test';

test('Debug application error', async ({ page }) => {
  // Listen for console errors
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(`Console error: ${msg.text()}`);
    }
    console.log(`Console ${msg.type()}: ${msg.text()}`);
  });

  page.on('pageerror', error => {
    errors.push(`Page error: ${error.message}`);
    console.log(`Page error: ${error.message}`);
  });

  // Navigate to the home page
  await page.goto('http://localhost:3001');
  
  // Wait for page to load
  await page.waitForTimeout(5000);
  
  // Get page content
  const content = await page.content();
  console.log('Page content:', content.substring(0, 1000));
  
  // Check for specific error message
  const errorText = await page.locator('text=Application error').textContent();
  console.log('Error text found:', errorText);
  
  // Take a screenshot
  await page.screenshot({ path: 'debug-screenshot.png', fullPage: true });
  
  // Report any errors
  if (errors.length > 0) {
    console.log('Errors found:', errors);
  } else {
    console.log('No errors captured');
  }
});