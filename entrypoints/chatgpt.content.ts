import { bootstrapProjectPins } from '../src/bootstrap';
import '../src/ui/projectpins.css';

export default defineContentScript({
  matches: ['https://chatgpt.com/*'],
  runAt: 'document_idle',
  main(context) {
    bootstrapProjectPins(context.signal);
  },
});
