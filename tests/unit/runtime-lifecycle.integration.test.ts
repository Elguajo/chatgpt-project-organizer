import { readFileSync } from 'node:fs';
import { parseHTML } from 'linkedom';
import { describe, expect, it } from 'vitest';
import type { ChatGptDomAdapter, ConversationRow, ProjectContext } from '../../src/adapter/contracts';
import { ProjectPinsRuntime } from '../../src/bootstrap';
import { ProjectPinController } from '../../src/core/pin-controller';
import { createEmptyState, type ProjectPinsStateV1 } from '../../src/core/model';
import type { ProjectPinsRepository } from '../../src/storage/repository';

const projectA = 'g-p-00000000000000000000000000000000-project-a';
const projectB = 'g-p-00000000000000000000000000000000-project-b';

class MemoryRepository implements ProjectPinsRepository {
  state: ProjectPinsStateV1 = createEmptyState();

  async readState(): Promise<ProjectPinsStateV1> {
    return structuredClone(this.state);
  }

  async writeState(state: ProjectPinsStateV1): Promise<void> {
    this.state = structuredClone(state);
  }
}

class RecordingObserver {
  observedTarget: Node | null = null;
  disconnected = false;

  constructor(private readonly callback: MutationCallback) {}

  observe(target: Node): void {
    this.observedTarget = target;
  }

  disconnect(): void {
    this.disconnected = true;
  }

  trigger(): void {
    this.callback([], this as unknown as MutationObserver);
  }
}

class FrameQueue {
  private nextHandle = 1;
  private readonly callbacks = new Map<number, FrameRequestCallback>();

  schedule = (callback: FrameRequestCallback): number => {
    const handle = this.nextHandle++;
    this.callbacks.set(handle, callback);
    return handle;
  };

  cancel = (handle: number): void => {
    this.callbacks.delete(handle);
  };

  flush(): void {
    const callbacks = [...this.callbacks.values()];
    this.callbacks.clear();
    for (const callback of callbacks) callback(0);
  }

  get size(): number {
    return this.callbacks.size;
  }
}

function fixtureDocument(): Document {
  const fixture = readFileSync(new URL('../fixtures/project-conversation-list.html', import.meta.url), 'utf8');
  return parseHTML(fixture).document;
}

function contextFor(document: Document, projectKey: string): ProjectContext {
  return {
    projectKey,
    root: document.querySelector('section')!,
  };
}

function rowFor(document: Document, projectKey: string, conversationKey: string, title: string): ConversationRow {
  const element = document.querySelector('li')! as HTMLElement;
  return {
    conversationKey,
    href: `https://chatgpt.com/g/${projectKey}/c/${conversationKey}`,
    title,
    element,
    actionMount: element.querySelector('div > div:last-child')! as HTMLElement,
  };
}

function adapterFor(
  document: Document,
  current: () => { context: ProjectContext | null; rows: ConversationRow[] },
): ChatGptDomAdapter {
  return {
    resolveContext: () => current().context,
    findPinnedMountPoint: (context) => {
      const state = current();
      return state.context?.projectKey === context.projectKey && state.context.root === context.root
        ? context.root
        : null;
    },
    listConversationRows: (context) => {
      const state = current();
      return state.context?.projectKey === context.projectKey && state.context.root === context.root
        ? state.rows
        : [];
    },
  };
}

async function settle(runtime: ProjectPinsRuntime, frames: FrameQueue): Promise<void> {
  frames.flush();
  await new Promise((resolve) => setTimeout(resolve, 0));
  await runtime.reconcile();
}

