import { defineConfig } from 'wxt';

export default defineConfig({
  manifest: {
    name: 'ProjectPins for ChatGPT',
    description:
      'Pin important conversations inside individual ChatGPT Projects. Local-first, no backend.',
    permissions: ['storage'],
  },
});
