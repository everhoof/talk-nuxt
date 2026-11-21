import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  workers: 1,
  use: { browserName: 'chromium', viewport: { width: 1100, height: 800 }, locale: 'ru-RU' },
});
