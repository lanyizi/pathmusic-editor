import { type FileStore } from '@/file-store';
import { provide, type InjectionKey, inject } from 'vue';

export interface AudioPlayer {
  getAudio(category: 'file', audioId: string): Promise<AudioBufferSourceNode>;
}

const key = Symbol('AudioPlayer') as InjectionKey<AudioPlayer>;
const targetSampleRate = 44100;

export function provideAudioPlayer(fileStore: FileStore) {
  const context = new AudioContext();

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

  const value: AudioPlayer = {
    getAudio: getFileAudio,
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

type PathMusicAudio =
  | PathMusicAudioFile
  | PathMusicAudioSlice
  | PathMusicAudioFade
  | PathMusicAudioMix;

interface PathMusicAudioFile {
  type: 'file';
  id: string;
}
interface PathMusicAudioSlice {
  type: 'slice';
  source: PathMusicAudio;
  waitSecondsBeforeStart: number;
  start: number;
  end: number;
}
interface PathMusicAudioFade {
  type: 'volume';
  source: PathMusicAudio;
  startVolume: number;
  endVolume: number;
}
interface PathMusicAudioMix {
  type: 'mix';
  sources: PathMusicAudio[];
}
