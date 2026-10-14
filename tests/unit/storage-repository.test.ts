import { describe, expect, it } from 'vitest';
import {
  LocalProjectPinsRepository,
  type ExtensionLocalStorageArea,
} from '../../src/storage/repository';
import { STORAGE_KEY, type ProjectPinsState } from '../../src/core/model';

class MemoryStorage implements ExtensionLocalStorageArea {
  value: unknown = undefined;
  getCalls = 0;
  setCalls = 0;

  async get(): Promise<Record<string, unknown>> {
    this.getCalls += 1;
    return this.value === undefined ? {} : { [STORAGE_KEY]: this.value };
  }

  async set(items: Record<string, unknown>): Promise<void> {
    this.setCalls += 1;
    this.value = items[STORAGE_KEY];
  }
}

const validState: ProjectPinsState = {
  schemaVersion: 2,
  projects: {
    'project-a': {
      updatedAt: 100,
      pins: [
        {
          conversationKey: 'conversation-a',
          href: 'https://chatgpt.com/g/project-a/c/conversation-a',
          title: 'Sanitized navigation title',
          order: 0,
          pinnedAt: 100,
          updatedAt: 100,
        },
      ],
    },
  },
};

describe('LocalProjectPinsRepository', () => {
  it('reads an empty v2 state when no persisted value exists', async () => {
    const repository = new LocalProjectPinsRepository(new MemoryStorage());

    await expect(repository.readState()).resolves.toEqual({ schemaVersion: 2, projects: {} });
  });

  it('persists only the schema-v2 navigation metadata shape', async () => {
    const storage = new MemoryStorage();
    const repository = new LocalProjectPinsRepository(storage);

    await repository.writeState(validState);

    expect(storage.value).toEqual(validState);
    expect(Object.keys((storage.value as ProjectPinsState).projects['project-a']!.pins[0]!)).toEqual([
      'conversationKey',
      'href',
      'title',
      'order',
      'pinnedAt',
      'updatedAt',
    ]);
    expect(JSON.stringify(storage.value)).not.toMatch(/message|account|token|cookie/i);
  });

  it('returns copies so callers cannot mutate the persisted state in memory', async () => {
    const storage = new MemoryStorage();
    const repository = new LocalProjectPinsRepository(storage);
    await repository.writeState(validState);

    const state = await repository.readState();
    state.projects['project-a']!.pins[0]!.title = 'Changed only in the caller';

    await expect(repository.readState()).resolves.toEqual(validState);
  });

  it.each([
    [{ schemaVersion: 3, projects: {} }, 'PP_STORAGE_UNSUPPORTED_SCHEMA'],
    [{ schemaVersion: 0, projects: {} }, 'PP_STORAGE_UNSUPPORTED_SCHEMA'],
    [{ schemaVersion: 2, projects: { 'project-a': { pins: [], updatedAt: -1 } } }, 'PP_STORAGE_CORRUPT_STATE'],
  ])('fails closed for incompatible or malformed stored state', async (value, code) => {
    const storage = new MemoryStorage();
    storage.value = value;
    const repository = new LocalProjectPinsRepository(storage);

    await expect(repository.readState()).rejects.toMatchObject({ code });
    expect(storage.setCalls).toBe(0);
  });

  it('surfaces extension storage read and write failures', async () => {
    const failingRead: ExtensionLocalStorageArea = {
      get: async () => Promise.reject(new Error('storage unavailable')),
      set: async () => undefined,
    };
    const failingWrite: ExtensionLocalStorageArea = {
      get: async () => ({}),
      set: async () => Promise.reject(new Error('quota exceeded')),
    };

    await expect(new LocalProjectPinsRepository(failingRead).readState()).rejects.toMatchObject({
      code: 'PP_STORAGE_READ_FAILED',
    });
    await expect(new LocalProjectPinsRepository(failingWrite).writeState(validState)).rejects.toMatchObject({
      code: 'PP_STORAGE_WRITE_FAILED',
    });
  });
});
