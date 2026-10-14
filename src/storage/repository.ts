import {
  CURRENT_SCHEMA_VERSION,
  STORAGE_KEY,
  createEmptyState,
  COLORS,
  type ChatAppearance,
  type ChatColor,
  type PinnedConversation,
  type ProjectPinBucket,
  type ProjectPinsState,
} from '../core/model';
import { normalizeNavigationHref } from '../adapter/identity';

/** The small subset of extension storage used by this repository. */
export interface ExtensionLocalStorageArea {
  get(keys: string): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
}

export interface ProjectPinsRepository {
  readState(): Promise<ProjectPinsState>;
  writeState(state: ProjectPinsState): Promise<void>;
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

  async readState(): Promise<ProjectPinsState> {
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

  async writeState(state: ProjectPinsState): Promise<void> {
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
 * V1 pins migrate losslessly in memory; the next successful edit commits v2.
 * The root key stays stable so older builds reject v2 instead of clobbering it.
 */
export function parseStoredState(rawState: unknown): ProjectPinsState {
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
  if (schemaVersion !== 1 && schemaVersion !== CURRENT_SCHEMA_VERSION) {
    throw new ProjectPinsStorageError(
      'PP_STORAGE_UNSUPPORTED_SCHEMA',
      `ProjectPins schema version ${schemaVersion} has no registered migration.`,
    );
  }

  if (!isRecord(rawState.projects)) {
    throw corruptState('The stored ProjectPins projects value is invalid.');
  }

  const projects: ProjectPinsState['projects'] = {};
  for (const [projectKey, rawBucket] of Object.entries(rawState.projects)) {
    if (!isSafeKey(projectKey)) {
      throw corruptState('A stored ProjectPins project key is invalid.');
    }
    projects[projectKey] = parseProjectBucket(rawBucket, schemaVersion);
  }

  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    projects,
  };
}

function parseProjectBucket(rawBucket: unknown, version: number): ProjectPinBucket {
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

  const bucket: ProjectPinBucket = { pins, updatedAt: rawBucket.updatedAt };
  if (version === 2 && rawBucket.annotations !== undefined) {
    if (!isRecord(rawBucket.annotations)) throw corruptState('Invalid annotations.');
    bucket.annotations = {};
    for (const [key, value] of Object.entries(rawBucket.annotations)) {
      if (!isSafeKey(key)) throw corruptState('Invalid conversation key.');
      bucket.annotations[key] = parseAppearance(value);
    }
  }
  return bucket;
}

export function parseAppearance(value: unknown): ChatAppearance {
  if (!isRecord(value) || !Array.isArray(value.tags) || value.tags.length > 12 ||
      (value.titleColor !== null && !isColor(value.titleColor))) {
    throw corruptState('Invalid chat appearance.');
  }
  const names = new Set<string>();
  const tags = value.tags.map(tag => {
    if (!isRecord(tag) || !isNonBlankString(tag.name) || tag.name.trim().length > 40 || !isColor(tag.color)) {
      throw corruptState('Invalid tag.');
    }
    const name = tag.name.trim();
    if (names.has(name.toLocaleLowerCase())) throw corruptState('Duplicate tag.');
    names.add(name.toLocaleLowerCase());
    return { name, color: tag.color };
  });
  return { tags, titleColor: value.titleColor as ChatColor | null };
}

function isColor(value: unknown): value is ChatColor {
  return typeof value === 'string' && (COLORS as readonly string[]).includes(value);
}

function isSafeKey(value: unknown): value is string {
  return isNonBlankString(value) && !['__proto__', 'constructor', 'prototype'].includes(value);
}

function parsePinnedConversation(rawPin: unknown): PinnedConversation {
  if (!isRecord(rawPin)) {
    throw corruptState('A stored pinned conversation is not an object.');
  }

  const { conversationKey, href, title, order, pinnedAt, updatedAt } = rawPin;
  if (
    !isNonBlankString(conversationKey) ||
    !isNonBlankString(href) || !normalizeNavigationHref(href) ||
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
