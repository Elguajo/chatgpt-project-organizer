import {
  CURRENT_SCHEMA_VERSION,
  STORAGE_KEY,
  createEmptyState,
  type PinnedConversation,
  type ProjectPinBucket,
  type ProjectPinsStateV1,
} from '../core/model';

/** The small subset of extension storage used by this repository. */
export interface ExtensionLocalStorageArea {
  get(keys: string): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
}

export interface ProjectPinsRepository {
  readState(): Promise<ProjectPinsStateV1>;
  writeState(state: ProjectPinsStateV1): Promise<void>;
}

export type ProjectPinsStorageErrorCode =
  | 'PP_STORAGE_READ_FAILED'
  | 'PP_STORAGE_WRITE_FAILED'
  | 'PP_STORAGE_CORRUPT_STATE'
  | 'PP_STORAGE_UNSUPPORTED_SCHEMA';

/**
 * A safe-to-surface failure. Callers must not replace state after receiving one
 * of these errors: malformed and future-version values are deliberately left
 * untouched for a future compatible extension version to recover.
 */
export class ProjectPinsStorageError extends Error {
  constructor(
    readonly code: ProjectPinsStorageErrorCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'ProjectPinsStorageError';
  }
}

/**
 * The only persistence boundary for ProjectPins state. One `set` writes the
 * entire validated state object, which is atomic enough for the MVP data size.
 */
export class LocalProjectPinsRepository implements ProjectPinsRepository {
  constructor(
    private readonly storageArea: ExtensionLocalStorageArea = browser.storage.local,
  ) {}

  async readState(): Promise<ProjectPinsStateV1> {
    let values: Record<string, unknown>;
    try {
      values = await this.storageArea.get(STORAGE_KEY);
    } catch (error) {
      throw new ProjectPinsStorageError(
        'PP_STORAGE_READ_FAILED',
        'Unable to read ProjectPins local storage.',
        { cause: error },
      );
    }

    const rawState = values[STORAGE_KEY];
    if (rawState === undefined) return createEmptyState();

    return parseStoredState(rawState);
  }

  async writeState(state: ProjectPinsStateV1): Promise<void> {
    const validatedState = parseStoredState(state);
    try {
      await this.storageArea.set({ [STORAGE_KEY]: validatedState });
    } catch (error) {
      throw new ProjectPinsStorageError(
        'PP_STORAGE_WRITE_FAILED',
        'Unable to write ProjectPins local storage.',
        { cause: error },
      );
    }
  }
}

/**
 * This is the explicit migration gate. Schema v1 is the first shipped shape,
 * so there are no older schemas to migrate yet. Add a tested case here before
 * accepting any future legacy schema.
 */
export function parseStoredState(rawState: unknown): ProjectPinsStateV1 {
  if (!isRecord(rawState)) {
    throw corruptState('The stored ProjectPins state is not an object.');
  }

  const schemaVersion = rawState.schemaVersion;
  if (typeof schemaVersion !== 'number' || !Number.isInteger(schemaVersion)) {
    throw corruptState('The stored ProjectPins schema version is invalid.');
  }
  if (schemaVersion > CURRENT_SCHEMA_VERSION) {
    throw new ProjectPinsStorageError(
      'PP_STORAGE_UNSUPPORTED_SCHEMA',
      `ProjectPins schema version ${schemaVersion} is newer than this extension.`,
    );
  }
  if (schemaVersion !== CURRENT_SCHEMA_VERSION) {
    throw new ProjectPinsStorageError(
      'PP_STORAGE_UNSUPPORTED_SCHEMA',
      `ProjectPins schema version ${schemaVersion} has no registered migration.`,
    );
  }

  if (!isRecord(rawState.projects)) {
    throw corruptState('The stored ProjectPins projects value is invalid.');
  }

  const projects: ProjectPinsStateV1['projects'] = {};
  for (const [projectKey, rawBucket] of Object.entries(rawState.projects)) {
    if (!isNonBlankString(projectKey)) {
      throw corruptState('A stored ProjectPins project key is invalid.');
    }
    projects[projectKey] = parseProjectBucket(rawBucket);
  }

  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    projects,
  };
}

function parseProjectBucket(rawBucket: unknown): ProjectPinBucket {
  if (!isRecord(rawBucket) || !Array.isArray(rawBucket.pins) || !isTimestamp(rawBucket.updatedAt)) {
    throw corruptState('A stored ProjectPins project bucket is invalid.');
  }

  const seenConversationKeys = new Set<string>();
  const pins = rawBucket.pins.map((rawPin) => {
    const pin = parsePinnedConversation(rawPin);
    if (seenConversationKeys.has(pin.conversationKey)) {
      throw corruptState('A stored ProjectPins project bucket contains duplicate pins.');
    }
    seenConversationKeys.add(pin.conversationKey);
    return pin;
  });

  return { pins, updatedAt: rawBucket.updatedAt };
}

function parsePinnedConversation(rawPin: unknown): PinnedConversation {
  if (!isRecord(rawPin)) {
    throw corruptState('A stored pinned conversation is not an object.');
  }

  const { conversationKey, href, title, order, pinnedAt, updatedAt } = rawPin;
  if (
    !isNonBlankString(conversationKey) ||
    !isNonBlankString(href) ||
    !isNonBlankString(title) ||
    !isOrder(order) ||
    !isTimestamp(pinnedAt) ||
    !isTimestamp(updatedAt)
  ) {
    throw corruptState('A stored pinned conversation has invalid metadata.');
  }

  return { conversationKey, href, title, order, pinnedAt, updatedAt };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonBlankString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isTimestamp(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function isOrder(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function corruptState(message: string): ProjectPinsStorageError {
  return new ProjectPinsStorageError('PP_STORAGE_CORRUPT_STATE', message);
}
