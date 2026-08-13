import { readFileSync } from 'node:fs';
import { parseHTML } from 'linkedom';
import { describe, expect, it } from 'vitest';
import { ProjectConversationAdapter } from '../../src/adapter/project-conversation-adapter';
import type { ChatGptDomAdapter, ProjectContext } from '../../src/adapter/contracts';
import { ProjectPinsRuntime } from '../../src/bootstrap';
import { ProjectPinController } from '../../src/core/pin-controller';
import { createEmptyState, type ProjectPinsStateV1 } from '../../src/core/model';
import type { ProjectPinsRepository } from '../../src/storage/repository';

const projectKey = 'g-p-00000000000000000000000000000000-test-project';
const projectLocation = `https://chatgpt.com/g/${projectKey}/project`;

class MemoryRepository implements ProjectPinsRepository {
  state: ProjectPinsStateV1 = createEmptyState();

  async readState(): Promise<ProjectPinsStateV1> {
    return structuredClone(this.state);
  }

  async writeState(state: ProjectPinsStateV1): Promise<void> {
    this.state = structuredClone(state);
  }
}

function runtimeForFixture(fixtureName = 'project-conversation-list.html') {
  const fixture = readFileSync(new URL(`../fixtures/${fixtureName}`, import.meta.url), 'utf8');
  const { document } = parseHTML(fixture);
  const repository = new MemoryRepository();
  const runtime = new ProjectPinsRuntime({
    document,
    adapter: new ProjectConversationAdapter(document, { locationHref: projectLocation }),
    controller: new ProjectPinController(repository, () => 100),
  });
  return { document, repository, runtime };
}

async function settleUi(runtime: ProjectPinsRuntime): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
  await runtime.reconcile();
}

function click(document: Document, control: HTMLButtonElement): void {
  const EventConstructor = document.defaultView!.Event;
  control.dispatchEvent(new EventConstructor('click', { bubbles: true }));
}