describe('ProjectPins runtime lifecycle', () => {
  it('coalesces 50 route and DOM signals without accumulating lifecycle ownership', async () => {
    const document = fixtureDocument();
    const view = document.defaultView!;
    const frames = new FrameQueue();
    const observers: RecordingObserver[] = [];
    const contentScriptLifetime = new AbortController();
    const controller = new ProjectPinController(new MemoryRepository(), () => 100);
    const rows = {
      a: rowFor(document, projectA, '00000000-0000-4000-8000-000000000041', 'Chat A'),
      b: rowFor(document, projectB, '00000000-0000-4000-8000-000000000042', 'Chat B'),
    };
    await controller.pin(projectA, rows.a);
    await controller.pin(projectB, rows.b);
    let active = 'a' as 'a' | 'b';
    const runtime = new ProjectPinsRuntime({
      document,
      window: view,
      adapter: adapterFor(document, () => ({
        context: contextFor(document, active === 'a' ? projectA : projectB),
        rows: [rows[active]],
      })),
      controller,
      abortSignal: contentScriptLifetime.signal,
      mutationObserverFactory: (callback) => {
        const observer = new RecordingObserver(callback);
        observers.push(observer);
        return observer;
      },
      scheduleFrame: frames.schedule,
      cancelFrame: frames.cancel,
    });

    runtime.start();
    runtime.start();
    expect(observers).toHaveLength(1);
    expect(observers[0]?.observedTarget).toBe(document.documentElement);
    expect(frames.size).toBe(1);
    await settle(runtime, frames);
    expect(document.querySelector('[data-projectpins-root] .projectpins-card-title')?.textContent).toBe('Chat A');

    for (let navigation = 0; navigation < 50; navigation += 1) {
      active = active === 'a' ? 'b' : 'a';
      observers[0]?.trigger();
      view.dispatchEvent(new view.Event('popstate'));
      view.dispatchEvent(new view.Event('hashchange'));
      expect(frames.size).toBe(1);
      await settle(runtime, frames);
      expect(document.querySelector('[data-projectpins-root] .projectpins-card-title')?.textContent).toBe(
        active === 'a' ? 'Chat A' : 'Chat B',
      );
    }

    contentScriptLifetime.abort();
    expect(observers[0]?.disconnected).toBe(true);
    view.dispatchEvent(new view.Event('popstate'));
    observers[0]?.trigger();
    expect(frames.size).toBe(0);
  });

  it('reconciles after native list replacement and removes only extension UI on adapter failure', async () => {
    const document = fixtureDocument();
    const frames = new FrameQueue();
    const observers: RecordingObserver[] = [];
    const controller = new ProjectPinController(new MemoryRepository(), () => 100);
    let recognized = true;
    let row = rowFor(document, projectA, '00000000-0000-4000-8000-000000000051', 'Chat A');
    await controller.pin(projectA, row);
    const runtime = new ProjectPinsRuntime({
      document,
      adapter: adapterFor(document, () => ({
        context: recognized ? contextFor(document, projectA) : null,
        rows: [row],
      })),
      controller,
      mutationObserverFactory: (callback) => {
        const observer = new RecordingObserver(callback);
        observers.push(observer);
        return observer;
      },
      scheduleFrame: frames.schedule,
      cancelFrame: frames.cancel,
    });

    runtime.start();
    await settle(runtime, frames);
    const originalNativeRow = row.element;
    expect(document.querySelector('[data-projectpins-root]')).not.toBeNull();

    const replacement = fixtureDocument().querySelector('section')!;
    document.body.replaceChildren(replacement);
    row = rowFor(document, projectA, '00000000-0000-4000-8000-000000000051', 'Chat A');
    observers[0]?.trigger();
    await settle(runtime, frames);
    expect(document.querySelector('[data-projectpins-root] .projectpins-card-title')?.textContent).toBe('Chat A');
    expect(row.element).not.toBe(originalNativeRow);
    expect(document.querySelectorAll('[data-projectpins-native-control]')).toHaveLength(1);

    recognized = false;
    observers[0]?.trigger();
    await settle(runtime, frames);
    expect(document.querySelector('[data-projectpins-root]')).toBeNull();
    expect(document.querySelector('[data-projectpins-native-control]')).toBeNull();
    expect(document.querySelector('ol li')).toBe(row.element);
    expect(document.querySelector('ol a')?.textContent).toBe('Chat A');
    runtime.stop();
  });

  it('rechecks on BFCache restore and when a hidden tab becomes visible', async () => {
    const document = fixtureDocument();
    const view = document.defaultView!;
    const frames = new FrameQueue();
    const controller = new ProjectPinController(new MemoryRepository(), () => 100);
    const row = rowFor(document, projectA, '00000000-0000-4000-8000-000000000061', 'Chat A');
    const runtime = new ProjectPinsRuntime({
      document,
      window: view,
      adapter: adapterFor(document, () => ({ context: contextFor(document, projectA), rows: [row] })),
      controller,
      scheduleFrame: frames.schedule,
      cancelFrame: frames.cancel,
    });

    runtime.start();
    await settle(runtime, frames);
    view.dispatchEvent(new view.Event('pageshow'));
    expect(frames.size).toBe(1);
    frames.flush();
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
    document.dispatchEvent(new view.Event('visibilitychange'));
    expect(frames.size).toBe(0);
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
    document.dispatchEvent(new view.Event('visibilitychange'));
    expect(frames.size).toBe(1);
    runtime.stop();
  });

  it('reconciles a visible 100-row Project list within the 20 ms soft budget', async () => {
    const document = fixtureDocument();
    const list = document.querySelector('ol')!;
    const template = list.firstElementChild!;
    const rows: ConversationRow[] = [];
    for (let index = 0; index < 100; index += 1) {
      const element = (index === 0 ? template : template.cloneNode(true)) as HTMLElement;
      if (index > 0) list.append(element);
      rows.push({
        conversationKey: `sanitized-conversation-${index}`,
        href: `https://chatgpt.com/g/${projectA}/c/sanitized-conversation-${index}`,
        title: `Chat ${index}`,
        element,
        actionMount: element.querySelector('div > div:last-child')! as HTMLElement,
      });
    }
    const controller = new ProjectPinController(new MemoryRepository(), () => 100);
    const runtime = new ProjectPinsRuntime({
      document,
      adapter: adapterFor(document, () => ({ context: contextFor(document, projectA), rows })),
      controller,
    });
    const durations: number[] = [];
    for (let run = 0; run < 5; run += 1) {
      const startedAt = performance.now();
      await runtime.reconcile();
      durations.push(performance.now() - startedAt);
    }

    const median = durations.sort((left, right) => left - right)[Math.floor(durations.length / 2)]!;
    expect(median).toBeLessThan(20);
    expect(document.querySelectorAll('[data-projectpins-native-control]')).toHaveLength(100);
  });
});
