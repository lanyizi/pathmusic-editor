<template>
  <BrowserFileProvider></BrowserFileProvider>
  <template v-if="model">
    <NodeInspector v-if="currentNode" :node="currentNode" :model="model">
    </NodeInspector>
  </template>
  <div v-else-if="loading">Loading...</div>
  <div v-else>Please load models</div>
</template>
<script setup lang="ts">
import BrowserFileProvider from '@/components/BrowserFileProvider.vue';
import NodeInspector from '@/components/NodeInspector.vue';
import { provideFileStore } from '@/file-store';
import { createModel, type Model, type PathMusicNode } from '@/model';
import { parseEvents, parseNodesAndRoutes } from '@/parsers';
import { parseTracks } from '@/parsers';
import { ref } from 'vue';

const fileStore = provideFileStore();
const currentNode = ref<PathMusicNode | null>(null);
const model = ref<Model | null>(null);
const loading = ref(false);

async function loadModel() {
  model.value = null;
  try {
    loading.value = true;
    const tracks = parseTracks(await fileStore.loadText('tracks.txt'));
    const { nodes, routes } = parseNodesAndRoutes(
      await fileStore.loadText('nodes.txt')
    );
    const { events, variables } = parseEvents(
      await fileStore.loadText('events.txt'),
      tracks,
      nodes
    );
    model.value = createModel(tracks, nodes, events, variables, routes);
  } finally {
    loading.value = false;
  }
}
loadModel();
</script>