describe('Pinned UI integration', () => {
  it('retains only a safe error code when a pin write fails', async () => {
    const { document, runtime } = runtimeForFixture();
    const failingRepository: ProjectPinsRepository = {
      readState: async () => createEmptyState(),
      writeState: async () => Promise.reject(new Error('sanitized write failure')),
    };
    const failingRuntime = new ProjectPinsRuntime({
      document,
      adapter: new ProjectConversationAdapter(document, { locationHref: projectLocation }),
      controller: new ProjectPinController(failingRepository, () => 100),
    });

    failingRuntime.start();
    await settleUi(failingRuntime);
    const control = document.querySelector<HTMLButtonElement>('[data-projectpins-native-control]')!;
    click(document, control);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(control.dataset.projectpinsError).toBe('PP_ACTION_FAILED');
    expect(control.dataset.projectpinsError).not.toMatch(/title|href|message/i);
    failingRuntime.stop();
    runtime.stop();
  });

  it('waits for a Project list that hydrates after the content script starts', async () => {
    const { document, runtime } = runtimeForFixture();
    const readyAdapter = new ProjectConversationAdapter(document, { locationHref: projectLocation });
    let available = false;
    const delayedAdapter: ChatGptDomAdapter = {
      resolveContext: () => (available ? readyAdapter.resolveContext() : null),
      findPinnedMountPoint: (context: ProjectContext) => readyAdapter.findPinnedMountPoint(context),
      listConversationRows: (context: ProjectContext) => readyAdapter.listConversationRows(context),
    };
    const delayedRuntime = new ProjectPinsRuntime({
      document,
      adapter: delayedAdapter,
      controller: new ProjectPinController(new MemoryRepository(), () => 100),
    });

    delayedRuntime.start();
    available = true;
    await new Promise((resolve) => setTimeout(resolve, 300));

    expect(document.querySelectorAll('[data-projectpins-native-control]')).toHaveLength(2);
    delayedRuntime.stop();
    runtime.stop();
  });

  it('hides the Pinned section with zero pins and adds one accessible control per recognized row', async () => {
    const { document, runtime } = runtimeForFixture();
    runtime.start();
    await settleUi(runtime);

    expect(document.querySelector('[data-projectpins-root]')).toBeNull();
    const controls = document.querySelectorAll<HTMLButtonElement>('[data-projectpins-native-control]');
    expect(controls).toHaveLength(2);
    expect([...controls].map((control) => control.getAttribute('aria-pressed'))).toEqual([
      'false',
      'false',
    ]);
    expect([...controls].map((control) => control.getAttribute('aria-label'))).toEqual([
      'Pin chat',
      'Pin chat',
    ]);
    expect([...controls].map((control) => control.textContent)).toEqual(['', '']);
    expect([...controls].every((control) => control.parentElement?.firstElementChild === control)).toBe(true);
  });

  it('pins and unpins through delegated button clicks without moving the native row', async () => {
    const { document, repository, runtime } = runtimeForFixture();
    const nativeList = document.querySelector('ol')!;
    const firstNativeRow = nativeList.firstElementChild;
    runtime.start();
    await settleUi(runtime);

    click(document, document.querySelector<HTMLButtonElement>('[data-projectpins-native-control]')!);
    await settleUi(runtime);

    const section = document.querySelector<HTMLElement>('[data-projectpins-root]');
    expect(section?.parentElement?.firstElementChild).toBe(section);
    expect(section?.getAttribute('aria-labelledby')).toBe('projectpins-pinned-heading');
    expect(section?.querySelector('h2')?.id).toBe('projectpins-pinned-heading');
    expect(section?.querySelector('.projectpins-card-title')?.textContent).toBe('Chat A');
    expect(section?.querySelector('a')?.getAttribute('href')).toBe(
      `https://chatgpt.com/g/${projectKey}/c/00000000-0000-4000-8000-000000000001`,
    );
    expect(nativeList.firstElementChild).toBe(firstNativeRow);
    expect(document.querySelector<HTMLButtonElement>('[data-projectpins-native-control]')?.getAttribute('aria-pressed')).toBe(
      'true',
    );
    expect(section?.querySelectorAll('.projectpins-pinned-card')).toHaveLength(1);
    expect(section?.querySelector('.projectpins-card-kicker')?.textContent).toBe('Open chat');
    expect(section?.querySelector<HTMLButtonElement>('.projectpins-card-unpin')?.textContent).toBe('');
    expect(section?.querySelector<HTMLButtonElement>('.projectpins-card-unpin')?.getAttribute('aria-label')).toBe(
      'Unpin chat',
    );
    expect(repository.state.projects[projectKey]?.pins).toHaveLength(1);

    click(document, section!.querySelector<HTMLButtonElement>('[data-projectpins-action="unpin"]')!);
    await settleUi(runtime);

    expect(document.querySelector('[data-projectpins-root]')).toBeNull();
    expect(nativeList.firstElementChild).toBe(firstNativeRow);
    expect(repository.state.projects[projectKey]?.pins).toEqual([]);
  });

  it('pins through the extension-owned control fallback when a row click does not bubble', async () => {
    const { document, repository, runtime } = runtimeForFixture();
    runtime.start();
    await settleUi(runtime);

    const control = document.querySelector<HTMLButtonElement>('[data-projectpins-native-control]')!;
    control.dispatchEvent(new document.defaultView!.Event('click'));
    await settleUi(runtime);

    expect(repository.state.projects[projectKey]?.pins).toHaveLength(1);
    expect(document.querySelector('[data-projectpins-root]')).not.toBeNull();
  });

  it('is idempotent, refreshes observed titles, and renders untrusted titles as text', async () => {
    const { document, runtime } = runtimeForFixture();
    runtime.start();
    await settleUi(runtime);

    const nativeAnchor = document.querySelector('ol a')!;
    click(document, document.querySelector<HTMLButtonElement>('[data-projectpins-native-control]')!);
    await settleUi(runtime);
    nativeAnchor.textContent = '<img src=x onerror=alert(1)>';
    await runtime.reconcile();

    expect(document.querySelectorAll('[data-projectpins-root]')).toHaveLength(1);
    expect(document.querySelectorAll('[data-projectpins-native-control]')).toHaveLength(2);
    expect(document.querySelector('[data-projectpins-root] .projectpins-card-title')?.textContent).toBe(
      '<img src=x onerror=alert(1)>',
    );
    expect(document.querySelector('[data-projectpins-root] img')).toBeNull();
  });

  it('uses Russian microcopy and removes only extension-owned nodes during teardown', async () => {
    const { document, runtime } = runtimeForFixture('project-conversation-list-ru.html');
    const nativeList = document.querySelector('ol')!;
    const nativeRow = nativeList.firstElementChild;
    runtime.start();
    await settleUi(runtime);

    const control = document.querySelector<HTMLButtonElement>('[data-projectpins-native-control]')!;
    expect(control.getAttribute('aria-label')).toBe('Закрепить чат');
    expect(control.type).toBe('button');
    click(document, control);
    await settleUi(runtime);
    expect(document.querySelector('[data-projectpins-root] h2')?.textContent).toBe('Закреплённые');

    runtime.stop();
    expect(document.querySelector('[data-projectpins-root]')).toBeNull();
    expect(document.querySelector('[data-projectpins-native-control]')).toBeNull();
    expect(nativeList.firstElementChild).toBe(nativeRow);
    expect(nativeList.querySelectorAll('a')).toHaveLength(2);
  });
});
