import { bootstrapProjectPins } from '../src/bootstrap';
import '../src/ui/projectpins.css';
import { STORAGE_KEY } from '../src/core/model';

export default defineContentScript({
  matches: ['https://chatgpt.com/*'],
  runAt: 'document_idle',
  main(context) {
    const runtime = bootstrapProjectPins(context.signal);
    const changed = (changes: Record<string, unknown>, area: string) => {
      if (area === 'local' && STORAGE_KEY in changes) runtime.refresh();
    };
    browser.storage.onChanged.addListener(changed);
    context.signal.addEventListener('abort', () => browser.storage.onChanged.removeListener(changed), { once: true });
  },
});
