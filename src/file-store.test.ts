import { expect, test } from 'vitest';
import { provideFileStore, useFileStore } from './file-store';
import { withSetup } from './test-utils';
import { watch } from 'vue';

test('file-store.load', async () => {
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

test('file-store.save', async () => {
  const { app, innerResult: fileStore } = withSetup(
    provideFileStore,
    useFileStore
  );
  const { saveText, requestedTextSaves } = fileStore;
  let savedPath = '';
  let savedData = '';
  watch(requestedTextSaves, (requested) => {
    requested.forEach(({ path, data, resolve }) => {
      savedPath = path.toUpperCase();
      savedData = data.toUpperCase();
      resolve(Promise.resolve());
    });
  });
  await saveText('test.txt', 'data');
  expect(savedPath).toBe('TEST.TXT');
  expect(savedData).toBe('DATA');
  app?.unmount();
}, 5);
