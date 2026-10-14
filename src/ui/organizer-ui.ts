import type { ConversationRow, ProjectContext } from '../adapter/contracts';
import { COLORS, emptyAppearance, type ChatAppearance, type ChatColor, type PinnedConversation } from '../core/model';
import { version } from '../../package.json';

export interface OrganizerActions {
  appearance(key: string, value: ChatAppearance): Promise<void>;
}

/** Contextual controls only: host navigation is exposed by the adapter. */
export class OrganizerUi {
  private statusRoot: HTMLDetailsElement | null = null;
  private context: ProjectContext | null = null;
  private titles = new Set<HTMLElement>();
  private annotations: Record<string, ChatAppearance> = {};
  private dialog: HTMLDialogElement | null = null;
  private editorKey: string | null = null;
  private returnFocus: HTMLElement | null = null;
  private dark = false;
  theme(dark: boolean): void { this.dark = dark; }

  constructor(private readonly document: Document) {}
  private get ru(): boolean { return this.document.documentElement.lang.toLowerCase().startsWith('ru'); }
  private text(en: string, ru: string): string { return this.ru ? ru : en; }

  status(code: string, retry: () => void): void {
    if (!this.document.body) return;
    if (!this.statusRoot?.isConnected) {
      this.statusRoot = this.document.createElement('details');
      this.statusRoot.dataset.projectpinsOwned = 'status';
      this.statusRoot.className = 'projectpins-status';
      const summary = this.document.createElement('summary');
      const message = this.document.createElement('p');
      message.setAttribute('role', 'status');
      this.statusRoot.append(summary, message, this.button(this.text('Check again', 'Проверить снова'), retry));
      this.document.body.append(this.statusRoot);
    }
    const labels: Record<string, string> = {
      PP_READY: this.text('Pins, tags and colors are saved on this device.', 'Закрепления, теги и цвета сохраняются на этом устройстве.'),
      PP_ADAPTER_NO_PROJECT: this.text('Open a Project conversation list.', 'Откройте список чатов проекта.'),
      PP_ADAPTER_NO_LIST_MOUNT: this.text('Open the Project overview. If it is already open, its layout may have changed.', 'Откройте обзор проекта. Если он уже открыт, возможно, изменилась разметка.'),
      PP_ADAPTER_PROFILE_MISMATCH: this.text('This list layout is not recognized.', 'Разметка этого списка не распознана.'),
      PP_STORAGE_READ_FAILED: this.text('Cannot read saved data. Reload the extension and this page.', 'Не удалось прочитать данные. Перезагрузите расширение и страницу.'),
      PP_STORAGE_WRITE_FAILED: this.text('Changes were not saved. Retry.', 'Изменения не сохранены. Повторите.'),
      PP_STORAGE_UNSUPPORTED_SCHEMA: this.text('Saved data requires a newer version. It was not overwritten.', 'Данные требуют более новой версии. Они не перезаписаны.'),
      PP_STORAGE_CORRUPT_STATE: this.text('Saved data could not be validated. It was not overwritten.', 'Не удалось проверить данные. Они не перезаписаны.'),
    };
    this.setText(this.statusRoot.querySelector('summary')!, `ProjectPins ${version}${code === 'PP_READY' ? '' : ' · !'}`);
    this.setText(this.statusRoot.querySelector('p')!, labels[code] ?? this.text('Action failed. Retry or reload the page.', 'Действие не выполнено. Повторите или обновите страницу.'));
    this.statusRoot.dataset.projectpinsStatus = code;
    this.statusRoot.dataset.projectpinsTheme = this.dark ? 'dark' : 'light';
  }

  render(context: ProjectContext, mount: HTMLElement, rows: ConversationRow[], pins: PinnedConversation[],
    annotations: Record<string, ChatAppearance>, dark: boolean, actions: OrganizerActions): void {
    if (this.context && (this.context.projectKey !== context.projectKey || this.context.root !== context.root)) this.clearProject();
    this.context = context;
    this.dark = dark;
    this.annotations = annotations;
    const activeControls = new Set<HTMLElement>();
    const activeTags = new Set<HTMLElement>();
    for (const row of rows) {
      const control = this.appearanceControl(row.actionMount, row.conversationKey, row.title, actions);
      activeControls.add(control);
      if (row.metadataMount) {
        const chips = this.tagContainer(row.metadataMount);
        this.updateChips(chips, annotations[row.conversationKey] ?? emptyAppearance(), dark);
        activeTags.add(chips);
      }
    }
    for (const old of this.document.querySelectorAll<HTMLElement>('[data-projectpins-owned="appearance"]')) {
      if (!old.closest('[data-projectpins-root]') && !activeControls.has(old)) old.remove();
    }
    for (const old of this.document.querySelectorAll<HTMLElement>('[data-projectpins-owned="tags"]')) {
      if (!old.closest('[data-projectpins-root]') && !activeTags.has(old)) old.remove();
    }
    const activeTitles = new Set(rows.flatMap(row => row.titleElement ? [row.titleElement] : []));
    for (const title of this.titles) if (!activeTitles.has(title)) this.color(title, null, dark);
    this.titles = activeTitles;
    for (const row of rows) if (row.titleElement) this.color(row.titleElement, annotations[row.conversationKey]?.titleColor ?? null, dark);
    for (const card of mount.querySelectorAll<HTMLElement>('[data-projectpins-root] .projectpins-pinned-card')) {
      const key = card.querySelector<HTMLElement>('[data-projectpins-conversation-key]')?.dataset.projectpinsConversationKey;
      const pin = pins.find(pin => pin.conversationKey === key);
      if (!key || !pin) continue;
      const value = annotations[key] ?? emptyAppearance();
      this.color(card.querySelector<HTMLElement>('.projectpins-card-title')!, value.titleColor, dark);
      this.updateChips(this.tagContainer(card.querySelector('a')!), value, dark);
      this.appearanceControl(card.querySelector<HTMLElement>('.projectpins-pinned-actions')!, key, pin.title, actions);
    }
    if (this.editorKey && !rows.some(row => row.conversationKey === this.editorKey) && !pins.some(pin => pin.conversationKey === this.editorKey)) this.closeEditor();
    if (this.dialog) this.dialog.dataset.projectpinsTheme = dark ? 'dark' : 'light';
  }

