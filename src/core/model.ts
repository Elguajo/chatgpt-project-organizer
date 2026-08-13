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
}

export interface ProjectPinsStateV1 {
  schemaVersion: 1;
  projects: Record<ProjectKey, ProjectPinBucket>;
}

export const CURRENT_SCHEMA_VERSION = 1 as const;
export const STORAGE_KEY = 'projectpins.state.v1' as const;

export function createEmptyState(): ProjectPinsStateV1 {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    projects: {},
  };
}
