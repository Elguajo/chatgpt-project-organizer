import { bootstrapProjectPins } from '../src/bootstrap';

export default defineContentScript({
  matches: ['https://chatgpt.com/*'],
  runAt: 'document_idle',
  main() {
    bootstrapProjectPins();
  },
});
