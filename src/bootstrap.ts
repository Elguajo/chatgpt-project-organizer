import type { ChatGptDomAdapter, ConversationRow, ProjectContext } from './adapter/contracts';
import { ProjectConversationAdapter } from './adapter/project-conversation-adapter';
import { ProjectPinController } from './core/pin-controller';
import {
  LocalProjectPinsRepository,
  ProjectPinsStorageError,
} from './storage/repository';
import { PinnedUiRenderer } from './ui/pinned-ui';
import { OrganizerUi } from './ui/organizer-ui';

export interface ProjectPinsRuntimeDependencies {
  document?: Document;
  window?: Window;
  adapter?: ChatGptDomAdapter;
  controller?: ProjectPinController;
  renderer?: PinnedUiRenderer;
  abortSignal?: AbortSignal | undefined;
  mutationObserverFactory?: MutationObserverFactory;
  scheduleFrame?: FrameScheduler;
  cancelFrame?: FrameCanceller;
}

interface MutationObserverLike {
  observe(target: Node, options: MutationObserverInit): void;
  disconnect(): void;
}

type MutationObserverFactory = (callback: MutationCallback) => MutationObserverLike;
type FrameScheduler = (callback: FrameRequestCallback) => number;
type FrameCanceller = (handle: number) => void;

/** Coordinates adapter metadata, local pin state, and extension-owned UI. */
export class ProjectPinsRuntime {
  private reconcileTail: Promise<void> = Promise.resolve();
  private observer: MutationObserverLike | null = null;
  private scheduledFrame: number | null = null;
  private started = false;
  private stopped = false;
  private readonly document: Document;
  private readonly window: Window | null;
  private readonly adapter: ChatGptDomAdapter;
  private readonly controller: ProjectPinController;
  private readonly renderer: PinnedUiRenderer;
  private readonly organizer: OrganizerUi;
  private activeContext: ProjectContext | null = null;
  private readonly abortSignal: AbortSignal | undefined;
  private readonly mutationObserverFactory: MutationObserverFactory | null;
  private readonly scheduleFrame: FrameScheduler;
  private readonly cancelFrame: FrameCanceller;

  constructor(dependencies: ProjectPinsRuntimeDependencies = {}) {
    this.document = dependencies.document ?? globalThis.document;
    this.window = dependencies.window ?? this.document.defaultView;
    this.adapter = dependencies.adapter ?? new ProjectConversationAdapter(this.document);
    this.controller = dependencies.controller ?? new ProjectPinController(new LocalProjectPinsRepository());
    this.renderer = dependencies.renderer ?? new PinnedUiRenderer(this.document);
    this.organizer = new OrganizerUi(this.document);
    this.abortSignal = dependencies.abortSignal;
    this.mutationObserverFactory =
      dependencies.mutationObserverFactory ?? mutationObserverFactoryFor(this.window);
    this.scheduleFrame = dependencies.scheduleFrame ?? frameSchedulerFor(this.window);
    this.cancelFrame = dependencies.cancelFrame ?? frameCancellerFor(this.window);
  }

  start(): void {
    if (this.started) return;
    if (this.abortSignal?.aborted) {
      this.renderer.teardown();
      return;
    }

    this.started = true;
    this.stopped = false;
    this.abortSignal?.addEventListener('abort', this.onAbort, { once: true });
    // ChatGPT owns the row subtree and can stop a bubbling click before it
    // reaches document. Capture extension controls before React handles them.
    this.document.addEventListener('click', this.onClick, true);
    this.document.addEventListener('visibilitychange', this.onVisibilityChange);
    this.window?.addEventListener('popstate', this.onRouteChange);
    this.window?.addEventListener('hashchange', this.onRouteChange);
    this.window?.addEventListener('pageshow', this.onPageShow);
    this.observeDom();
    this.scheduleReconcile();
  }

  stop(): void {
    if (!this.started) return;

    this.stopped = true;
    this.started = false;
    this.abortSignal?.removeEventListener('abort', this.onAbort);
    if (this.scheduledFrame !== null) {
      this.cancelFrame(this.scheduledFrame);
      this.scheduledFrame = null;
    }
    this.observer?.disconnect();
    this.observer = null;
    this.document.removeEventListener('click', this.onClick, true);
    this.document.removeEventListener('visibilitychange', this.onVisibilityChange);
    this.window?.removeEventListener('popstate', this.onRouteChange);
    this.window?.removeEventListener('hashchange', this.onRouteChange);
    this.window?.removeEventListener('pageshow', this.onPageShow);
    this.renderer.teardown();
    this.organizer.teardown();
  }

