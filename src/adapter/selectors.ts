/**
 * Semantic selector profile for the verified Phase 00 Project list structure.
 * Route parsing remains in identity.ts; no selectors may leak outside adapter.
 */
export const CHATGPT_SELECTOR_PROFILE = {
  projectConversationLists: ['section > ol[aria-busy]'],
  conversationLinks: ['a[href]'],
} as const;
