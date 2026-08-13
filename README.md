# ProjectPins for ChatGPT

Local-first browser extension for pinning important conversations **inside individual ChatGPT Projects**.

> Status: specification complete, implementation not started.  
> Workflow: Token-Efficient Spec Kit compatible project, initialized from the structure and conventions of `Elguajo/Token-Efficient-Spec-Kit` (upstream observed version: `0.10.0` on 2026-08-12).

## Что делает MVP

Внутри открытого ChatGPT Project расширение:

1. добавляет кнопку `Pin` к строкам чатов;
2. хранит закрепления отдельно для каждого Project;
3. показывает собственный компактный блок `Pinned` в верхней части списка чатов проекта;
4. сохраняет закрепления после перезагрузки;
5. не читает текст сообщений, файлы, prompt input или ответы;
6. не отправляет данные на сервер и не требует backend.

Главная инженерная идея: **не переставлять React/ChatGPT DOM-узлы**, а рендерить отдельный extension-owned `Pinned` section с ссылками на закреплённые разговоры. Это устойчивее к re-render ChatGPT.

## Быстрый старт для Codex / Claude Code

```bash
git init
npm install
npm run build
python tools/audit.py
```

Затем открой репозиторий в coding agent и отправь текст из:

```text
docs/project/NEXT_SESSION.md
```

Проект уже инициализирован. **Не запускай `prompts/START_NEW_PROJECT.md`**, если не хочешь сбросить продуктовую постановку.

## Текущий этап

Смотри единственный источник истины:

```text
docs/project/ROADMAP.md
```

Текущая фаза отмечена `[>]`.

## Stack

- WXT
- TypeScript
- Manifest V3
- browser/chrome storage local
- Vitest
- Playwright for extension/browser QA
- no React
- no backend
- no remote code
- host scope: `https://chatgpt.com/*`

## Важные документы

- `docs/project/PROJECT_BRIEF.md` — продукт и границы MVP.
- `docs/project/ARCHITECTURE.md` — архитектура и технические решения.
- `docs/project/ROADMAP.md` — фазы и текущий статус.
- `docs/product/DOM_ADAPTER.md` — как переживать изменения UI ChatGPT.
- `docs/product/UI_AND_FLOWS.md` — UX поведения Pin/Unpin.
- `docs/product/PRIVACY_AND_SECURITY.md` — local-first и permissions.
- `docs/product/TEST_MATRIX.md` — обязательная проверка.
- `docs/research/PLATFORM_NOTES.md` — подтверждённые внешние ограничения и ссылки.

## Product naming

`ProjectPins for ChatGPT` — рабочее имя. Перед публикацией проверить требования Chrome Web Store и правила использования торговых марок. В listing явно указывать, что расширение независимо и не аффилировано с OpenAI.

## License

MIT. See `LICENSE`.
