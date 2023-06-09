import { type FileStore } from '@/file-store';
import {
  provide,
  type InjectionKey,
  inject,
  type Ref,
  ref,
  computed,
} from 'vue';
import toWav from 'audiobuffer-to-wav';
import { normalizeAudio, type PathMusicAudio } from '@/audio';
import type { Immutable } from '@/immutable';
import type { PathMusicNode } from '@/model';

export interface AudioPlayer {
  audioData: Ref<Immutable<PathMusicAudio[][]>>;
  getAudio(track: number, id: number): Immutable<PathMusicAudio>;
  initializeDefaultAudioData(nodes: PathMusicNode[]): void;
  getAudioNode(track: number, id: number): Promise<AudioBufferSourceNode>;
  downloadAudio(track: number, id: number): Promise<void>;
}

const key = Symbol('AudioPlayer') as InjectionKey<AudioPlayer>;
const targetSampleRate = 44100;

export function provideAudioPlayer(fileStore: FileStore) {
  const context = new AudioContext();
  const actualAudioData = ref<PathMusicAudio[][]>([]);
  const audioData = computed({
    get: () => actualAudioData.value,
    set: (value) =>
      (actualAudioData.value = value.map((track) => track.map(normalizeAudio))),
  });

  function getAudio(track: number, id: number) {
    if (!audioData.value[track]) {
      throw new Error(`Track ${track} not declared`);
    }
    const audio = audioData.value[track][id];
    if (!audio) {
      throw new Error(`Track ${track} does not have audio ${id}`);
    }
    return audio;
  }

  async function getAudioBuffer(
    audio: Immutable<PathMusicAudio>
  ): Promise<AudioBuffer> {
    switch (audio.type) {
      case 'file': {
        const sourceBuffer = await fileStore.loadBinary(
          `track${audio.track}.${audio.id}.mp3`
        );
        const decoded = await context.decodeAudioData(sourceBuffer);
        const offlineContext = new OfflineAudioContext(
          2,
          decoded.duration * targetSampleRate,
          targetSampleRate
        );
        const offlineAudioNode = offlineContext.createBufferSource();
        offlineAudioNode.buffer = decoded;
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
        offlineAudioNode.start();
        return await offlineContext.startRendering();
      }
      case 'slice': {
        const source = await getAudioBuffer(audio.source);
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
        const source = await getAudioBuffer(audio.source);
        const offlineContext = new OfflineAudioContext(
          2,
          source.duration * targetSampleRate,
          targetSampleRate
        );
        const offlineAudioNode = offlineContext.createBufferSource();
        offlineAudioNode.buffer = source;
        const gainNode = new GainNode(offlineContext, {
          gain: audio.startVolume,
        });
        offlineAudioNode.connect(gainNode);
        gainNode.connect(offlineContext.destination);
        gainNode.gain.setValueAtTime(audio.startVolume, 0);
        gainNode.gain.linearRampToValueAtTime(audio.endVolume, source.duration);
        offlineAudioNode.start();
        return await offlineContext.startRendering();
      }
      case 'mix': {
        const sources = await Promise.all(audio.sources.map(getAudioBuffer));
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

  async function getAudioNode(audio: Immutable<PathMusicAudio>) {
    const buffer = await getAudioBuffer(audio);
    const audioNode = context.createBufferSource();
    audioNode.buffer = buffer;
    audioNode.connect(context.destination);
    return audioNode;
  }

  async function generateWavFile(
    audio: Immutable<PathMusicAudio>
  ): Promise<ArrayBuffer> {
    const buffer = await getAudioBuffer(audio);
    return toWav(buffer);
  }

  const value: AudioPlayer = {
    audioData,
    getAudio,
    initializeDefaultAudioData(nodes) {
      const maximums: number[] = [];
      for (const node of nodes) {
        const max = maximums[node.trackID] ?? -1;
        if (node.musicIndex > max) {
          maximums[node.trackID] = node.musicIndex;
        }
      }
      const defaultData: PathMusicAudio[][] = [];
      for (const key in maximums) {
        const i = parseInt(key);
        defaultData[i] = [];
        for (let j = 0; j < maximums[i]; ++j) {
          defaultData[i][j] = {
            type: 'file',
            track: i,
            id: j,
          };
        }
      }
      audioData.value = defaultData;
    },
    async getAudioNode(track, id) {
      function createSilentNode() {
        const buffer = context.createBuffer(2, 1, targetSampleRate);
        const audioNode = context.createBufferSource();
        audioNode.buffer = buffer;
        audioNode.connect(context.destination);
        return audioNode;
      }
      try {
        return await getAudioNode(getAudio(track, id));
      } catch (e) {
        alert(`Failed to load audio: ${e}`);
        return createSilentNode();
      }
    },
    async downloadAudio(track, id) {
      return fileStore.saveBinary(
        `${id}.wav`,
        await generateWavFile(getAudio(track, id))
      );
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
