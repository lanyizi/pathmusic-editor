import { type FileStore } from '@/file-store';
import { provide, type InjectionKey, inject } from 'vue';
import toWav from 'audiobuffer-to-wav';
import { parseAudioDescription, type PathMusicAudio } from '@/audio';

export interface AudioPlayer {
  getAudio(category: 'file', audioId: string): Promise<AudioBufferSourceNode>;
  declareAudio(id: string, description: string): void;
  downloadAudio(id: string): Promise<void>;
}

const key = Symbol('AudioPlayer') as InjectionKey<AudioPlayer>;
const targetSampleRate = 44100;

export function provideAudioPlayer(fileStore: FileStore) {
  const context = new AudioContext();
  const audioStore: [string, PathMusicAudio][] = [];

  async function getFileAudio(category: 'file', audioId: string) {
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

  async function getAudio(audio: PathMusicAudio): Promise<AudioBuffer> {
    switch (audio.type) {
      case 'file': {
        const sourceBuffer = await fileStore.loadBinary(audio.id);
        const decoded = await context.decodeAudioData(sourceBuffer);
        const audioNode = context.createBufferSource();
        audioNode.buffer = decoded;
        audioNode.connect(context.destination);
        const offlineContext = new OfflineAudioContext(
          2,
          decoded.duration * targetSampleRate,
          targetSampleRate
        );
        const offlineAudioNode = offlineContext.createBufferSource();
        offlineAudioNode.buffer = decoded;
        offlineAudioNode.connect(offlineContext.destination);
        const channelSplitter = new ChannelSplitterNode(offlineContext, {
          numberOfOutputs: 2,
        });
        const channelMerger = new ChannelMergerNode(offlineContext, {
          numberOfInputs: 2,
        });
        // split channels
        offlineAudioNode.connect(channelSplitter);
        // merge channels
        channelSplitter.connect(channelMerger, 0, 0);
        channelSplitter.connect(channelMerger, 1, 1);
        // connect to destination
        channelMerger.connect(offlineContext.destination);
        // render
        audioNode.start();
        return await offlineContext.startRendering();
      }
      case 'slice': {
        const source = await getAudio(audio.source);
        const offlineContext = new OfflineAudioContext(
          2,
          (audio.waitSecondsBeforeStart + audio.end - audio.start) *
            targetSampleRate,
          targetSampleRate
        );
        const offlineAudioNode = offlineContext.createBufferSource();
        offlineAudioNode.buffer = source;
        offlineAudioNode.connect(offlineContext.destination);
        offlineAudioNode.start(
          audio.waitSecondsBeforeStart,
          audio.start,
          audio.end - audio.start
        );
        return await offlineContext.startRendering();
      }
      case 'volume': {
        const source = await getAudio(audio.source);
        const offlineContext = new OfflineAudioContext(
          2,
          source.duration * targetSampleRate,
          targetSampleRate
        );
        const offlineAudioNode = offlineContext.createBufferSource();
        offlineAudioNode.buffer = source;
        offlineAudioNode.connect(offlineContext.destination);
        const gainNode = new GainNode(offlineContext, {
          gain: audio.startVolume,
        });
        offlineAudioNode.connect(gainNode);
        gainNode.connect(offlineContext.destination);
        gainNode.gain.setValueAtTime(audio.startVolume, 0);
        gainNode.gain.linearRampToValueAtTime(audio.endVolume, source.duration);
        return await offlineContext.startRendering();
      }
      case 'mix': {
        const sources = await Promise.all(audio.sources.map(getAudio));
        const offlineContext = new OfflineAudioContext(
          2,
          sources.reduce((acc, source) => Math.max(acc, source.duration), 0) *
            targetSampleRate,
          targetSampleRate
        );
        const offlineAudioNodes = sources.map((source) => {
          const offlineAudioNode = offlineContext.createBufferSource();
          offlineAudioNode.buffer = source;
          offlineAudioNode.connect(offlineContext.destination);
          return offlineAudioNode;
        });
        offlineAudioNodes.forEach((offlineAudioNode) =>
          offlineAudioNode.start()
        );
        return await offlineContext.startRendering();
      }
    }
  }

  async function getAudioNode(audio: PathMusicAudio) {
    const buffer = await getAudio(audio);
    const audioNode = context.createBufferSource();
    audioNode.buffer = buffer;
    audioNode.connect(context.destination);
    return audioNode;
  }

  async function generateWavFile(audio: PathMusicAudio): Promise<ArrayBuffer> {
    const buffer = await getAudio(audio);
    return toWav(buffer);
  }

  const value: AudioPlayer = {
    getAudio: getFileAudio,
    declareAudio(id, description) {
      const audio = parseAudioDescription(description);
      const existing = audioStore.find((a) => a[0] === id);
      if (existing) {
        existing[1] = audio;
      } else {
        audioStore.push([id, audio]);
      }
    },
    async downloadAudio(id) {
      const audio = audioStore.find((a) => a[0] === id);
      if (!audio) {
        throw new Error(`Audio ${id} not declared`);
      }
      return fileStore.saveBinary(`${id}.wav`, await generateWavFile(audio[1]));
    },
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
