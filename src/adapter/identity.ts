/**
 * Route shapes were verified against a sanitized live Project observation in
 * Phase 00. Keep parsing deliberately narrow: unrecognized routes must not
 * produce a Project or conversation identity.
 */

export interface ProjectNavigationIdentity {
  projectKey: string;
  href: string;
}

export interface ConversationNavigationIdentity extends ProjectNavigationIdentity {
  conversationKey: string;
}

const PROJECT_ROUTE = /^\/g\/(g-p-[a-z0-9][a-z0-9-]*)\/project$/;
const CONVERSATION_ROUTE =
  /^\/g\/(g-p-[a-z0-9][a-z0-9-]*)\/c\/([a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12})$/;

function normalizeNavigationUrl(rawHref: string, base: string): URL | null {
  try {
    const url = new URL(rawHref, base);
    if (url.origin !== 'https://chatgpt.com' || url.username || url.password) {
      return null;
    }
    url.search = '';
    url.hash = '';
    return url;
  } catch {
    return null;
  }
}

export function normalizeNavigationHref(rawHref: string, base = 'https://chatgpt.com/'): string | null {
  return normalizeNavigationUrl(rawHref, base)?.href ?? null;
}

export function parseProjectNavigationHref(
  rawHref: string,
  base = 'https://chatgpt.com/',
): ProjectNavigationIdentity | null {
  const url = normalizeNavigationUrl(rawHref, base);
  const match = url ? PROJECT_ROUTE.exec(url.pathname) : null;

  if (!url || !match?.[1]) return null;

  return {
    projectKey: match[1],
    href: url.href,
  };
}

export function parseConversationNavigationHref(
  rawHref: string,
  base = 'https://chatgpt.com/',
): ConversationNavigationIdentity | null {
  const url = normalizeNavigationUrl(rawHref, base);
  const match = url ? CONVERSATION_ROUTE.exec(url.pathname) : null;

  if (!url || !match?.[1] || !match[2]) return null;

  return {
    projectKey: match[1],
    conversationKey: match[2],
    href: url.href,
  };
}
