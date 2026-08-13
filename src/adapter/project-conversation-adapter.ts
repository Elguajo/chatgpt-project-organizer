import type { ChatGptDomAdapter, ConversationRow, ProjectContext } from './contracts';
import {
  parseConversationNavigationHref,
  parseProjectNavigationHref,
} from './identity';
import { CHATGPT_SELECTOR_PROFILE } from './selectors';

export type AdapterDiagnosticCode =
  | 'PP_ADAPTER_NO_PROJECT'
  | 'PP_ADAPTER_NO_LIST_MOUNT'
  | 'PP_ADAPTER_ROW_NO_HREF'
  | 'PP_ADAPTER_ROW_AMBIGUOUS'
  | 'PP_ADAPTER_PROFILE_MISMATCH';

export interface ProjectConversationAdapterOptions {
  /** Override only for sanitized fixture tests. */
  locationHref?: string;
  /** Receives codes only: never titles, hrefs, or other user data. */
  onDiagnostic?: (code: AdapterDiagnosticCode) => void;
}

type ProjectList = {
  root: HTMLElement;
  list: HTMLOListElement;
};

/**
 * Fail-closed adapter for the Project conversation structure observed in Phase 00.
 * It is read-only: later phases own all extension DOM mutations.
 */
export class ProjectConversationAdapter implements ChatGptDomAdapter {
  constructor(
    private readonly document: Document = globalThis.document,
    private readonly options: ProjectConversationAdapterOptions = {},
  ) {}

  resolveContext(): ProjectContext | null {
    const navigation = this.resolveCurrentProject();
    if (!navigation) {
      this.diagnose('PP_ADAPTER_NO_PROJECT');
      return null;
    }

    const projectLists = this.findProjectLists(navigation.projectKey);
    if (projectLists.length === 0) {
      this.diagnose('PP_ADAPTER_NO_LIST_MOUNT');
      return null;
    }
    if (projectLists.length > 1) {
      this.diagnose('PP_ADAPTER_PROFILE_MISMATCH');
      return null;
    }
    const projectList = projectLists[0];
    if (!projectList) return null;

    return {
      projectKey: navigation.projectKey,
      projectHref: new URL(`/g/${navigation.projectKey}/project`, this.locationHref()).href,
      root: projectList.root,
    };
  }

  findPinnedMountPoint(context: ProjectContext): HTMLElement | null {
    const projectLists = this.findProjectLists(context.projectKey);
    const projectList = projectLists[0];
    if (projectLists.length !== 1 || !projectList || projectList.root !== context.root) {
      this.diagnose(
        projectLists.length === 0 ? 'PP_ADAPTER_NO_LIST_MOUNT' : 'PP_ADAPTER_PROFILE_MISMATCH',
      );
      return null;
    }

    return projectList.root;
  }

  listConversationRows(context: ProjectContext): ConversationRow[] {
    const projectLists = this.findProjectLists(context.projectKey);
    const projectList = projectLists[0];
    if (projectLists.length !== 1 || !projectList || projectList.root !== context.root) {
      this.diagnose('PP_ADAPTER_PROFILE_MISMATCH');
      return [];
    }

    const rows = this.extractRows(projectList, context.projectKey);
    const identityCounts = new Map<string, number>();
    for (const row of rows) {
      identityCounts.set(row.conversationKey, (identityCounts.get(row.conversationKey) ?? 0) + 1);
    }

    return rows.filter((row) => {
      if (identityCounts.get(row.conversationKey) === 1) return true;
      this.diagnose('PP_ADAPTER_ROW_AMBIGUOUS');
      return false;
    });
  }

  private resolveCurrentProject(): { projectKey: string } | null {
    const href = this.locationHref();
    const project = parseProjectNavigationHref(href);
    if (project) return project;

    const conversation = parseConversationNavigationHref(href);
    return conversation ? { projectKey: conversation.projectKey } : null;
  }

  private findProjectLists(projectKey: string): ProjectList[] {
    const candidates = this.document.querySelectorAll<HTMLOListElement>(
      CHATGPT_SELECTOR_PROFILE.projectConversationLists.join(','),
    );

    return [...candidates].flatMap((list) => {
      const root = list.parentElement;
      if (!root || root.tagName !== 'SECTION' || !this.listBelongsToProject(list, projectKey)) {
        return [];
      }
      return [{ root, list }];
    });
  }

