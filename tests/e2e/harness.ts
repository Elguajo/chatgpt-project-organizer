import { ProjectPinsRuntime } from '../../src/bootstrap';
import { ProjectConversationAdapter } from '../../src/adapter/project-conversation-adapter';
import { ProjectPinController } from '../../src/core/pin-controller';
import { createEmptyState } from '../../src/core/model';

// Runs on synthetic HTML only. It deliberately does not use extension storage.
let state = createEmptyState();
const project = 'g-p-00000000000000000000000000000000-test-project';
const runtime = new ProjectPinsRuntime({ document,
  adapter: new ProjectConversationAdapter(document, { locationHref: `https://chatgpt.com/g/${project}/project` }),
  controller: new ProjectPinController({ readState: async () => structuredClone(state), writeState: async next => { state = structuredClone(next); } }),
});
runtime.start();
Object.assign(window, { projectPinsTest: { runtime, state: () => structuredClone(state) } });
