import { test, expect, Page } from '@playwright/test';

export async function run(page: Page) {
  await page.setViewportSize({ width: 1440, height: 1080 });
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // Page object selectors
  const selectors = {
    todoInput: page.getByPlaceholder('make coffee'),
    addButton: page.getByTestId('add-todo'),
    todoItems: page.locator('[data-type="todo"] .text-sm'),
    todoItem: (text: string) => page.locator('[data-type="todo"] .text-sm', { hasText: text })
  };

  const testTodos = ['Prepare Lunch', 'Complete Assessment', 'Clean Home', 'Grocery Shopping'];

  // Adding TODOs and verifying that the order is based on the order added
  console.log('Adding TODOs in specific order');

  for (const [index, todoText] of testTodos.entries()) {
    await addTodoItem(selectors, todoText);
    console.log(`Added TODO ${index + 1}: "${todoText}"`);
  }

  // Verifying initial order matches insertion order
  console.log('Verifying initial order matches insertion order');
  const initialOrder = await selectors.todoItems.allTextContents();
  expect(initialOrder).toEqual(testTodos);
  console.log('Initial order verified');

  // Refreshing the page and asserting that the TODOs are sorted alphabetically
  console.log('Refreshing page to test sorting');
  await page.reload();
  await page.waitForLoadState('networkidle');
  
  // Waiting for todos to be rendered after refresh
  await expect(selectors.todoItems.first()).toBeVisible({ timeout: 5000 });

  console.log('Verifying alphabetical sorting after refresh');
  const renderedAfterRefresh = await selectors.todoItems.allTextContents();
  const expectedSortedOrder = [...testTodos].sort((a, b) => a.localeCompare(b));
  
  expect(renderedAfterRefresh).toEqual(expectedSortedOrder);
  console.log('Alphabetical sorting verified');
  
  // Ensuring that all todos are still present
  expect(renderedAfterRefresh).toHaveLength(testTodos.length);
  console.log(`All ${testTodos.length} TODOs preserved after refresh`);
}

/**
 * Helper function to add a single TODO item
 * @param selectors - Object containing page selectors
 * @param todoText - Text content for the TODO item
 */
async function addTodoItem(selectors: any, todoText: string): Promise<void> {
  // Clearing input field before adding new todo for safer side
  await selectors.todoInput.clear();
  
  // Filling and submiting the todo
  await selectors.todoInput.fill(todoText);
  await selectors.addButton.click();
  
  // Waiting for the specific todo item to appear
  await expect(selectors.todoItem(todoText)).toBeVisible({ timeout: 5000 });
}