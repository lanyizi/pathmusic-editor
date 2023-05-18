<template>
  <div class="editor-view">
    <menu class="top left">
      <button @click="clear">New</button>
      <button @click="save">Save</button>
      <button @click="reset">Reset</button>
    </menu>
    <nav class="top right">
      <a href="https://github.com/lanyizi/pathmusic-editor">Source Code</a>
    </nav>
    <GLayout class="main" ref="GLayoutRoot"></GLayout>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import { useEditor } from '@/composables/useEditor';
import GLayout from '@/components/golden-layout/GLayout.vue';
import {
  ComponentItemConfig,
  ItemType,
  type LayoutConfig,
} from 'golden-layout';
import { onMounted } from 'vue';

const { loadModel, clear, save, reset } = useEditor();

const GLayoutRoot = ref<InstanceType<typeof GLayout>>(null!);
const layoutConfig: LayoutConfig = {
  root: {
    type: ItemType.row,
    content: [
      {
        type: 'component',
        title: 'Event Inspector',
        header: {
          show: 'top',
        },
        componentType: 'EventInspector',
        width: 20,
      } as ComponentItemConfig,
      {
        type: 'stack',
        content: [
          {
            type: 'component',
            title: 'Browser File List',
            header: {
              show: 'top',
            },
            componentType: 'BrowserFileProvider',
          },
          {
            type: 'component',
            title: 'Nodes Text View',
            header: {
              show: 'top',
            },
            componentType: 'NodesTextView',
          } as ComponentItemConfig,
        ],
        width: 60,
      },
      {
        type: 'component',
        title: 'Nodes Inspector',
        header: {
          show: 'top',
        },
        componentType: 'NodeInspector',
        width: 20,
      } as ComponentItemConfig,
    ],
  },
};
onMounted(async () => {
  GLayoutRoot.value.loadGLLayout(layoutConfig);
  await loadModel();
  GLayoutRoot.value.findComponents('NodesTextView')[0]?.focus();
});
</script>
<style scoped>
.editor-view {
  display: grid;
  grid-template-rows: min-content minmax(0, 1fr);
  grid-template-columns: auto auto;
}
.editor-view > menu {
  grid-column: 1 / 3;
  padding: 0;
  display: flex;
  justify-content: flex-start;
  gap: 0.5em;
  margin: 0.5em 0.5em 0 0.5em;
}
.editor-view > nav {
  padding: 0;
  display: flex;
  justify-content: flex-end;
  gap: 0.5em;
  margin: 0.5em 0.5em 0 0.5em;
}
.editor-view > * {
  margin: 0.5em;
}
.editor-view > .text-view {
  overflow-y: auto;
}
.editor-view > .graph-view {
  overflow: auto;
}
.left {
  grid-column: 1;
}
.right {
  grid-column: 2;
}
.top {
  grid-row: 1;
}
.main {
  grid-column: 1 / 3;
}
</style>
<style src="golden-layout/dist/css/goldenlayout-base.css"></style>
<style src="golden-layout/dist/css/themes/goldenlayout-dark-theme.css"></style>
