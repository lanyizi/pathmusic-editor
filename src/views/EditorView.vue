<template>
  <div class="editor-view">
    <BrowserFileProvider
      class="left"
      @file-loaded="fileAvailable = true"
    ></BrowserFileProvider>
    <template v-if="model">
      <NodesTextView class="center" :model="model"></NodesTextView>
      <NodeInspector
        v-if="currentNode"
        class="right"
        :node="currentNode"
        :model="model"
      >
      </NodeInspector>
    </template>
    <div v-else-if="loading">Loading...</div>
    <div v-else>Please load models</div>
  </div>
</template>
<script setup lang="ts">
import BrowserFileProvider from '@/components/BrowserFileProvider.vue';
import NodeInspector from '@/components/NodeInspector.vue';
import NodesTextView from '@/components/NodesTextView.vue';
import { useQueryNumberValue } from '@/composables/useQueryNumberValue';
import { provideFileStore } from '@/file-store';
import { createModel, type Model } from '@/model';
import { parseEvents, parseNodesAndRoutes } from '@/parsers';
import { parseTracks } from '@/parsers';
import { computed, watch } from 'vue';
import { ref } from 'vue';

const fileStore = provideFileStore();
const currentNodeId = useQueryNumberValue('node', -1);
const currentNode = computed(() => {
  console.log('currentNodeId.value', currentNodeId.value);
  return currentNodeId.value === -1
    ? null
    : model.value?.data.nodes[currentNodeId.value] ?? null;
});
const model = ref<Model | null>(null);
const loading = ref(false);
const fileAvailable = ref(false);

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
// load model when file is available
const stopWatching = watch(fileAvailable, () => {
  if (fileAvailable.value) {
    stopWatching();
    if (!model.value) {
      loadModel();
    }
  }
});
</script>
<style scoped>
.editor-view {
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
}
.editor-view > * {
  height: 80vh;
}
.left {
  grid-column: 1;
}
.center {
  grid-column: 2;
}
.right {
  grid-column: 3 / 4;
}
.center-right {
  grid-column: 2 / 4;
}
</style>
