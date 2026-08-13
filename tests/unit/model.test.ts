import { describe, expect, it } from 'vitest';
import {
  CURRENT_SCHEMA_VERSION,
  STORAGE_KEY,
  createEmptyState,
} from '../../src/core/model';
import {
  normalizeNavigationHref,
  parseConversationNavigationHref,
  parseProjectNavigationHref,
} from '../../src/adapter/identity';

describe('project state scaffold', () => {
  it('creates schema v1 empty state', () => {
    expect(createEmptyState()).toEqual({
      schemaVersion: CURRENT_SCHEMA_VERSION,
      projects: {},
    });
    expect(STORAGE_KEY).toBe('projectpins.state.v1');
  });

  it('normalizes chatgpt navigation URLs without query/hash', () => {
    expect(
      normalizeNavigationHref('https://chatgpt.com/example?x=1#section'),
    ).toBe('https://chatgpt.com/example');
  });

  it('rejects unrelated origins', () => {
    expect(normalizeNavigationHref('https://example.com/c/123')).toBeNull();
  });

  it('parses the observed Project route shape', () => {
    expect(
      parseProjectNavigationHref(
        '/g/g-p-00000000000000000000000000000000-test-project/project?source=test#top',
      ),
    ).toEqual({
      projectKey: 'g-p-00000000000000000000000000000000-test-project',
      href: 'https://chatgpt.com/g/g-p-00000000000000000000000000000000-test-project/project',
    });
  });

  it('parses the observed Project conversation route shape', () => {
    expect(
      parseConversationNavigationHref(
        '/g/g-p-00000000000000000000000000000000-test-project/c/00000000-0000-4000-8000-000000000001',
      ),
    ).toEqual({
      projectKey: 'g-p-00000000000000000000000000000000-test-project',
      conversationKey: '00000000-0000-4000-8000-000000000001',
      href: 'https://chatgpt.com/g/g-p-00000000000000000000000000000000-test-project/c/00000000-0000-4000-8000-000000000001',
    });
  });

  it.each([
    '/g/not-a-project/project',
    '/g/g-p-project/c/not-a-conversation-id',
    '/g/g-p-project/c/00000000-0000-4000-8000-000000000001/extra',
    'https://example.com/g/g-p-project/project',
    'https://user:password@chatgpt.com/g/g-p-project/project',
  ])('rejects unverified or ambiguous Project routes: %s', (href) => {
    expect(parseProjectNavigationHref(href)).toBeNull();
    expect(parseConversationNavigationHref(href)).toBeNull();
  });
});
