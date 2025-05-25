import { test, expect, Page } from '@playwright/test';

export async function run(page: Page) {
  await page.setViewportSize({ width: 1440, height: 1080 });
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // Page object selectors
  const selectors = {
    todoItems: page.locator('[data-type="todo"]'),
    todoTexts: page.locator('[data-type="todo"] .text-sm'),
    todoCheckbox: (todoItem: any) => todoItem.locator('input[type="checkbox"]'),
    todoLabel: (todoItem: any) => todoItem.locator('.text-sm'),
    todoDeleteButton: (todoItem: any) => todoItem.locator('button')

  };

  console.log('Waiting for todos to load');
  // Waiting for at least one todo to load with better error handling
  await expect(selectors.todoItems.first()).toBeVisible({ timeout: 6000 });
  
  // Verifying we have at least 2 todos for this test
  const todoCount = await selectors.todoItems.count();
  expect(todoCount).toBeGreaterThanOrEqual(2);
  console.log(`Found ${todoCount} todos`);

  // Choosing the second todo item (index 1) to mark as complete
  const targetTodoIndex = 1;
  const todoToComplete = selectors.todoItems.nth(targetTodoIndex);
  console.log(`Selecting todo at index ${targetTodoIndex} to complete`);
  
  // Getting the initial state of all todos for comparison
  const initialTodoTexts = await selectors.todoTexts.allTextContents();
  console.log('Initial todos:', initialTodoTexts.map(t => t.trim()));
  
  // Grabing the target todo's label text for verification
  const labelText = await getTodoLabelText(todoToComplete, selectors);
  console.log(`Target todo to complete: "${labelText}"`);

  // Marking the todo as complete
  await completeTodoItem(todoToComplete, selectors);
  console.log('Todo marked as complete');

  // Reloading page and verify persistence
  console.log('Reloading page to verify persistence');
  await page.reload();
  await page.waitForLoadState('networkidle');

  // Waiting for todos to render after reload
  await expect(selectors.todoTexts.first()).toBeVisible({ timeout: 6000 });

  // Verifying the completed item moved to the end
  await verifyCompletedTodoPosition(selectors, labelText);
  console.log('Completed todo correctly positioned at the end');

  // Deleting the todo items for next run
  await deleteAllTodos(selectors,page);
}

/**
 * Helper function to get todo label text safely
 * @param todoItem - The todo item locator
 * @param selectors - Page selectors object
 * @returns Promise<string> - The trimmed label text
 */
async function getTodoLabelText(todoItem: any, selectors: any): Promise<string> {
  const labelText = await selectors.todoLabel(todoItem).textContent();
  expect(labelText?.trim()).toBeTruthy(); 
  return labelText!.trim();
}

/**
 * Helper function to mark a todo item as complete
 * @param todoItem - The todo item to complete
 * @param selectors - Page selectors object
 */
async function completeTodoItem(todoItem: any, selectors: any): Promise<void> {
  const checkbox = selectors.todoCheckbox(todoItem);
  
  // Ensuring checkbox is visible and interactable
  await expect(checkbox).toBeVisible({ timeout: 5000 });
  await expect(checkbox).toBeEnabled();
  
  // Verifying it's not already checked
  const isChecked = await checkbox.isChecked();
  expect(isChecked).toBe(false);
  
  // Clicking to complete
  await checkbox.click();
  
  // Verifying it's now checked
  await expect(checkbox).toBeChecked();
}

/**
 * Helper function to verify completed todo position after reload
 * @param selectors - Page selectors object
 * @param expectedCompletedTodo - Text of the todo that should be completed
 */
async function verifyCompletedTodoPosition(selectors: any, expectedCompletedTodo: string): Promise<void> {
  // Get updated todo list after reload
  const todosAfterReload = await selectors.todoTexts.allTextContents();
  const cleanTodos = todosAfterReload.map(t => t.trim());
  console.log('Todos after reload:', cleanTodos);
  
  // Verifying the completed todo exists in the list
  expect(cleanTodos).toContain(expectedCompletedTodo);
  
  // Verifying the completed todo is at the end (last position)
  const lastTodo = cleanTodos[cleanTodos.length - 1];
  expect(lastTodo).toBe(expectedCompletedTodo);
  
  // Ensuring we still have the same number of todos
  expect(cleanTodos.length).toBeGreaterThanOrEqual(2);
}

/**
 * Deleting all todo items from the list for next run(cleanup step).
 * @param selectors - object containing locator references
 */
async function deleteAllTodos(selectors: any, page: Page): Promise<void> {
  console.log('Cleaning up todos');

  while (await selectors.todoItems.count() > 0) {
    // Re-evaluate fresh locators inside loop
    const todoItem = selectors.todoItems.first();
    const deleteButton = selectors.todoDeleteButton(todoItem);

    await expect(deleteButton).toBeVisible({ timeout:2000 });
    await deleteButton.click();

    // Instead of waiting on a potentially stale element,
    // waiting for the count to decrease before next loop
    await selectors.todoItems.first().waitFor({ state: 'detached', timeout: 2000}).catch(() => {
      // fallback wait to avoid flake
      console.warn('waitFor(detached) timed out, fallback to timeout');
      page.waitForTimeout(100);
    });
  }
  console.log('All todos deleted');
}
