// ==UserScript==
// @name         ChatGPT Response Collapser
// @namespace    https://github.com/Elguajo/chatgpt-project-organizer
// @version      0.1.0
// @description  Adds collapse/expand controls to ChatGPT assistant responses without reading message contents.
// @author       Elguajo
// @match        https://chatgpt.com/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(() => {
  'use strict';

  const TURN_SELECTOR = '[data-testid^="conversation-turn-"]';
  const HOST_ATTR = 'data-elguajo-response-collapser';
  const COLLAPSED_ATTR = 'data-collapsed';

  // In-memory state survives ChatGPT virtualization/remounting during this page session.
  // No message text is read or stored.
  const collapsedByTurn = new Map();

  let frameId = null;
  let lastPathname = location.pathname;

  function injectStyles() {
    if (document.querySelector('style[data-elguajo-response-collapser-style]')) return;

    const style = document.createElement('style');
    style.setAttribute('data-elguajo-response-collapser-style', '');
    style.textContent = `
      [${HOST_ATTR}] {
        position: relative;
        z-index: 2;
        height: 28px;
        margin: 0 auto 4px;
        max-width: min(48rem, calc(100% - 24px));
        pointer-events: none;
      }

      [${HOST_ATTR}] > button {
        pointer-events: auto;
        position: absolute;
        right: 0;
        top: 0;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        min-width: 28px;
        height: 28px;
        padding: 0 8px;
        border: 0;
        border-radius: 8px;
        background: transparent;
        color: inherit;
        font: inherit;
        font-size: 12px;
        line-height: 1;
        cursor: pointer;
        opacity: 0.58;
      }

      [${HOST_ATTR}] > button:hover,
      [${HOST_ATTR}] > button:focus-visible {
        opacity: 1;
        background: color-mix(in srgb, currentColor 9%, transparent);
        outline: none;
      }

      /*
       * Collapse only through extension-owned state.
       * We do not move, delete, or set attributes/styles on ChatGPT-owned children.
       */
      ${TURN_SELECTOR}:has(> [${HOST_ATTR}][${COLLAPSED_ATTR}="true"]) > :not([${HOST_ATTR}]) {
        display: none !important;
      }

      ${TURN_SELECTOR}:has(> [${HOST_ATTR}][${COLLAPSED_ATTR}="true"]) > [${HOST_ATTR}] {
        margin-bottom: 8px;
      }
    `;

    (document.head || document.documentElement).appendChild(style);
  }

  function isAssistantTurn(turn) {
    if (!(turn instanceof HTMLElement)) return false;

    if (turn.getAttribute('data-turn') === 'assistant') return true;
    if (turn.getAttribute('data-message-author-role') === 'assistant') return true;

    return Boolean(turn.querySelector('[data-message-author-role="assistant"]'));
  }

  function turnKey(turn) {
    const testId = turn.getAttribute('data-testid');
    if (!testId) return null;
    return `${location.pathname}::${testId}`;
  }

  function buttonText(collapsed) {
    return collapsed ? 'Развернуть' : 'Свернуть';
  }

  function buttonLabel(collapsed) {
    return collapsed ? 'Развернуть ответ ChatGPT' : 'Свернуть ответ ChatGPT';
  }

  function syncHost(host, collapsed) {
    host.setAttribute(COLLAPSED_ATTR, String(collapsed));

    const button = host.querySelector('button');
    if (!button) return;

    button.setAttribute('aria-expanded', String(!collapsed));
    button.setAttribute('aria-label', buttonLabel(collapsed));
    button.setAttribute('title', buttonLabel(collapsed));

    const icon = button.querySelector('[data-collapser-icon]');
    const text = button.querySelector('[data-collapser-text]');
    if (icon) icon.textContent = collapsed ? '⌄' : '⌃';
    if (text) text.textContent = buttonText(collapsed);
  }

  function createHost(turn, key) {
    const host = document.createElement('div');
    host.setAttribute(HOST_ATTR, '');

    const button = document.createElement('button');
    button.type = 'button';

    const icon = document.createElement('span');
    icon.setAttribute('data-collapser-icon', '');
    icon.setAttribute('aria-hidden', 'true');

    const text = document.createElement('span');
    text.setAttribute('data-collapser-text', '');

    button.append(icon, text);
    host.append(button);

    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();

      const nextCollapsed = host.getAttribute(COLLAPSED_ATTR) !== 'true';
      collapsedByTurn.set(key, nextCollapsed);
      syncHost(host, nextCollapsed);
    }, true);

    const collapsed = collapsedByTurn.get(key) ?? false;
    syncHost(host, collapsed);

    // Add only one extension-owned direct child; do not move native React nodes.
    // Appending keeps the control after the response when expanded; when collapsed
    // it becomes the only visible direct child of the turn.
    turn.append(host);
  }

  function reconcileTurn(turn) {
    if (!isAssistantTurn(turn)) return;

    const key = turnKey(turn);
    if (!key) return;

    const existingHost = Array.from(turn.children).find(
      (child) => child instanceof HTMLElement && child.hasAttribute(HOST_ATTR),
    );

    if (existingHost instanceof HTMLElement) {
      syncHost(existingHost, collapsedByTurn.get(key) ?? false);
      return;
    }

    createHost(turn, key);
  }

  function reconcile() {
    frameId = null;

    if (location.pathname !== lastPathname) {
      lastPathname = location.pathname;
    }

    injectStyles();
    document.querySelectorAll(TURN_SELECTOR).forEach(reconcileTurn);
  }

  function scheduleReconcile() {
    if (frameId !== null) return;
    frameId = requestAnimationFrame(reconcile);
  }

  const observer = new MutationObserver(scheduleReconcile);
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: false,
    characterData: false,
  });

  addEventListener('popstate', scheduleReconcile);
  addEventListener('hashchange', scheduleReconcile);
  addEventListener('pageshow', scheduleReconcile);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') scheduleReconcile();
  });

  scheduleReconcile();
})();
