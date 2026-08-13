import { readFileSync } from 'node:fs';
import { parseHTML } from 'linkedom';
import { describe, expect, it } from 'vitest';
import {
  type AdapterDiagnosticCode,
  ProjectConversationAdapter,
} from '../../src/adapter/project-conversation-adapter';

const projectKey = 'g-p-00000000000000000000000000000000-test-project';
const projectLocation = `https://chatgpt.com/g/${projectKey}/project`;

function adapterForFixture(
  fixtureName: string,
  locationHref = projectLocation,
  onDiagnostic?: (code: AdapterDiagnosticCode) => void,
): ProjectConversationAdapter {
  const fixture = readFileSync(new URL(`../fixtures/${fixtureName}`, import.meta.url), 'utf8');
  const { document } = parseHTML(fixture);
  return new ProjectConversationAdapter(
    document,
    onDiagnostic ? { locationHref, onDiagnostic } : { locationHref },
  );
}

describe('ProjectConversationAdapter', () => {
  it('resolves the verified Project fixture and exposes valid conversation rows', () => {
    const adapter = adapterForFixture('project-conversation-list.html');

    const context = adapter.resolveContext();

    expect(context).toMatchObject({
      projectKey,
      projectHref: projectLocation,
    });
    expect(adapter.findPinnedMountPoint(context!)).toBe(context!.root);
    expect(adapter.listConversationRows(context!)).toMatchObject([
      {
        conversationKey: '00000000-0000-4000-8000-000000000001',
        href: `https://chatgpt.com/g/${projectKey}/c/00000000-0000-4000-8000-000000000001`,
        title: 'Chat A',
      },
      {
        conversationKey: '00000000-0000-4000-8000-000000000002',
        href: `https://chatgpt.com/g/${projectKey}/c/00000000-0000-4000-8000-000000000002`,
        title: 'Chat B',
      },
    ]);
    expect(adapter.listConversationRows(context!).map((row) => row.actionMount.tagName)).toEqual([
      'DIV',
      'DIV',
    ]);
  });

  it('uses verified href semantics, not English visible labels, in a localized fixture', () => {
    const adapter = adapterForFixture('project-conversation-list-ru.html');
    const context = adapter.resolveContext();

    expect(context?.projectKey).toBe(projectKey);
    expect(adapter.listConversationRows(context!).map(({ conversationKey, title }) => ({ conversationKey, title }))).toEqual([
      { conversationKey: '00000000-0000-4000-8000-000000000011', title: 'Чат А' },
      { conversationKey: '00000000-0000-4000-8000-000000000012', title: 'Чат Б' },
    ]);
  });

  it('skips an ambiguous native row without guessing an action mount', () => {
    const diagnostics: AdapterDiagnosticCode[] = [];
    const adapter = adapterForFixture(
      'project-conversation-list-ambiguous.html',
      projectLocation,
      (code) => diagnostics.push(code),
    );
    const context = adapter.resolveContext();

    expect(context?.projectKey).toBe(projectKey);
    expect(adapter.listConversationRows(context!)).toEqual([]);
    expect(diagnostics).toContain('PP_ADAPTER_ROW_AMBIGUOUS');
  });

  it('fails closed for an unknown layout and emits no navigation metadata', () => {
    const diagnostics: AdapterDiagnosticCode[] = [];
    const adapter = adapterForFixture(
      'unknown-project-layout.html',
      projectLocation,
      (code) => diagnostics.push(code),
    );

    expect(adapter.resolveContext()).toBeNull();
    expect(diagnostics).toContain('PP_ADAPTER_NO_LIST_MOUNT');
  });

  it('fails closed when the current route is not a verified Project route', () => {
    const adapter = adapterForFixture(
      'project-conversation-list.html',
      'https://chatgpt.com/c/00000000-0000-4000-8000-000000000001',
    );

    expect(adapter.resolveContext()).toBeNull();
  });

  it('returns an untrusted title as plain text metadata without interpreting it', () => {
    const adapter = adapterForFixture('project-conversation-list.html');
    const context = adapter.resolveContext();
    const anchor = context!.root.querySelector('a');
    anchor!.textContent = '<img src=x onerror=alert(1)>';

    expect(adapter.listConversationRows(context!)[0]?.title).toBe('<img src=x onerror=alert(1)>');
    expect(context!.root.querySelector('img')).toBeNull();
  });

  it('reads only the dedicated navigation title, never a conversation preview', () => {
    const adapter = adapterForFixture('project-conversation-list-with-preview.html');
    const context = adapter.resolveContext();

    expect(adapter.listConversationRows(context!)).toMatchObject([
      {
        conversationKey: '00000000-0000-4000-8000-000000000021',
        title: 'Chat with preview',
      },
    ]);
  });
});
