import { provideAudioPlayer } from '@/audio-player';
import { provideFileStore } from '@/file-store';
import type { Immutable } from '@/immutable';
import { createModel, modelKey, type Model } from '@/model';
import {
  dumpEvents,
  dumpNodesAndRoutes,
  dumpRa3MusicHeader,
  dumpTracks,
  parseEvents,
  parseNodesAndRoutes,
  parseTracks,
} from '@/parsers';
import { computed, nextTick, provide, ref, watch } from 'vue';

export function useEditor() {
  const fileStore = provideFileStore();
  const audioPlayer = provideAudioPlayer(fileStore);

  const model = ref<Model>(createModel([], [], [], [], []));
  provide(modelKey, model);
  const isModelEmpty = computed(() => {
    const fields: Immutable<unknown[]>[] = [
      model.value.data.tracks,
      model.value.data.nodes,
      model.value.data.events,
      model.value.data.variables,
      model.value.data.routers,
    ];
    return fields.every((field) => field.length === 0);
  });

  // for discarding changes and reset to original state
  // back to when the files are loaded
  const originalData = ref<[string, string, string, string] | null>(null);
  const loading = ref(false);
  const fileAvailable = ref(false);

  // load model when file is available
  const stopWatching = watch(fileAvailable, () => {
    if (fileAvailable.value) {
      stopWatching();
      if (isModelEmpty.value) {
        loadModel();
      }
    }
  });

  async function loadModel() {
    console.log('clearing previous model');
    model.value = createModel([], [], [], [], []);
    originalData.value = null;
    try {
      loading.value = true;
      const rawTracks = await fileStore.loadText('tracks.txt');
      const rawNodes = await fileStore.loadText('nodes.txt');
      const rawEvents = await fileStore.loadText('events.txt');
      const rawAudio = await fileStore.loadText('audio.txt');
      const tracks = parseTracks(rawTracks);
      const { nodes, routes } = parseNodesAndRoutes(rawNodes);
      const { events, variables } = parseEvents(rawEvents, tracks, nodes);

      try {
        audioPlayer.audioData.value = JSON.parse(rawAudio);
      } catch (e) {
        if (
          confirm(
            `Failed to load audio data: ${e}\n\nWould you like to reset audio data?`
          )
        ) {
          audioPlayer.audioData.value = [];
        }
      }
      if (audioPlayer.audioData.value.length == 0) {
        audioPlayer.initializeDefaultAudioData(nodes);
      }

      model.value = createModel(tracks, nodes, events, variables, routes);
      originalData.value = [rawTracks, rawNodes, rawEvents, rawAudio];
    } catch (e) {
      console.error(e);
      alert(`Failed to load files: ${e}`);
    } finally {
      loading.value = false;
    }
  }

  function clear() {
    fileStore.reset();
    fileAvailable.value = false;
    model.value = createModel([], [], [], [], []);
  }

  async function save() {
    const { tracks, nodes, events, variables, routers } = model.value.data;
    const rawEvents = dumpEvents(variables, events);
    const rawNodes = dumpNodesAndRoutes(nodes, routers);
    const rawTracks = dumpTracks(tracks);
    const rawAudio = JSON.stringify(audioPlayer.audioData.value);
    const ra3MusicHeader = dumpRa3MusicHeader(tracks, events);
    originalData.value = [rawTracks, rawNodes, rawEvents, rawAudio];
    await fileStore.saveText('events.txt', rawEvents);
    await fileStore.saveText('nodes.txt', rawNodes);
    await fileStore.saveText('tracks.txt', rawTracks);
    await fileStore.saveText('audio.txt', rawAudio);
    await fileStore.saveText('ra3music/pc/RA3Music.0.h', ra3MusicHeader);
    // save WAV
    for (let i = 0; i < audioPlayer.audioData.value.length; ++i) {
      const audios = audioPlayer.audioData.value[i];
      for (let j = 0; j < audios.length; ++j) {
        const audio = audios[j];
        if (audio.type == 'file') {
          // already is a file
          continue;
        }
        await audioPlayer.downloadAudio(i, j);
      }
    }
  }

  async function reset() {
    if (!originalData.value) {
      return;
    }
    model.value = createModel([], [], [], [], []);
    await nextTick();
    const [rawTracks, rawNodes, rawEvents, rawAudio] = originalData.value;
    const tracks = parseTracks(rawTracks);
    const { nodes, routes } = parseNodesAndRoutes(rawNodes);
    const { events, variables } = parseEvents(rawEvents, tracks, nodes);
    audioPlayer.audioData.value = JSON.parse(rawAudio);
    model.value = createModel(tracks, nodes, events, variables, routes);
  }

  return {
    model,
    isModelEmpty,
    loading,
    fileAvailable,
    loadModel,
    clear,
    save,
    reset,
  };
}
