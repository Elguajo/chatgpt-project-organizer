import type {
  ConversationKey,
  PinnedConversation,
  ProjectKey,
  ProjectPinsStateV1,
} from './model';
import type { ProjectPinsRepository } from '../storage/repository';

/** Navigation metadata supplied by the adapter; it deliberately excludes chat content. */
export interface PinConversationInput {
  conversationKey: ConversationKey;
  href: string;
  title: string;
}

export class PinControllerInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PinControllerInputError';
  }
}

/**
 * Project-scoped pin operations over the storage repository. It has no DOM or
 * in-memory cache, so a failed read/write cannot leak or partially replace
 * visible state.
 */
export class ProjectPinController {
  constructor(
    private readonly repository: ProjectPinsRepository,
    private readonly now: () => number = Date.now,
  ) {}

  async list(projectKey: ProjectKey): Promise<PinnedConversation[]> {
    assertKey(projectKey, 'Project key');
    const state = await this.repository.readState();
    return sortedPins(state.projects[projectKey]?.pins ?? []);
  }

  async pin(projectKey: ProjectKey, conversation: PinConversationInput): Promise<PinnedConversation[]> {
    assertKey(projectKey, 'Project key');
    assertConversationInput(conversation);

    const state = await this.repository.readState();
    const currentBucket = state.projects[projectKey];
    const currentPins = currentBucket?.pins ?? [];
    if (currentPins.some((pin) => pin.conversationKey === conversation.conversationKey)) {
      return sortedPins(currentPins);
    }

    const timestamp = timestampFrom(this.now());
    const nextPins = [
      {
        conversationKey: conversation.conversationKey,
        href: conversation.href,
        title: conversation.title,
        order: 0,
        pinnedAt: timestamp,
        updatedAt: timestamp,
      },
      ...currentPins.map((pin) => ({ ...pin, order: pin.order + 1 })),
    ];
    const nextState = withProjectPins(state, projectKey, nextPins, timestamp);

    await this.repository.writeState(nextState);
    return sortedPins(nextPins);
  }

  async unpin(projectKey: ProjectKey, conversationKey: ConversationKey): Promise<PinnedConversation[]> {
    assertKey(projectKey, 'Project key');
    assertKey(conversationKey, 'Conversation key');

    const state = await this.repository.readState();
    const currentBucket = state.projects[projectKey];
    const currentPins = currentBucket?.pins ?? [];
    const nextPins = currentPins.filter((pin) => pin.conversationKey !== conversationKey);
    if (nextPins.length === currentPins.length) return sortedPins(currentPins);

    const timestamp = timestampFrom(this.now());
    const resequencedPins = nextPins.map((pin, order) => ({ ...pin, order }));
    const nextState = withProjectPins(state, projectKey, resequencedPins, timestamp);

    await this.repository.writeState(nextState);
    return sortedPins(resequencedPins);
  }

  async refreshTitle(
    projectKey: ProjectKey,
    conversationKey: ConversationKey,
    title: string,
  ): Promise<PinnedConversation[]> {
    assertKey(projectKey, 'Project key');
    assertKey(conversationKey, 'Conversation key');
    assertTitle(title);

    const state = await this.repository.readState();
    const currentBucket = state.projects[projectKey];
    const currentPins = currentBucket?.pins ?? [];
    const currentPin = currentPins.find((pin) => pin.conversationKey === conversationKey);
    if (!currentPin || currentPin.title === title) return sortedPins(currentPins);

    const timestamp = timestampFrom(this.now());
    const nextPins = currentPins.map((pin) =>
      pin.conversationKey === conversationKey ? { ...pin, title, updatedAt: timestamp } : pin,
    );
    const nextState = withProjectPins(state, projectKey, nextPins, timestamp);

    await this.repository.writeState(nextState);
    return sortedPins(nextPins);
  }
}

function withProjectPins(
  state: ProjectPinsStateV1,
  projectKey: ProjectKey,
  pins: PinnedConversation[],
  updatedAt: number,
): ProjectPinsStateV1 {
  return {
    schemaVersion: state.schemaVersion,
    projects: {
      ...state.projects,
      [projectKey]: {
        pins,
        updatedAt,
      },
    },
  };
}

function sortedPins(pins: PinnedConversation[]): PinnedConversation[] {
  return [...pins]
    .sort(
      (left, right) =>
        left.order - right.order ||
        right.pinnedAt - left.pinnedAt ||
        left.conversationKey.localeCompare(right.conversationKey),
    )
    .map((pin) => ({ ...pin }));
}

function assertConversationInput(conversation: PinConversationInput): void {
  assertKey(conversation.conversationKey, 'Conversation key');
  assertKey(conversation.href, 'Conversation href');
  assertTitle(conversation.title);
}

function assertKey(value: string, label: string): void {
  if (value.trim().length === 0) {
    throw new PinControllerInputError(`${label} must not be blank.`);
  }
}

function assertTitle(title: string): void {
  if (title.trim().length === 0) {
    throw new PinControllerInputError('Conversation title must not be blank.');
  }
}

function timestampFrom(value: number): number {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new PinControllerInputError('Clock returned an invalid timestamp.');
  }
  return value;
}
