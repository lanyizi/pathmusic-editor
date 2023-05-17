import { type InjectionKey, provide, inject, type Ref, ref } from 'vue';

type GetContent<T> = (result: Promise<T>) => void;

export interface PendingTask<T> {
  id: number;
  path: string;
  resolve: GetContent<T>;
}

interface FileStore {
  loadText(path: string): Promise<string>;
  loadBinary(path: string): Promise<ArrayBuffer>;
  reset(): Promise<void>;
  requestedTextFiles: Ref<PendingTask<string>[]>;
  requestedBinaryFiles: Ref<PendingTask<ArrayBuffer>[]>;
  requestedResets: Ref<PendingTask<void>[]>;
}

const key = Symbol('FileStore') as InjectionKey<FileStore>;

export function provideFileStore(): FileStore {
  const requestedTextFiles = ref<PendingTask<string>[]>([]);
  const requestedBinaryFiles = ref<PendingTask<ArrayBuffer>[]>([]);
  const requestedResets = ref<PendingTask<void>[]>([]);
  let lastId = 0;
  function readAsync<T>(path: string, list: Ref<PendingTask<T>[]>) {
    return new Promise<T>((resolve, reject) => {
      const id = ++lastId;
      const task = {
        id,
        path,
        resolve: (promise: Promise<T>) => {
          promise
            .then((x) => {
              resolve(x);
              list.value = list.value.filter((t) => t.id !== id);
            })
            .catch(reject);
        },
      };
      list.value = [...list.value, task];
    });
  }
  const value = {
    loadText: (path: string) => readAsync(path, requestedTextFiles),
    loadBinary: (path: string) => readAsync(path, requestedBinaryFiles),
    reset: () => readAsync('', requestedResets),
    requestedTextFiles,
    requestedBinaryFiles,
    requestedResets,
  };
  provide(key, value);
  return value;
}

export function useFileStore() {
  const store = inject(key);
  if (!store) {
    throw new Error('No FileStore provided');
  }
  return store;
}
