import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config();

test('Login the TODO app', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();

  const EMAIL = process.env.EMAIL;
  const PASSWORD = process.env.PASSWORD;
    if (!EMAIL || !PASSWORD) {
      throw new Error('Missing email or password');
    }

  // Go to the main todo app page
  await page.goto('https://qa-todo.ranger.net/');

  // Input User Credentials | Username & Password
  await page.getByPlaceholder('Your email address').fill(EMAIL);
  await page.getByPlaceholder('Your password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();

  // Login Assertion
  await expect(page.locator('h1').first()).toContainText('Todo List.');

  // Save Storage State
  await context.storageState({ path: path.resolve('src/auth/login.json') });

  await context.close();
});