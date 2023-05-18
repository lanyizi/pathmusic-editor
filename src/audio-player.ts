import { type FileStore } from '@/file-store';
import { provide, type InjectionKey, inject } from 'vue';

export interface AudioPlayer {
  getAudio(category: 'file', audioId: string): Promise<AudioBufferSourceNode>;
}

const key = Symbol('AudioPlayer') as InjectionKey<AudioPlayer>;

export function provideAudioPlayer(fileStore: FileStore) {
  const context = new AudioContext();

  async function getAudio(category: 'file', audioId: string) {
    let sourceBuffer: ArrayBuffer;
    if (category === 'file') {
      sourceBuffer = await fileStore.loadBinary(audioId);
    } else {
      throw new Error(`Unknown audio id: ${audioId}`);
    }
    const decoded = await context.decodeAudioData(sourceBuffer);
    const audioNode = context.createBufferSource();
    audioNode.buffer = decoded;
    audioNode.connect(context.destination);
    return audioNode;
  }

  const value: AudioPlayer = {
    getAudio,
  };
  provide(key, value);
  return value;
}

export function useAudioPlayer() {
  const player = inject(key);
  if (!player) {
    throw new Error('AudioPlayer not provided');
  }
  return player;
}