  private listBelongsToProject(list: HTMLOListElement, projectKey: string): boolean {
    const identities = this.conversationIdentities(list);
    return (
      identities.length > 0 &&
      identities.every((identity) => identity.projectKey === projectKey)
    );
  }

  private extractRows(projectList: ProjectList, projectKey: string): ConversationRow[] {
    const rows: ConversationRow[] = [];
    for (const listItem of [...projectList.list.children]) {
      if (listItem.tagName !== 'LI') continue;

      const anchors = this.recognizedConversationAnchors(listItem, projectKey);
      if (anchors.length === 0) continue;
      if (anchors.length !== 1) {
        this.diagnose('PP_ADAPTER_ROW_AMBIGUOUS');
        continue;
      }
      const anchor = anchors[0];
      if (!anchor) continue;

      const row = this.toConversationRow(listItem, anchor, projectKey);
      if (row) rows.push(row);
    }
    return rows;
  }

  private toConversationRow(
    listItem: Element,
    anchor: HTMLAnchorElement,
    projectKey: string,
  ): ConversationRow | null {
    const identity = parseConversationNavigationHref(anchor.href, this.locationHref());
    if (!identity || identity.projectKey !== projectKey) {
      this.diagnose('PP_ADAPTER_ROW_NO_HREF');
      return null;
    }

    const layout = anchor.parentElement;
    const actionMount = anchor.nextElementSibling;
    const validLayout =
      layout?.tagName === 'DIV' &&
      layout.parentElement === listItem &&
      listItem.children.length === 1 &&
      actionMount?.tagName === 'DIV' &&
      actionMount === layout.lastElementChild;
    if (!validLayout || !layout || !actionMount) {
      this.diagnose('PP_ADAPTER_PROFILE_MISMATCH');
      return null;
    }

    const title = this.readConversationTitle(anchor);
    if (!title) {
      this.diagnose('PP_ADAPTER_PROFILE_MISMATCH');
      return null;
    }

    return {
      conversationKey: identity.conversationKey,
      href: identity.href,
      title,
      element: listItem as HTMLElement,
      actionMount: actionMount as HTMLElement,
    };
  }

  private conversationIdentities(root: ParentNode) {
    return this.conversationAnchors(root)
      .map((anchor) => parseConversationNavigationHref(anchor.href, this.locationHref()))
      .filter((identity): identity is NonNullable<typeof identity> => identity !== null);
  }

  private recognizedConversationAnchors(root: ParentNode, projectKey: string): HTMLAnchorElement[] {
    return this.conversationAnchors(root).filter((anchor) => {
      const identity = parseConversationNavigationHref(anchor.href, this.locationHref());
      return identity?.projectKey === projectKey;
    });
  }

  private conversationAnchors(root: ParentNode): HTMLAnchorElement[] {
    return CHATGPT_SELECTOR_PROFILE.conversationLinks.flatMap((selector) =>
      [...root.querySelectorAll<HTMLAnchorElement>(selector)],
    );
  }

  /**
   * Conversation rows may contain a message-preview sibling. Read only the
   * dedicated title element in that verified layout; never flatten link text.
   */
  private readConversationTitle(anchor: HTMLAnchorElement): string | null {
    if (anchor.childElementCount === 0) {
      return anchor.textContent?.trim() || null;
    }

    const content = anchor.firstElementChild;
    const titleContainer = content?.firstElementChild;
    const titleElement = titleContainer?.firstElementChild;
    const isVerifiedPreviewLayout =
      anchor.childElementCount === 1 &&
      content?.tagName === 'DIV' &&
      titleContainer?.tagName === 'DIV' &&
      titleElement?.tagName === 'DIV' &&
      titleContainer.children.length >= 2 &&
      titleElement.childElementCount === 0;
    if (!isVerifiedPreviewLayout || !titleElement) return null;

    return titleElement.textContent?.trim() || null;
  }

  private locationHref(): string {
    return this.options.locationHref ?? this.document.location.href;
  }

  private diagnose(code: AdapterDiagnosticCode): void {
    this.options.onDiagnostic?.(code);
  }
}