  reconcile(): Promise<void> {
    const run = this.reconcileTail.then(() => this.reconcileOnce());
    this.reconcileTail = run.catch(() => undefined);
    return run;
  }

  refresh(): void { this.scheduleReconcile(); }

  /**
   * All navigation and DOM signals share one animation-frame queue. The observer
   * watches the document root so it survives native Project list replacement.
   */
  private observeDom(): void {
    if (!this.mutationObserverFactory || !this.document.documentElement) return;
    this.observer = this.mutationObserverFactory(this.onDomMutation);
    this.observer.observe(this.document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'data-theme', 'href'],
      characterData: true,
    });
  }

  private scheduleReconcile(): void {
    if (this.stopped || this.scheduledFrame !== null) return;
    this.scheduledFrame = this.scheduleFrame(() => {
      this.scheduledFrame = null;
      void this.reconcile().catch(error => this.showError(error));
    });
  }

  private async reconcileOnce(): Promise<void> {
    if (this.stopped) return;
    this.organizer.theme(this.adapter.isDarkTheme?.() ?? false);

    const context = this.adapter.resolveContext();
    if (!context) {
      this.renderer.teardown();
      this.organizer.clearProject();
      this.activeContext = null;
      this.organizer.status(this.adapter.status?.() ?? 'PP_ADAPTER_NO_PROJECT', this.onRouteChange);
      return;
    }

    const mountPoint = this.adapter.findPinnedMountPoint(context);
    if (!mountPoint) {
      this.renderer.teardown();
      this.organizer.clearProject();
      this.activeContext = null;
      this.organizer.status('PP_ADAPTER_NO_LIST_MOUNT', this.onRouteChange);
      return;
    }

    if (this.activeContext && (this.activeContext.projectKey !== context.projectKey || this.activeContext.root !== context.root)) {
      this.renderer.teardown(); this.organizer.clearProject();
    }
    this.activeContext = context;
    const rows = this.adapter.listConversationRows(context);
    let pins = await this.controller.list(context.projectKey);
    const pinnedByKey = new Map(pins.map((pin) => [pin.conversationKey, pin]));
    for (const row of rows) {
      const pin = pinnedByKey.get(row.conversationKey);
      if (pin && pin.title !== row.title) {
        pins = await this.controller.refreshTitle(context.projectKey, row.conversationKey, row.title);
      }
    }

    const project = await this.controller.project(context.projectKey);
    if (!this.isCurrent(context)) return;
    this.renderer.render(context, mountPoint, rows, pins);
    this.organizer.render(context, mountPoint, rows, pins, project.annotations ?? {}, this.adapter.isDarkTheme?.() ?? false, {
      appearance: (key, value) => this.runMutation(context, () => this.controller.setAppearance(context.projectKey, key, value)),
    });
    this.organizer.status(rows.length ? 'PP_READY' : 'PP_ADAPTER_PROFILE_MISMATCH', this.onRouteChange);
    this.bindExtensionActionFallbacks();
  }

  private readonly onDomMutation: MutationCallback = (records) => {
    if (records.length === 0 || records.some(record => {
      const target = record.target.nodeType === 1 ? record.target as Element : record.target.parentElement;
      if (target?.closest('[data-projectpins-root], [data-projectpins-owned], [data-projectpins-native-control]')) return false;
      if (record.type === 'attributes') return record.target === this.document.documentElement || record.attributeName === 'href';
      const changed = [...record.addedNodes, ...record.removedNodes];
      // A native subtree containing our UI is still a native mutation.
      return changed.length === 0 || changed.some(node => node.nodeType !== 1 ||
        !(node as Element).matches('[data-projectpins-root], [data-projectpins-owned], [data-projectpins-native-control]'));
    })) this.scheduleReconcile();
  };

  private isCurrent(context: ProjectContext): boolean {
    if (this.stopped) return false;
    const current = this.adapter.resolveContext();
    return current?.projectKey === context.projectKey && current.root === context.root;
  }

  private async runMutation(context: ProjectContext, mutation: () => Promise<unknown>): Promise<void> {
    const run = this.reconcileTail.then(async () => {
      if (!this.isCurrent(context)) throw new Error('PP_CONTEXT_CHANGED');
      await mutation();
    });
    this.reconcileTail = run.catch(() => undefined);
    try { await run; await this.reconcile(); }
    catch (error) { this.showError(error); throw error; }
  }

  private showError(error: unknown): void {
    if (!this.stopped) this.organizer.status(actionErrorCode(error), this.onRouteChange);
  }

  private readonly onRouteChange = (): void => {
    this.scheduleReconcile();
  };

  private readonly onPageShow = (): void => {
    this.scheduleReconcile();
  };

  private readonly onVisibilityChange = (): void => {
    if (this.document.visibilityState === 'visible') this.scheduleReconcile();
  };

  private readonly onAbort = (): void => {
    this.stop();
  };

  private readonly onClick = (event: Event): void => {
    const target = event.target;
    if (!isElement(target)) return;
    const control = target.closest<HTMLButtonElement>('[data-projectpins-action]');
    if (!control || !control.dataset.projectpinsAction || !control.dataset.projectpinsConversationKey) return;
    if (control.disabled) return;

    const context = this.adapter.resolveContext();
    if (!context) return;

    const action = control.dataset.projectpinsAction;
    const conversationKey = control.dataset.projectpinsConversationKey;
    const row = this.nativeRowForControl(context, control, conversationKey);
    const isPinnedControl = control.closest('[data-projectpins-root]') !== null;
    if (action === 'pin' && !row) return;
    if (action === 'unpin' && !row && !isPinnedControl) return;

    event.preventDefault();
    event.stopPropagation();
    control.disabled = true;
    void this.applyAction(context, action, conversationKey, row, control);
  };

  /**
   * ChatGPT may intercept row events in its own event system. Keep document
   * delegation as the normal path, with a direct fallback only on our buttons
   * so native row behavior remains untouched.
   */
  private bindExtensionActionFallbacks(): void {
    for (const control of this.document.querySelectorAll<HTMLButtonElement>(
      'button[data-projectpins-action]',
    )) {
      control.onclick = this.onClick;
    }
  }

  private nativeRowForControl(
    context: ProjectContext,
    control: HTMLButtonElement,
    conversationKey: string,
  ): ConversationRow | null {
    return (
      this.adapter
        .listConversationRows(context)
        .find(
          (row) =>
            row.conversationKey === conversationKey &&
            row.actionMount.contains(control) &&
            control.hasAttribute('data-projectpins-native-control'),
        ) ?? null
    );
  }

  private async applyAction(
    context: ProjectContext,
    action: string,
    conversationKey: string,
    row: ConversationRow | null,
    control: HTMLButtonElement,
  ): Promise<void> {
    try {
      await this.runMutation(context, async () => {
        if (action === 'pin' && row) await this.controller.pin(context.projectKey, row);
        else if (action === 'unpin') await this.controller.unpin(context.projectKey, conversationKey);
      });
      delete control.dataset.projectpinsError;
    } catch (error) {
      // Keep failures inspectable without logging conversation metadata or
      // changing native ChatGPT UI. The next successful action clears it.
      control.dataset.projectpinsError = actionErrorCode(error);
    } finally {
      control.disabled = false;
    }
  }
}

