import type { ConversationRow, ProjectContext } from '../adapter/contracts';
import type { PinnedConversation } from '../core/model';

export type ProjectPinsMicrocopy = {
  pinned: string;
  pinChat: string;
  unpinChat: string;
  openChat: string;
};

const ENGLISH_MICROCOPY: ProjectPinsMicrocopy = {
  pinned: 'Pinned',
  pinChat: 'Pin chat',
  unpinChat: 'Unpin chat',
  openChat: 'Open chat',
};

const RUSSIAN_MICROCOPY: ProjectPinsMicrocopy = {
  pinned: 'Закреплённые',
  pinChat: 'Закрепить чат',
  unpinChat: 'Открепить чат',
  openChat: 'Открыть чат',
};

export function microcopyForDocument(document: Document): ProjectPinsMicrocopy {
  return document.documentElement.lang.toLowerCase().startsWith('ru')
    ? RUSSIAN_MICROCOPY
    : ENGLISH_MICROCOPY;
}

/**
 * Renders only extension-owned nodes. Native row discovery stays in the adapter,
 * while interaction and persistence stay in the runtime/controller.
 */
export class PinnedUiRenderer {
  private readonly signatures = new WeakMap<HTMLElement, string>();
  constructor(private readonly document: Document = globalThis.document) {}

  render(
    context: ProjectContext,
    mountPoint: HTMLElement,
    rows: ConversationRow[],
    pins: PinnedConversation[],
  ): void {
    const pinnedKeys = new Set(pins.map((pin) => pin.conversationKey));
    this.decorateRows(rows, pinnedKeys);
    this.renderChatsHeading(context);

    const activeRows = new Set(rows.map(row => row.element));
    for (const element of this.document.querySelectorAll<HTMLElement>('[data-projectpins-decorated]')) {
      if (!activeRows.has(element)) {
        element.querySelector('[data-projectpins-native-control]')?.remove();
        delete element.dataset.projectpinsDecorated;
        delete element.dataset.projectpinsHidden;
      }
    }

    const root = this.singlePinnedSection(mountPoint);
    root.dataset.projectpinsProjectKey = context.projectKey;
    const signature = JSON.stringify([context.projectKey, this.document.documentElement.lang, pins]);
    if (this.signatures.get(root) !== signature) {
      root.replaceChildren(this.createPinnedContent(pins));
      this.signatures.set(root, signature);
    }
    // Hide only after synthetic navigation exists. Rendering failure leaves
    // the native row available, and unpin restores the same native node.
    this.suppressDuplicates(rows, pinnedKeys);
  }

  /** Removes extension-owned controls and containers, leaving native DOM intact. */
  teardown(): void {
    for (const root of this.document.querySelectorAll<HTMLElement>('[data-projectpins-root]')) {
      root.remove();
    }
    for (const control of this.document.querySelectorAll<HTMLElement>(
      '[data-projectpins-native-control]',
    )) {
      control.remove();
    }
    for (const row of this.document.querySelectorAll<HTMLElement>('[data-projectpins-decorated]')) {
      delete row.dataset.projectpinsDecorated;
    }
    for (const row of this.document.querySelectorAll<HTMLElement>('[data-projectpins-hidden]')) delete row.dataset.projectpinsHidden;
    for (const heading of this.document.querySelectorAll('[data-projectpins-chats-heading]')) heading.remove();
  }

  private suppressDuplicates(rows: ConversationRow[], pinnedKeys: ReadonlySet<string>): void {
    for (const row of rows) {
      if (pinnedKeys.has(row.conversationKey)) row.element.dataset.projectpinsHidden = 'true';
      else delete row.element.dataset.projectpinsHidden;
    }
  }

  private renderChatsHeading(context: ProjectContext): void {
    const list = context.conversationList;
    if (!list?.parentElement) return;
    const parent = list.parentElement;
    let heading = [...parent.children].find(child => child.hasAttribute('data-projectpins-chats-heading')) as HTMLElement | undefined;
    if (!heading) {
      heading = this.document.createElement('h2');
      heading.dataset.projectpinsChatsHeading = 'true';
      heading.dataset.projectpinsOwned = 'heading';
      heading.className = 'projectpins-heading';
    }
    const text = this.document.documentElement.lang.toLowerCase().startsWith('ru') ? 'Чаты' : 'Chats';
    if (heading.textContent !== text) heading.textContent = text;
    if (list.previousElementSibling !== heading) list.before(heading);
  }

