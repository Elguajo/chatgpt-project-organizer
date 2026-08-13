# Platform Notes — verified 2026-08-12

This file records only external facts that influence the architecture.

## ChatGPT Projects

OpenAI describes Projects as workspaces that group chats, files and instructions, and makes Projects available across free and paid plans.

References:

- https://help.openai.com/en/articles/10169521-projects-in-chatgpt
- https://openai.com/academy/projects/

Implication: the extension targets the Project conversation navigation UI, not a separate OpenAI API.

The exact ChatGPT DOM and route schema are not documented as a stable extension API. They must be inspected against the live product before shipping.

## Chrome content scripts

Chrome documents that content scripts can read and modify page DOM while running in an isolated world, and can access extension storage/runtime capabilities.

Reference:

- https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts

Implication: MVP can be implemented as a content script without MAIN-world code.

## Chrome storage

Chrome documents `chrome.storage` as extension-specific storage. Current `storage.local` quota is 10 MB, which is far above the small metadata footprint expected here.

Reference:

- https://developer.chrome.com/docs/extensions/reference/api/storage

Implication: no backend/database is needed.

## Permissions

Chrome recommends declaring only necessary permissions and notes that host/content-script match patterns can produce user-facing permission warnings.

Reference:

- https://developer.chrome.com/docs/extensions/develop/concepts/declare-permissions

Implication: limit injection to `https://chatgpt.com/*` and use only `storage` capability.

## Manifest V3

Chrome's current extension manifest format is MV3.

Reference:

- https://developer.chrome.com/docs/extensions/mv3/manifest

## WXT

WXT currently supports MV3, TypeScript, content-script entrypoints, packaging and multiple browsers. The npm package observed on 2026-08-12 was `0.21.1`. WXT's official upgrade guide states that while it remains pre-1.0, `0.X` minor changes can be breaking.

References:

- https://wxt.dev/
- https://wxt.dev/guide/installation
- https://wxt.dev/guide/essentials/config/manifest.html
- https://wxt.dev/guide/resources/upgrading

Implication: pin the chosen version for the initial implementation and review upgrade notes before framework bumps.

## Package reference points observed during planning

- TypeScript: 7.0.2
- Vitest: 4.1.10
- Playwright: current 1.62 line observed

These are planning-time references, not permission to auto-upgrade in a later session. Verify package compatibility when installing.