  private appearanceControl(mount: HTMLElement, key: string, title: string, actions: OrganizerActions): HTMLButtonElement {
    let control = mount.querySelector<HTMLButtonElement>('[data-projectpins-owned="appearance"]');
    if (!control) {
      control = this.button('', () => {});
      control.dataset.projectpinsOwned = 'appearance';
      control.className = 'projectpins-control projectpins-appearance-control';
      const icon = this.document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      icon.setAttribute('viewBox', '0 0 24 24'); icon.setAttribute('aria-hidden', 'true');
      const path = this.document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', 'M20 13l-7 7a2 2 0 0 1-3 0l-7-7V3h10l7 7a2 2 0 0 1 0 3ZM7 7h.01');
      path.setAttribute('fill', 'none'); path.setAttribute('stroke', 'currentColor'); path.setAttribute('stroke-width', '1.7'); path.setAttribute('stroke-linecap', 'round'); path.setAttribute('stroke-linejoin', 'round');
      icon.append(path); control.append(icon); mount.append(control);
    }
    control.setAttribute('aria-label', this.text('Tags and title color', 'Теги и цвет названия'));
    control.title = control.getAttribute('aria-label')!;
    control.dataset.projectpinsChat = key;
    control.onclick = event => { event.preventDefault(); event.stopPropagation(); this.openEditor(key, title, control!, actions); };
    return control;
  }

  private tagContainer(mount: HTMLElement): HTMLElement {
    let chips = [...mount.children].find(child => child.getAttribute('data-projectpins-owned') === 'tags') as HTMLElement | undefined;
    if (!chips) { chips = this.document.createElement('span'); chips.className = 'projectpins-tags'; chips.dataset.projectpinsOwned = 'tags'; mount.append(chips); }
    return chips;
  }

  private updateChips(chips: HTMLElement, value: ChatAppearance, dark: boolean): void {
    const signature = JSON.stringify(value.tags);
    if (chips.dataset.signature !== signature) { this.chips(chips, value, dark); chips.dataset.signature = signature; }
    chips.hidden = value.tags.length === 0;
    for (const chip of chips.querySelectorAll<HTMLElement>('[data-projectpins-color]')) chip.dataset.projectpinsTheme = dark ? 'dark' : 'light';
  }

  private openEditor(key: string, title: string, control: HTMLElement, actions: OrganizerActions): void {
    this.closeEditor();
    this.returnFocus = control;
    this.editorKey = key;
    const dialog = this.document.createElement('dialog');
    dialog.dataset.projectpinsOwned = 'editor'; dialog.className = 'projectpins-editor';
    dialog.dataset.projectpinsTheme = this.dark ? 'dark' : 'light';
    dialog.setAttribute('aria-labelledby', 'projectpins-editor-heading');
    const heading = this.document.createElement('h2'); heading.id = 'projectpins-editor-heading'; heading.textContent = this.text('Tags and title color', 'Теги и цвет названия');
    const name = this.document.createElement('p'); name.className = 'projectpins-editor-title'; name.textContent = title;
    dialog.append(heading, name); this.document.body.append(dialog); this.dialog = dialog;
    this.buildEditor(dialog, key, actions);
    dialog.addEventListener('cancel', event => { event.preventDefault(); this.closeEditor(); });
    dialog.showModal();
  }

  private closeEditor(): void {
    this.dialog?.remove(); this.dialog = null; this.editorKey = null;
    if (this.returnFocus?.isConnected) this.returnFocus.focus();
    this.returnFocus = null;
  }

  clearProject(): void {
    this.closeEditor(); this.context = null;
    for (const node of this.document.querySelectorAll('[data-projectpins-owned="appearance"], [data-projectpins-owned="tags"]')) node.remove();
    for (const title of this.titles) this.color(title, null, false);
    this.titles.clear();
  }
  teardown(): void { this.clearProject(); this.statusRoot?.remove(); this.statusRoot = null; }