  private decorateRows(rows: ConversationRow[], pinnedKeys: ReadonlySet<string>): void {
    const copy = microcopyForDocument(this.document);
    for (const row of rows) {
      row.element.dataset.projectpinsDecorated = 'true';
      const isPinned = pinnedKeys.has(row.conversationKey);
      const control = this.singleNativeControl(row.actionMount);
      control.dataset.projectpinsAction = isPinned ? 'unpin' : 'pin';
      control.dataset.projectpinsConversationKey = row.conversationKey;
      control.setAttribute('aria-label', isPinned ? copy.unpinChat : copy.pinChat);
      control.setAttribute('aria-pressed', String(isPinned));
      if (!control.firstChild) control.append(this.createPinIcon());
    }
  }

  private singlePinnedSection(mountPoint: HTMLElement): HTMLElement {
    const sections = this.extensionChildren(mountPoint, 'data-projectpins-root');
    const root = sections.shift() ?? this.createPinnedSection();
    for (const duplicate of sections) duplicate.remove();
    if (root.parentElement !== mountPoint || mountPoint.firstElementChild !== root) {
      mountPoint.prepend(root);
    }
    return root;
  }

  private extensionChildren(mountPoint: HTMLElement, attribute: string): HTMLElement[] {
    return [...mountPoint.children].filter(
      (child): child is HTMLElement => child.hasAttribute(attribute),
    );
  }

  private createPinnedSection(): HTMLElement {
    const root = this.document.createElement('section');
    root.className = 'projectpins-pinned-section';
    root.dataset.projectpinsRoot = 'true';
    root.setAttribute('aria-labelledby', 'projectpins-pinned-heading');
    return root;
  }

  private createPinnedContent(pins: PinnedConversation[]): DocumentFragment {
    const copy = microcopyForDocument(this.document);
    const content = this.document.createDocumentFragment();
    const heading = this.document.createElement('h2');
    heading.id = 'projectpins-pinned-heading';
    heading.className = 'projectpins-heading';
    heading.textContent = copy.pinned;

    const list = this.document.createElement('ul');
    list.className = 'projectpins-pinned-list';
    for (const pin of pins) {
      const item = this.document.createElement('li');
      item.className = 'projectpins-pinned-card';
      const link = this.document.createElement('a');
      link.className = 'projectpins-pinned-link';
      link.href = pin.href;
      const title = this.document.createElement('span');
      title.className = 'projectpins-card-title';
      title.textContent = pin.title;
      link.append(title);

      const control = this.createControl(false);
      control.classList.add('projectpins-card-unpin');
      control.dataset.projectpinsAction = 'unpin';
      control.dataset.projectpinsConversationKey = pin.conversationKey;
      control.setAttribute('aria-label', copy.unpinChat);
      control.setAttribute('aria-pressed', 'true');
      control.replaceChildren(this.createPinIcon());

      const actions = this.document.createElement('div');
      actions.className = 'projectpins-pinned-actions';
      actions.append(control);
      item.append(link, actions);
      list.append(item);
    }

    content.append(heading, list);
    return content;
  }

  private singleNativeControl(actionMount: HTMLElement): HTMLButtonElement {
    const controls = [...actionMount.querySelectorAll<HTMLButtonElement>(
      '[data-projectpins-native-control]',
    )];
    const control = controls.shift() ?? this.createControl(true);
    for (const duplicate of controls) duplicate.remove();
    // Keep ProjectPins before ChatGPT's overflow menu so both controls retain
    // independent hit targets in the row's existing right-side action area.
    if (actionMount.firstElementChild !== control) actionMount.prepend(control);
    return control;
  }

  private createControl(isNativeControl: boolean): HTMLButtonElement {
    const control = this.document.createElement('button');
    control.type = 'button';
    control.className = 'projectpins-control';
    if (isNativeControl) control.dataset.projectpinsNativeControl = 'true';
    return control;
  }

  private createPinIcon(): SVGSVGElement {
    const icon = this.document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttribute('aria-hidden', 'true');
    icon.setAttribute('viewBox', '0 0 16 16');
    icon.setAttribute('focusable', 'false');
    icon.classList.add('projectpins-pin-icon');
    const path = this.document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('fill', 'currentColor');
    path.setAttribute('d', 'M10 1.5 14.5 6l-1 1-1.2-.3-2.7 2.7.3 1-1 1-2.3-2.3-3.1 3.1-.7-.7 3.1-3.1L3.5 6.1l1-1 1 .3L8.2 2.7 8 1.5h2Z');
    icon.append(path);
    return icon;
  }
}
