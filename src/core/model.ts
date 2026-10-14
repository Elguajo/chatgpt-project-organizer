export type ProjectKey = string;
export type ConversationKey = string;

export interface PinnedConversation {
  conversationKey: ConversationKey;
  href: string;
  title: string;
  order: number;
  pinnedAt: number;
  updatedAt: number;
}

export interface ProjectPinBucket {
  pins: PinnedConversation[];
  updatedAt: number;
  annotations?: Record<ConversationKey, ChatAppearance>;
}

export const COLORS = ['blue', 'green', 'amber', 'red', 'purple', 'pink'] as const;
export type ChatColor = typeof COLORS[number];
export interface ChatTag { name: string; color: ChatColor }
export interface ChatAppearance { tags: ChatTag[]; titleColor: ChatColor | null }
export const emptyAppearance = (): ChatAppearance => ({ tags: [], titleColor: null });

export interface ProjectPinsState {
  schemaVersion: 2;
  projects: Record<ProjectKey, ProjectPinBucket>;
}

export const CURRENT_SCHEMA_VERSION = 2 as const;
export const STORAGE_KEY = 'projectpins.state.v1' as const;

export function createEmptyState(): ProjectPinsState {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    projects: {},
  };
}
