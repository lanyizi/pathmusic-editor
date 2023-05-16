import { expect, test } from 'vitest';
import { provideFileStore, useFileStore } from './file-store';
import { withSetup } from './test-utils';
import { watch } from 'vue';

test('file-store', async () => {
  const { app, innerResult: fileStore } = withSetup(
    provideFileStore,
    useFileStore
  );
  const { loadText, requestedTextFiles } = fileStore;
  watch(requestedTextFiles, (requested) => {
    requested.forEach(({ path, resolve }) => {
      resolve(Promise.resolve(path.toUpperCase()));
    });
  });
  const loadTask = loadText('test.txt');
  expect(await loadTask).toBe('TEST.TXT');
  app?.unmount();
}, 5);
