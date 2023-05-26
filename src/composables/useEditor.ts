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
  provideAudioPlayer(fileStore);

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
  const originalData = ref<[string, string, string] | null>(null);
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
      const tracks = parseTracks(rawTracks);
      const { nodes, routes } = parseNodesAndRoutes(rawNodes);
      const { events, variables } = parseEvents(rawEvents, tracks, nodes);
      console.log('loading actual model');
      model.value = createModel(tracks, nodes, events, variables, routes);
      originalData.value = [rawTracks, rawNodes, rawEvents];
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
    const ra3MusicHeader = dumpRa3MusicHeader(tracks, events);
    originalData.value = [rawTracks, rawNodes, rawEvents];
    await fileStore.saveText('events.txt', rawEvents);
    await fileStore.saveText('nodes.txt', rawNodes);
    await fileStore.saveText('tracks.txt', rawTracks);
    await fileStore.saveText('ra3music/pc/RA3Music.0.h', ra3MusicHeader);
  }

  async function reset() {
    if (!originalData.value) {
      return;
    }
    model.value = createModel([], [], [], [], []);
    await nextTick();
    const [rawTracks, rawNodes, rawEvents] = originalData.value;
    const tracks = parseTracks(rawTracks);
    const { nodes, routes } = parseNodesAndRoutes(rawNodes);
    const { events, variables } = parseEvents(rawEvents, tracks, nodes);
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
