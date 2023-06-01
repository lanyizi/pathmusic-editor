import { type FileStore } from '@/file-store';
import { provide, type InjectionKey, inject } from 'vue';
import toWav from 'audiobuffer-to-wav';

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

  function parseAudioDescription(text: string): PathMusicAudio {
    // parse a single line to a PathMusicAudio.
    // example: mix(file('id1'), slice(0, 0, 1, file('id2')), volume(0.5, 1, file('id3')))

    const stack: Partial<PathMusicAudio>[] = [];
    while (text.length > 0) {
      text = text.trim();
      if (text.startsWith(')')) {
        text = text.slice(1);
        const audio = stack.pop();
        if (!audio) {
          throw new Error('Unexpected )');
        }
        if (stack.length === 0) {
          return audio as PathMusicAudio;
        }
        const parent = stack[stack.length - 1];
        if ('source' in parent) {
          if (parent.source) {
            throw new Error(
              `Duplicate source of ${parent.type}: ${audio.type} and ${parent.source.type}`
            );
          }
          parent.source = audio as PathMusicAudio;
        } else if ('sources' in parent && Array.isArray(parent.sources)) {
          parent.sources.push(audio as PathMusicAudio);
        } else {
          throw new Error(
            `Unexpected audio type ${audio.type} as source of ${parent.type}`
          );
        }
      }
      if (text.startsWith('file(')) {
        text = text.slice('file('.length);
        const id = text.slice(0, text.indexOf(')'));
        stack.push({ type: 'file', id });
        text = text.slice(id.length + 1);
      } else if (text.startsWith('slice(')) {
        text = text.slice('slice('.length);
        const waitText = text.slice(0, text.indexOf(','));
        const waitSecondsBeforeStart = parseFloat(waitText);
        text = text.slice(waitText.length + 1);
        const startText = text.slice(0, text.indexOf(','));
        const start = parseFloat(startText);
        text = text.slice(startText.length + 1);
        const endText = text.slice(0, text.indexOf(','));
        const end = parseFloat(endText);
        text = text.slice(endText.length + 1);
        stack.push({
          type: 'slice',
          waitSecondsBeforeStart,
          start,
          end,
        });
      } else if (text.startsWith('volume(')) {
        text = text.slice('volume('.length);
        const startVolumeText = text.slice(0, text.indexOf(','));
        const startVolume = parseFloat(startVolumeText);
        text = text.slice(startVolumeText.length + 1);
        const endVolumeText = text.slice(0, text.indexOf(','));
        const endVolume = parseFloat(endVolumeText);
        text = text.slice(endVolumeText.length + 1);
        stack.push({
          type: 'volume',
          startVolume,
          endVolume,
        });
      } else if (text.startsWith('mix(')) {
        text = text.slice('mix('.length);
        stack.push({
          type: 'mix',
          sources: [],
        });
      } else {
        throw new Error(`Unexpected audio type: ${text}`);
      }
    }
    throw new Error('Unexpected end of text');
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

type PathMusicAudio =
  | PathMusicAudioFile
  | PathMusicAudioSlice
  | PathMusicAudioVolume
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
interface PathMusicAudioVolume {
  type: 'volume';
  source: PathMusicAudio;
  startVolume: number;
  endVolume: number;
}
interface PathMusicAudioMix {
  type: 'mix';
  sources: PathMusicAudio[];
}
