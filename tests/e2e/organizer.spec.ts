import { test, expect } from '@playwright/test';
import { readFileSync, realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
const version = (JSON.parse(readFileSync('package.json', 'utf8')) as { version: string }).version;

let script: string;
test.beforeAll(async () => {
  // Use the build tool already supplied by WXT, without adding runtime dependencies.
  const require = createRequire(realpathSync('node_modules/wxt/package.json'));
  const { build } = await import(pathToFileURL(require.resolve('vite')).href);
  const result = await build({ configFile: false, logLevel: 'error', build: { write: false,
    lib: { entry: 'tests/e2e/harness.ts', name: 'ProjectPinsTest', formats: ['iife'] } } });
  script = result[0].output.find((item: { type: string }) => item.type === 'chunk').code;
});

test('keyboard appearance editor, focus stability, reset and native teardown', async ({ page }) => {
  await page.setContent(readFileSync('tests/fixtures/project-conversation-list-2026-10.html', 'utf8'));
  await page.setViewportSize({ width: 1000, height: 720 });
  // Synthetic host styling only; never capture the user's actual chats.
  await page.addStyleTag({ content: `
    body { margin:0; background:#212121; color:#ececec; font:14px/1.5 system-ui,sans-serif; }
    main { width:min(680px,90vw); margin:32px auto; }
    ol { list-style:none; padding:0; margin:0; }
    ol > li { display:flex; align-items:center; gap:1rem; padding:12px; border-radius:12px; }
    ol > li > a { flex:1; min-width:0; color:inherit; text-decoration:none; }
    ol > li > div { display:flex; align-items:center; gap:.5rem; }
    ol > li > div > span { font-size:12px; opacity:.6; }
    ol > li > div > div { display:flex; }
    ol > li > div button:not(.projectpins-control) { color:inherit; background:none; border:0; }
    html[data-theme="light"] body { background:white; color:#171717; }
  ` });
  await page.addStyleTag({ content: readFileSync('src/ui/projectpins.css', 'utf8') });
  await page.addScriptTag({ content: script });
  await expect(page.locator('[data-projectpins-owned="panel"]')).toHaveCount(0);
  await expect(page.locator('[data-projectpins-status] summary')).toContainText(version);
  const row = page.locator('ol > li').first();
  const editor = page.locator('dialog.projectpins-editor');
  await row.getByRole('button', { name: 'Закрепить чат', exact: true }).click();
  await expect(page.locator('[data-projectpins-root] .projectpins-pinned-card')).toHaveCount(1);
  await expect(row).toBeHidden();
  await expect(page.locator('[data-projectpins-chats-heading]')).toHaveText('Чаты');
  await page.locator('[data-projectpins-root]').getByRole('button', { name: 'Теги и цвет названия', exact: true }).press('Enter');
  await editor.getByLabel('Цвет названия', { exact: true }).selectOption('purple');
  await editor.getByRole('button', { name: 'Добавить тег' }).click();
  const input = editor.getByLabel('Название тега');
  await input.fill('Работа');
  await editor.getByLabel('Цвет тега').selectOption('blue');
  await input.focus();
  // Simulate native activity without reading any message data.
  await page.evaluate(() => document.querySelector('main')!.append(document.createElement('div')));
  await expect(input).toBeFocused();
  await expect(input).toHaveValue('Работа');
  await editor.getByRole('button', { name: 'Сохранить', exact: true }).click();
  const nativeTitle = page.locator('ol a > div > div').first();
  await expect(nativeTitle).toHaveAttribute('data-projectpins-color', 'purple');
  await expect(nativeTitle).toHaveCSS('color', 'rgb(210, 176, 255)');
  await expect(page.locator('[data-projectpins-root] .projectpins-tag')).toHaveText('Работа');
  await expect(row.locator('.projectpins-tag')).toHaveText('Работа');
  await page.screenshot({ path: 'test-results/organizer-sanitized-dark.png' });
  await page.evaluate(() => { document.documentElement.dataset.theme = 'light'; });
  await expect(nativeTitle).toHaveCSS('color', 'rgb(113, 64, 165)');
  await page.locator('[data-projectpins-root]').getByRole('button', { name: 'Открепить чат', exact: true }).click();
  await expect(page.locator('[data-projectpins-root]')).toHaveCount(1);
  await expect(page.locator('[data-projectpins-root] .projectpins-pinned-card')).toHaveCount(0);
  await expect(row).toBeVisible();
  await expect(nativeTitle).toHaveAttribute('data-projectpins-color', 'purple');
  await page.screenshot({ path: 'test-results/organizer-sanitized.png' });
  await row.getByRole('button', { name: 'Теги и цвет названия', exact: true }).click();
  await editor.getByRole('button', { name: 'Сбросить цвет названия' }).click();
  await editor.getByRole('button', { name: 'Сохранить', exact: true }).click();
  await expect(nativeTitle).not.toHaveAttribute('data-projectpins-color');
  await page.evaluate(() => (window as unknown as { projectPinsTest: { runtime: { stop(): void } } }).projectPinsTest.runtime.stop());
  await expect(page.locator('[data-projectpins-owned]')).toHaveCount(0);
  await expect(page.locator('ol li')).toHaveCount(2);
  await expect(nativeTitle).toHaveText('Chat A');
});
