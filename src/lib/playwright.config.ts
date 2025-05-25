import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
    testDir: '.',
    testMatch: '**/all.test.ts',
    workers: 1,
    fullyParallel: true,
    /* Reporter to use. See https://playwright.dev/docs/test-reporters */
    reporter: [['html', { open: 'never' }], ['list']],
    // Enable each test to take 5 minutes, default is 30s
    timeout: 300_000,
    /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
    use: {
        /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
        trace: 'on',
        baseURL: 'https://qa-todo.ranger.net/',
        // Set the default timeout for each action to 4 minutes
        actionTimeout: 60_000,
        headless: false,
        contextOptions: {
            permissions: ['clipboard-read', 'clipboard-write'],
        },
        screenshot: 'on',
    },
    expect: {
        timeout: 60_000,
    },
    projects: [
        {
            name: 'login',
            testMatch: '**/login.ts',
            use: {
            },  
        },
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome'],
                storageState: 'src/auth/login.json',
            },
            testIgnore: ['**/login.ts'],
            dependencies: ['login'],
        },
    ],
});
