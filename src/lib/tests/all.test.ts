import { test } from '@playwright/test';
import { run as alphabeticallySorted } from './alphabeticallySorted';
import { run as rollTenYahoo } from './rollTenYahoo';
import { run as doneAfterUncomplete } from './doneAfterUncomplete';

test('Todos are initially shown in the order added but alphabetically sorted on page reload', async ({ page }) => {
    await alphabeticallySorted(page);
});

test('When you roll a `10` you get a "Yahoo!" toContainText', async ({ page }) => {
    await rollTenYahoo(page);
});

test('Todos that are marked as "done" are sorted after all uncomplete todos', async ({ page }) => {
    await doneAfterUncomplete(page);
});
