import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  use: {
    channel: 'msedge',
    headless: true,
    trace: 'retain-on-failure',
  },
});
