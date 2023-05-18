import { type InjectionKey, provide, inject, type Ref, ref } from 'vue';

type GetContent<T> = (result: Promise<T>) => void;

export interface PendingTask<T> {
  id: number;
  resolve: GetContent<T>;
}
export interface PendingReadTask<T> extends PendingTask<T> {
  path: string;
}
export interface PendingWriteTask<T> extends PendingTask<void> {
  path: string;
  data: T;
}

export interface FileStore {
  loadText(path: string): Promise<string>;
  loadBinary(path: string): Promise<ArrayBuffer>;
  saveText(path: string, data: string): Promise<void>;
  saveBinary(path: string, data: ArrayBuffer): Promise<void>;
  reset(): Promise<void>;
  requestedTextFiles: Ref<PendingReadTask<string>[]>;
  requestedBinaryFiles: Ref<PendingReadTask<ArrayBuffer>[]>;
  requestedTextSaves: Ref<PendingWriteTask<string>[]>;
  requestedBinarySaves: Ref<PendingWriteTask<ArrayBuffer>[]>;
  requestedResets: Ref<PendingTask<void>[]>;
}

const key = Symbol('FileStore') as InjectionKey<FileStore>;

export function provideFileStore(): FileStore {
  const requestedTextFiles = ref<PendingReadTask<string>[]>([]);
  const requestedBinaryFiles = ref<PendingReadTask<ArrayBuffer>[]>([]);
  const requestedTextSaves = ref<PendingWriteTask<string>[]>([]);
  const requestedBinarySaves = ref<PendingWriteTask<ArrayBuffer>[]>([]);
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
  function writeAsync<T>(
    path: string,
    data: T,
    list: Ref<PendingWriteTask<T>[]>
  ) {
    return new Promise<void>((resolve, reject) => {
      const id = ++lastId;
      const task = {
        id,
        path,
        data,
        resolve: (promise: Promise<void>) => {
          promise
            .then(() => {
              resolve();
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
    saveText: (path: string, data: string) =>
      writeAsync(path, data, requestedTextSaves),
    saveBinary: (path: string, data: ArrayBuffer) =>
      writeAsync(path, data, requestedBinarySaves),
    reset: () => readAsync('', requestedResets),
    requestedTextFiles,
    requestedBinaryFiles,
    requestedResets,
    requestedTextSaves,
    requestedBinarySaves,
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