  private buildEditor(details: HTMLDialogElement, key: string, actions: OrganizerActions): void {
    const value = structuredClone(this.annotations[key] ?? emptyAppearance());
    const form = this.document.createElement('form');
    const title = this.palette(value.titleColor, true);
    this.label(form, this.text('Title color', 'Цвет названия'), title);
    const tagList = this.document.createElement('div');
    tagList.className = 'projectpins-tag-fields';
    form.append(tagList);
    const addTag = (name = '', color: ChatColor = 'blue') => {
      if (tagList.children.length >= 12) return;
      const row = this.document.createElement('div');
      row.className = 'projectpins-tag-field';
      const nameInput = this.document.createElement('input');
      nameInput.type = 'text'; nameInput.value = name; nameInput.maxLength = 40; nameInput.required = true;
      nameInput.setAttribute('aria-label', this.text('Tag name', 'Название тега'));
      nameInput.placeholder = this.text('Tag name', 'Название тега');
      const colorInput = this.palette(color, false);
      colorInput.setAttribute('aria-label', this.text('Tag color', 'Цвет тега'));
      const remove = this.button(this.text('Remove', 'Убрать'), () => { row.remove(); add.disabled = false; add.focus(); });
      row.append(nameInput, colorInput, remove); tagList.append(row);
      if (!name) nameInput.focus();
      add.disabled = tagList.children.length >= 12;
    };
    const add = this.button(this.text('Add tag', 'Добавить тег'), () => addTag());
    const save = this.button(this.text('Save', 'Сохранить'), () => {}); save.type = 'submit';
    const reset = this.button(this.text('Reset title color', 'Сбросить цвет названия'), () => { title.value = ''; });
    const cancel = this.button(this.text('Cancel', 'Отмена'), () => { this.closeEditor(); });
    const error = this.document.createElement('p'); error.setAttribute('role', 'alert');
    form.append(add, reset, save, cancel, error);
    details.append(form);
    for (const tag of value.tags) addTag(tag.name, tag.color);
    form.addEventListener('submit', async event => {
      event.preventDefault(); event.stopPropagation();
      if (save.disabled) return;
      const tags = [...tagList.children].map(row => ({ name: row.querySelector('input')!.value.trim(), color: row.querySelector('select')!.value as ChatColor }));
      if (tags.some(tag => !tag.name) || new Set(tags.map(tag => tag.name.toLocaleLowerCase())).size !== tags.length) {
        error.textContent = this.text('Use non-empty, unique tag names.', 'Названия тегов должны быть непустыми и уникальными.'); return;
      }
      save.disabled = true;
      try {
        await actions.appearance(key, { tags, titleColor: (title.value || null) as ChatColor | null });
        this.closeEditor();
      } catch { error.textContent = this.text('Not saved. Retry; your draft is still here.', 'Не сохранено. Повторите — введённые данные остались.'); }
      finally { save.disabled = false; }
    });
  }

  private palette(value: ChatColor | null, allowDefault: boolean): HTMLSelectElement {
    const select = this.document.createElement('select');
    const names = this.ru ? ['Синий', 'Зелёный', 'Янтарный', 'Красный', 'Фиолетовый', 'Розовый'] : ['Blue', 'Green', 'Amber', 'Red', 'Purple', 'Pink'];
    const entries = COLORS.map((color, index) => [color, names[index]!] as const);
    for (const [key, name] of [...(allowDefault ? [['', this.text('Default', 'Обычный')]] : []), ...entries]) {
      const option = this.document.createElement('option'); option.value = key!; option.textContent = name!; option.selected = key === (value ?? ''); select.append(option);
    }
    return select;
  }
  private label(parent: HTMLElement, text: string, control: HTMLElement): void {
    control.setAttribute('aria-label', text);
    const label = this.document.createElement('label'); label.textContent = text; label.append(control); parent.append(label);
  }
  private button(text: string, action: () => unknown): HTMLButtonElement {
    const button = this.document.createElement('button'); button.type = 'button'; button.textContent = text;
    button.addEventListener('click', event => { event.stopPropagation(); void action(); }); return button;
  }
  private chips(root: Element, value: ChatAppearance, dark: boolean): void {
    root.replaceChildren(...value.tags.map(tag => { const chip = this.document.createElement('span'); chip.className = 'projectpins-tag'; chip.textContent = tag.name; this.color(chip, tag.color, dark); return chip; }));
  }
  private color(target: HTMLElement, value: ChatColor | null, dark: boolean): void {
    if (value) { target.dataset.projectpinsColor = value; target.dataset.projectpinsTheme = dark ? 'dark' : 'light'; }
    else { delete target.dataset.projectpinsColor; delete target.dataset.projectpinsTheme; }
  }
  private setText(target: Element, text: string): void { if (target.textContent !== text) target.textContent = text; }
}
