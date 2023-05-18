<template>
  <div class="nodes-view">
    <template v-for="({ group, selected }, i) in nodeGroups" :key="i">
      <hr v-if="i > 0" />
      <div :class="{ 'group-selected': selected }">
        <span v-for="(data, j) in group" :key="data.id">
          <span v-if="j > 0"> → </span>
          <RouterLink
            :class="{ 'node-selected': data.selected }"
            :to="{ query: createQuery('node', data.id) }"
            ><span class="superscript-subscript"
              ><span>{{ data.id }}</span
              ><sup>{{ data.superscript }}</sup
              ><sub>{{ data.subscript }}</sub></span
            ></RouterLink
          ></span
        >
      </div>
    </template>
  </div>
</template>
<script setup lang="ts">
import { useQueryNumberValue } from '@/composables/useQueryNumberValue';
import { groupModelNodes } from '@/group-model-nodes';
import type { Immutable } from '@/immutable';
import { modelKey, type PathMusicNode } from '@/model';
import { createQuery } from '@/router/create-query';
import { inject } from 'vue';
import { computed } from 'vue';

const model = inject(modelKey)!;
if (!model) {
  throw new Error('model is not provided');
}
const selectedId = useQueryNumberValue('node', -1);
const nodeGroups = computed(() =>
  groupModelNodes(model.value).map((group) => {
    const formattedGroup = group.map(formatHints);
    return {
      group: formattedGroup,
      selected: formattedGroup.some((data) => data.selected),
    };
  })
);

function formatHints(node: Immutable<PathMusicNode>) {
  let superscript = '';
  let subscript = '';
  if (node.musicIndex > 0) {
    superscript += 'M';
  }
  if (model.value.getNodeAssociatedEvents(node.id).length > 0) {
    superscript += 'E';
  }
  if (model.value.getSourceNodesByBranches(node.id).length > 1) {
    superscript += 'B';
  }
  if (model.value.getSourceNodesByRouters(node.id).length > 1) {
    superscript += 'R';
  }
  if (node.branches.length > 1) {
    subscript += 'B';
  }
  if (node.routerID > 0) {
    subscript += 'R';
  }
  return {
    id: node.id,
    superscript,
    subscript,
    selected: node.id === selectedId.value,
  };
}
</script>
<style scoped>
.nodes-view {
  /* scrollable */
  overflow-y: auto;
}

.group-selected {
  background-color: var(--color-background-mute);
}

.node-selected {
  background-color: var(--color-background-link-highlight);
}

/* https://stackoverflow.com/questions/3742975/subscript-and-superscript-for-the-same-element */
.superscript-subscript {
  display: inline-grid;
  align-items: center;
  grid-template-columns: auto auto;
  grid-template-rows: 1fr 1fr;
}
.superscript-subscript > span {
  grid-column: 1;
  grid-row: span 2;
}
.superscript-subscript > sup,
.superscript-subscript > sub {
  font-size: 0.5em;
  grid-column: 2;
}
.superscript-subscript > sup {
  grid-row: 1;
}
.superscript-subscript > sub {
  grid-row: 2;
}
</style>
