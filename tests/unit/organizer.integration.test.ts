import { readFileSync } from 'node:fs';
import { parseHTML } from 'linkedom';
import { describe, it, expect } from 'vitest';
import { ProjectConversationAdapter } from '../../src/adapter/project-conversation-adapter';
import { ProjectPinsRuntime } from '../../src/bootstrap';
import { ProjectPinController } from '../../src/core/pin-controller';
import { STORAGE_KEY, createEmptyState, type ProjectPinsState } from '../../src/core/model';
import { LocalProjectPinsRepository, parseStoredState } from '../../src/storage/repository';

const project = 'g-p-00000000000000000000000000000000-test-project';
const locationHref = `https://chatgpt.com/g/${project}/project`;
function fixture() { return parseHTML(readFileSync(new URL('../fixtures/project-conversation-list-2026-10.html', import.meta.url), 'utf8')); }

describe('approved project organizer', () => {
  it('recognizes the observed October layout and never reads its preview', () => {
    const { document } = fixture();
    for (const preview of document.querySelectorAll('[data-sanitized-preview]')) {
      Object.defineProperty(preview, 'textContent', { get() { throw new Error('Preview must not be read'); } });
    }
    const adapter = new ProjectConversationAdapter(document, { locationHref });
    const context = adapter.resolveContext()!;
    const rows = adapter.listConversationRows(context);
    expect(rows.map(row => row.title)).toEqual(['Chat A', 'Chat B']);
    expect(rows[0]?.titleElement).toBe(document.querySelector('ol a > div > div'));
    expect(rows[0]?.actionMount).toBe(document.querySelector('ol li > div > div'));
    expect(adapter.isDarkTheme()).toBe(true);
  });

  it('migrates v1 on read without modifying stored pins; rejects future/invalid appearances', async () => {
    const v1 = { schemaVersion: 1, projects: { [project]: { pins: [{ conversationKey: 'chat-a', href: `${locationHref}/chat-a`, title: 'Chat A', order: 0, pinnedAt: 1, updatedAt: 1 }], updatedAt: 1 } } };
    let saved: unknown = structuredClone(v1);
    const repo = new LocalProjectPinsRepository({ get: async () => ({ [STORAGE_KEY]: saved }), set: async items => { saved = items[STORAGE_KEY]; } });
    expect((await repo.readState()).schemaVersion).toBe(2);
    expect(saved).toEqual(v1);
    const controller = new ProjectPinController(repo);
    await controller.setAppearance(project, 'chat-a', { tags: [{ name: 'Work', color: 'blue' }], titleColor: 'purple' });
    expect((saved as ProjectPinsState).projects[project]?.pins).toEqual(v1.projects[project].pins);
    expect(() => parseStoredState({ schemaVersion: 3, projects: {} })).toThrow();
    expect(() => parseStoredState({ schemaVersion: 2, projects: { [project]: { pins: [], updatedAt: 1, annotations: { a: { tags: [], titleColor: 'url(evil)' } } } } })).toThrow();
  });

  it('preserves annotations through pin/unpin and isolates projects, including unpinned chats', async () => {
    let state = createEmptyState();
    const controller = new ProjectPinController({ readState: async () => structuredClone(state), writeState: async value => { state = structuredClone(value); } });
    const appearance = { tags: [{ name: 'Work', color: 'blue' as const }, { name: 'Urgent', color: 'red' as const }], titleColor: 'green' as const };
    await controller.setAppearance(project, 'chat-a', appearance);
    await controller.pin(project, { conversationKey: 'chat-a', href: locationHref, title: 'Chat A' });
    await controller.unpin(project, 'chat-a');
    expect((await controller.project(project)).annotations?.['chat-a']).toEqual(appearance);
    expect((await controller.project('another-project')).annotations).toBeUndefined();
    await controller.setAppearance(project, 'chat-a', { tags: [], titleColor: null });
    expect((await controller.project(project)).annotations).toEqual({});
  });

  it('preserves colors across durable reload, title refresh and queued concurrent edits', async () => {
    let persisted: unknown;
    const storage = { get: async () => ({ [STORAGE_KEY]: structuredClone(persisted) }),
      set: async (values: Record<string, unknown>) => { persisted = structuredClone(values[STORAGE_KEY]); } };
    const controller = new ProjectPinController(new LocalProjectPinsRepository(storage));
    const appearance = { tags: [{ name: 'Work', color: 'blue' as const }], titleColor: 'purple' as const };
    await Promise.all([
      controller.setAppearance(project, 'chat-a', appearance),
      controller.pin(project, { conversationKey: 'chat-a', href: locationHref, title: 'Chat A' }),
      controller.pin('project-b', { conversationKey: 'chat-b', href: locationHref, title: 'Chat B' }),
    ]);
    const reloaded = new ProjectPinController(new LocalProjectPinsRepository(storage));
    await reloaded.refreshTitle(project, 'chat-a', 'Renamed Chat A');
    expect((await reloaded.project(project)).annotations?.['chat-a']).toEqual(appearance);
    expect((await reloaded.list(project))[0]?.title).toBe('Renamed Chat A');
    expect(await reloaded.list('project-b')).toHaveLength(1);
    expect((await reloaded.project('project-b')).annotations).toBeUndefined();
  });

  it('reaches idle with a real MutationObserver; retains node identity and detects native list replacement', async () => {
    const { document, window } = fixture();
    let reads = 0;
    const controller = new ProjectPinController({ readState: async () => { reads++; return createEmptyState(); }, writeState: async () => {} });
    const frames = new Map<number, FrameRequestCallback>(); let id = 0;
    const runtime = new ProjectPinsRuntime({ document, adapter: new ProjectConversationAdapter(document, { locationHref }), controller,
      mutationObserverFactory: callback => new window.MutationObserver(callback),
      scheduleFrame: callback => { frames.set(++id, callback); return id; }, cancelFrame: key => { frames.delete(key); },
    });
    const drain = async () => {
      for (let i = 0; i < 8; i++) {
        const batch = [...frames.values()]; frames.clear(); for (const callback of batch) callback(0);
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    };
    runtime.start();
    try {
      await drain();
      expect(frames.size).toBe(0);
      const before = reads;
      const control = document.querySelector('[data-projectpins-native-control]');
      await drain();
      expect(reads).toBe(before);
      await runtime.reconcile(); await drain();
      expect(document.querySelector('[data-projectpins-native-control]')).toBe(control);
      document.querySelector('main')!.replaceChildren(fixture().document.querySelector('section')!);
      await drain();
      expect(document.querySelectorAll('[data-projectpins-native-control]')).toHaveLength(2);
      expect(document.querySelector('[data-projectpins-native-control]')).not.toBe(control);
      expect(frames.size).toBe(0);
    } finally { runtime.stop(); }
  });

  it('does not render an old project after a pending storage read resolves', async () => {
    const { document } = fixture();
    const real = new ProjectConversationAdapter(document, { locationHref });
    let current = real.resolveContext();
    let release!: () => void;
    const waiting = new Promise<void>(resolve => { release = resolve; });
    const runtime = new ProjectPinsRuntime({ document, adapter: { resolveContext: () => current, findPinnedMountPoint: c => c.root, listConversationRows: c => real.listConversationRows(c) },
      controller: new ProjectPinController({ readState: async () => { await waiting; return createEmptyState(); }, writeState: async () => {} }),
    });
    const pending = runtime.reconcile(); await Promise.resolve(); current = null; release(); await pending;
    expect(document.querySelector('[data-projectpins-owned="panel"]')).toBeNull();
    expect(document.querySelector('[data-projectpins-native-control]')).toBeNull();
  });

  it('keeps native tags and title colors scoped when switching projects and restores them on teardown', async () => {
    const { document } = fixture();
    const projectB = 'g-p-00000000000000000000000000000000-project-b';
    const key = '00000000-0000-4000-8000-000000000001';
    let state = createEmptyState();
    const controller = new ProjectPinController({ readState: async () => structuredClone(state), writeState: async next => { state = structuredClone(next); } });
    await controller.setAppearance(project, key, { tags: [{ name: 'Only A', color: 'green' }], titleColor: 'purple' });
    await controller.setAppearance(projectB, key, { tags: [{ name: 'Only B', color: 'red' }], titleColor: 'blue' });
    let active = new ProjectConversationAdapter(document, { locationHref });
    const runtime = new ProjectPinsRuntime({ document, controller, adapter: {
      resolveContext: () => active.resolveContext(), findPinnedMountPoint: c => active.findPinnedMountPoint(c),
      listConversationRows: c => active.listConversationRows(c), isDarkTheme: () => active.isDarkTheme(),
    } });
    runtime.start();
    try {
      await runtime.reconcile();
      expect(document.querySelector('ol .projectpins-tag')?.textContent).toBe('Only A');
      expect(document.querySelector('ol a > div > div')?.getAttribute('data-projectpins-color')).toBe('purple');
      for (const anchor of document.querySelectorAll<HTMLAnchorElement>('ol a')) anchor.href = anchor.getAttribute('href')!.replace(project, projectB);
      active = new ProjectConversationAdapter(document, { locationHref: `https://chatgpt.com/g/${projectB}/project` });
      await runtime.reconcile();
      expect(document.querySelector('ol .projectpins-tag')?.textContent).toBe('Only B');
      expect(document.querySelector('ol a > div > div')?.getAttribute('data-projectpins-color')).toBe('blue');
      expect(document.querySelector('[data-projectpins-owned="panel"]')).toBeNull();
    } finally { runtime.stop(); }
    expect(document.querySelector('[data-projectpins-color]')).toBeNull();
    expect(document.querySelector('.projectpins-tag')).toBeNull();
    expect(document.querySelector('ol a > div > div')?.textContent).toBe('Chat A');
  });

  it('hides only recognized pinned duplicates and restores the original native node on unpin or adapter failure', async () => {
    const { document } = fixture();
    const active = new ProjectConversationAdapter(document, { locationHref });
    let available = true;
    let state = createEmptyState();
    const controller = new ProjectPinController({ readState: async () => structuredClone(state), writeState: async next => { state = structuredClone(next); } });
    const runtime = new ProjectPinsRuntime({ document, controller, adapter: {
      resolveContext: () => available ? active.resolveContext() : null,
      findPinnedMountPoint: c => active.findPinnedMountPoint(c), listConversationRows: c => active.listConversationRows(c),
    } });
    const context = active.resolveContext()!;
    const row = active.listConversationRows(context)[0]!;
    runtime.start();
    try {
      await controller.pin(project, row); await runtime.reconcile();
      expect(row.element.dataset.projectpinsHidden).toBe('true');
      expect(document.querySelectorAll('ol li')).toHaveLength(2);
      expect(document.querySelector('ol li')).toBe(row.element);
      expect(document.querySelector('[data-projectpins-chats-heading]')?.textContent).toBe('Чаты');
      expect(document.querySelectorAll('[data-projectpins-root] a')).toHaveLength(1);
      await controller.unpin(project, row.conversationKey); await runtime.reconcile();
      expect(row.element.dataset.projectpinsHidden).toBeUndefined();
      await controller.pin(project, row); await runtime.reconcile();
      available = false; await runtime.reconcile();
      expect(row.element.dataset.projectpinsHidden).toBeUndefined();
      expect(document.querySelector('[data-projectpins-chats-heading]')).toBeNull();
      expect(document.querySelector('ol li')).toBe(row.element);
    } finally { runtime.stop(); }
  });
});