function actionErrorCode(error: unknown): string {
  return error instanceof ProjectPinsStorageError ? error.code : 'PP_ACTION_FAILED';
}

function isElement(value: EventTarget | null): value is Element {
  return typeof value === 'object' && value !== null && 'closest' in value;
}

function mutationObserverFactoryFor(window: Window | null): MutationObserverFactory | null {
  const MutationObserverConstructor = globalThis.MutationObserver;
  return MutationObserverConstructor
    ? (callback) => new MutationObserverConstructor(callback)
    : null;
}

function frameSchedulerFor(window: Window | null): FrameScheduler {
  const requestFrame = window?.requestAnimationFrame ?? globalThis.requestAnimationFrame;
  return requestFrame
    ? (callback) => requestFrame.call(window ?? globalThis, callback)
    : (callback) => globalThis.setTimeout(() => callback(Date.now()), 0) as unknown as number;
}

function frameCancellerFor(window: Window | null): FrameCanceller {
  const cancelScheduledFrame = window?.cancelAnimationFrame ?? globalThis.cancelAnimationFrame;
  return cancelScheduledFrame
    ? (handle) => cancelScheduledFrame.call(window ?? globalThis, handle)
    : (handle) => globalThis.clearTimeout(handle);
}

export function bootstrapProjectPins(abortSignal?: AbortSignal): ProjectPinsRuntime {
  const runtime = new ProjectPinsRuntime(abortSignal ? { abortSignal } : {});
  runtime.start();
  return runtime;
}
