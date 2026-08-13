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
  constructor(private readonly document: Document = globalThis.document) {}

  render(
    context: ProjectContext,
    mountPoint: HTMLElement,
    rows: ConversationRow[],
    pins: PinnedConversation[],
  ): void {
    const pinnedKeys = new Set(pins.map((pin) => pin.conversationKey));
    this.decorateRows(rows, pinnedKeys);

    if (pins.length === 0) {
      this.removePinnedSections(mountPoint);
      return;
    }

    const root = this.singlePinnedSection(mountPoint);
    root.dataset.projectpinsProjectKey = context.projectKey;
    root.replaceChildren(this.createPinnedContent(pins));
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
      control.replaceChildren(this.createPinIcon());
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

  private removePinnedSections(mountPoint: HTMLElement): void {
    for (const root of this.extensionChildren(mountPoint, 'data-projectpins-root')) {
      root.remove();
    }
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
      const kicker = this.document.createElement('span');
      kicker.className = 'projectpins-card-kicker';
      kicker.textContent = copy.openChat;
      const title = this.document.createElement('span');
      title.className = 'projectpins-card-title';
      title.textContent = pin.title;
      link.append(kicker, title);

      const control = this.createControl(false);
      control.classList.add('projectpins-card-unpin');
      control.dataset.projectpinsAction = 'unpin';
      control.dataset.projectpinsConversationKey = pin.conversationKey;
      control.setAttribute('aria-label', copy.unpinChat);
      control.setAttribute('aria-pressed', 'true');
      control.replaceChildren(this.createPinIcon());

      item.append(link, control);
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
    actionMount.prepend(control);
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
