import { describe, expect, it } from 'vitest';
import { ProjectPinController } from '../../src/core/pin-controller';
import { createEmptyState, type ProjectPinsStateV1 } from '../../src/core/model';
import type { ProjectPinsRepository } from '../../src/storage/repository';

class MemoryRepository implements ProjectPinsRepository {
  state: ProjectPinsStateV1 = createEmptyState();
  writes = 0;

  async readState(): Promise<ProjectPinsStateV1> {
    return structuredClone(this.state);
  }

  async writeState(state: ProjectPinsStateV1): Promise<void> {
    this.writes += 1;
    this.state = structuredClone(state);
  }
}

const projectA = 'project-a';
const projectB = 'project-b';
const firstConversation = {
  conversationKey: 'conversation-a',
  href: 'https://chatgpt.com/g/project-a/c/conversation-a',
  title: 'First sanitized title',
};
const secondConversation = {
  conversationKey: 'conversation-b',
  href: 'https://chatgpt.com/g/project-a/c/conversation-b',
  title: 'Second sanitized title',
};

describe('ProjectPinController', () => {
  it('pins once, keeps newest pins first, and does not duplicate repeat pins', async () => {
    const repository = new MemoryRepository();
    let timestamp = 100;
    const controller = new ProjectPinController(repository, () => timestamp++);

    await controller.pin(projectA, firstConversation);
    await controller.pin(projectA, secondConversation);
    const pinsAfterRepeat = await controller.pin(projectA, firstConversation);

    expect(pinsAfterRepeat.map((pin) => pin.conversationKey)).toEqual([
      'conversation-b',
      'conversation-a',
    ]);
    expect(pinsAfterRepeat.map((pin) => pin.order)).toEqual([0, 1]);
    expect(repository.writes).toBe(2);
  });

  it('keeps every query and write scoped to its Project key', async () => {
    const repository = new MemoryRepository();
    const controller = new ProjectPinController(repository, () => 100);

    await controller.pin(projectA, firstConversation);
    await controller.pin(projectB, { ...secondConversation, href: 'https://chatgpt.com/g/project-b/c/conversation-b' });

    await expect(controller.list(projectA)).resolves.toMatchObject([firstConversation]);
    await expect(controller.list(projectB)).resolves.toMatchObject([
      { conversationKey: secondConversation.conversationKey },
    ]);
  });

  it('unpins idempotently and resequences the remaining pins', async () => {
    const repository = new MemoryRepository();
    let timestamp = 100;
    const controller = new ProjectPinController(repository, () => timestamp++);
    await controller.pin(projectA, firstConversation);
    await controller.pin(projectA, secondConversation);

    await expect(controller.unpin(projectA, secondConversation.conversationKey)).resolves.toMatchObject([
      { conversationKey: firstConversation.conversationKey, order: 0 },
    ]);
    await expect(controller.unpin(projectA, secondConversation.conversationKey)).resolves.toMatchObject([
      { conversationKey: firstConversation.conversationKey, order: 0 },
    ]);
    expect(repository.writes).toBe(3);
  });

  it('refreshes a cached title only for the matching Project and conversation identity', async () => {
    const repository = new MemoryRepository();
    const controller = new ProjectPinController(repository, () => 200);
    await controller.pin(projectA, firstConversation);
    await controller.pin(projectB, { ...firstConversation, href: 'https://chatgpt.com/g/project-b/c/conversation-a' });

    await controller.refreshTitle(projectA, firstConversation.conversationKey, 'Updated navigation title');

    await expect(controller.list(projectA)).resolves.toMatchObject([{ title: 'Updated navigation title' }]);
    await expect(controller.list(projectB)).resolves.toMatchObject([{ title: firstConversation.title }]);
  });

  it('surfaces a failed write without replacing state visible through the controller', async () => {
    const repository = new MemoryRepository();
    await repository.writeState({
      schemaVersion: 1,
      projects: {
        [projectA]: {
          pins: [
            {
              ...firstConversation,
              order: 0,
              pinnedAt: 100,
              updatedAt: 100,
            },
          ],
          updatedAt: 100,
        },
      },
    });
    repository.writeState = async () => Promise.reject(new Error('quota exceeded'));
    const controller = new ProjectPinController(repository, () => 200);

    await expect(controller.pin(projectA, secondConversation)).rejects.toThrow('quota exceeded');
    await expect(controller.list(projectA)).resolves.toMatchObject([firstConversation]);
  });
});
