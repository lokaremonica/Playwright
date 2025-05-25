// import { test, expect, Page } from '@playwright/test';

// export async function run(page: Page) {
//     const screenSize = await page.evaluate(() => ({
//       width: window.screen.width,
//       height: window.screen.height,
//     }));
//     await page.setViewportSize(screenSize);

//     /* Confirm that when you use the "Roll Dice" button and the result is `10`,
//     the text "Yahoo!" is shown in the result area.
//     NOTE - to do this you can use page.route to intercept the request to the API
//     and return a mocked response with the result `10`. */

//     await page.route('**/api/random', async (route) => {
//       console.log('🎯 Intercepted /api/random');
//       await route.fulfill({
//         status: 200,
//         contentType: 'application/json',
//         body: JSON.stringify({ ten: true }),
//       });
//     });
  
//     await page.goto('/');
//     await page.waitForLoadState('networkidle');
//     await page.waitForTimeout(2000);
  
//     const rollButton = page.locator('[data-testid="dice-roll"] button[type="submit"]');
//     await rollButton.scrollIntoViewIfNeeded();
//     await rollButton.waitFor({ state: 'visible' });
//     await rollButton.click();
  
//     const result = page.getByTestId('dice-roll');
//     await expect(result).toContainText('Yahoo! You rolled 10!', { timeout: 6000 });
//   }

import { test, expect, Page } from '@playwright/test';

export async function run(page: Page) {
  // Using dynamic screen size for better cross-platform compatibility
  const screenSize = await page.evaluate(() => ({
    width: window.screen.width,
    height: window.screen.height,
  }));
  await page.setViewportSize(screenSize);

  /* Confirm that when you use the "Roll Dice" button and the result is `10`,
     the text "Yahoo!" is shown in the result area.
     NOTE - to do this you can use page.route to intercept the request to the API
     and return a mocked response with the result `10`. */

  // Page object selectors
  const selectors = {
    diceSection: page.getByTestId('dice-roll'),
    rollButton: page.getByTestId('dice-roll').locator('button[type="submit"]'),
    resultArea: page.getByTestId('dice-roll')
  };

  // Set up for API interception before navigation
  await setupApiInterception(page);

  console.log('Navigating to dice roll page');
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // Waiting for dice section to be fully loaded
  await expect(selectors.diceSection).toBeVisible({ timeout: 6000 });
  console.log('Dice section loaded');

  // Performing dice roll and verifying result
  await performDiceRoll(page, selectors);
  await verifyYahooResult(selectors);
  
  console.log('Test completed successfully!');
}

/**
 * Sets up API route interception to mock dice roll result as 10
 * @param page - Playwright page object
 */
async function setupApiInterception(page: Page): Promise<void> {
  console.log('Setting up API interception');
  
  await page.route('**/api/random', async (route) => {
    console.log('Intercepted /api/random - returning mock result: 10');
    
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ten: true }),
    });
  });
}

/**
 * Performs the dice roll action
 * @param selectors - Page selectors object
 */
async function performDiceRoll(page: Page, selectors: any): Promise<void> {
  console.log('Preparing to roll dice');
  
  // Ensure button is visible and interactable
  await selectors.rollButton.scrollIntoViewIfNeeded();
  await expect(selectors.rollButton).toBeVisible({ timeout: 5000 });
  await expect(selectors.rollButton).toBeEnabled();
  
  console.log('Clicking roll dice button');
  // Set up for response waiting before clicking
  const responsePromise = page.waitForResponse('**/api/random');
  // Clicking on the roll button
  await selectors.rollButton.click();
  
  // Waiting and verifying the API call
  try {
    const response = await responsePromise;
    console.log(`API call completed with status: ${response.status()}`);
  } catch (error) {
    throw new Error(`Failed to complete API call: ${error}`);
  }
}

/**
 * Verifying that the Yahoo message appears for a roll of 10
 * @param selectors - Page selectors object
 */
async function verifyYahooResult(selectors: any): Promise<void> {
  console.log('Verifying Yahoo message appears...');
  
  const expectedMessage = 'Yahoo! You rolled 10!';
  
  // Wait for the result to update with Yahoo message
  await expect(selectors.resultArea).toContainText(expectedMessage, { 
    timeout: 6000 
  });
  
  console.log('Yahoo message verified successfully');
  // Ensuring the message is actually visible to user
  const resultText = await selectors.resultArea.textContent();
  expect(resultText).toContain('Yahoo!');
  expect(resultText).toContain('10');
  console.log(`Full result text: "${resultText?.trim()}"`);
}