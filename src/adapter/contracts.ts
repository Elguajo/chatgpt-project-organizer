import type { ConversationKey, ProjectKey } from '../core/model';

export interface ProjectContext {
  projectKey: ProjectKey;
  projectHref?: string;
  projectTitle?: string;
  root: HTMLElement;
  conversationList?: HTMLElement;
}

export interface ConversationRow {
  conversationKey: ConversationKey;
  href: string;
  title: string;
  element: HTMLElement;
  actionMount: HTMLElement;
  titleElement?: HTMLElement;
  metadataMount?: HTMLElement;
}

export interface ChatGptDomAdapter {
  resolveContext(): ProjectContext | null;
  findPinnedMountPoint(context: ProjectContext): HTMLElement | null;
  listConversationRows(context: ProjectContext): ConversationRow[];
  status?(): string;
  isDarkTheme?(): boolean;
}
