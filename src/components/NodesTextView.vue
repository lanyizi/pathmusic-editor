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
import { type Model, type PathMusicNode } from '@/model';
import { createQuery } from '@/router/create-query';
import { computed } from 'vue';

const props = defineProps<{ model: Model }>();
const selectedId = useQueryNumberValue('node', -1);
const nodeGroups = computed(() => {
  function getPreviousNodes(node: PathMusicNode) {
    return model
      .getSourceNodesByBranches(node.id)
      .value.filter((n) => n.id !== node.id);
  }
  function getNextNodes(node: PathMusicNode) {
    return node.branches
      .filter((branch) => branch.dstnode !== node.id)
      .map(({ dstnode }) => model.data.nodes[dstnode])
      .filter((n) => !!n);
  }

  const { model } = props;
  const groups: PathMusicNode[][] = model.data.nodes.map(() => []);
  const processed = model.data.nodes.map(() => false);
  for (const node of model.data.nodes) {
    if (processed[node.id]) {
      continue;
    }
    const group = [node];
    processed[node.id] = true;
    const ancestorsQueue = [...getPreviousNodes(node)];
    while (ancestorsQueue.length === 1) {
      const previous = ancestorsQueue.shift()!;
      if (processed[previous.id]) {
        // console.log('circular reference detected', node.id, previous.id);
        break;
      }
      if (getNextNodes(previous).length > 1) {
        // console.log('branching detected', node.id, previous.id);
        break;
      }
      group.unshift(previous);
      processed[previous.id] = true;
      ancestorsQueue.push(...getPreviousNodes(previous));
    }
    const descendantsQueue = [...getNextNodes(node)];
    while (descendantsQueue.length === 1) {
      const next = descendantsQueue.shift()!;
      if (processed[next.id]) {
        // console.log('circular reference detected', node.id, next.id);
        break;
      }
      if (getPreviousNodes(next).length > 1) {
        // console.log('branching detected', node.id, next.id);
        break;
      }
      group.push(next);
      processed[next.id] = true;
      descendantsQueue.push(...getNextNodes(next));
    }
    groups[group[0].id] = group;
  }
  for (const node of model.data.nodes) {
    if (processed[node.id]) {
      continue;
    }
    console.warn('unprocessed node', node);
    groups[node.id] = [node];
    processed[node.id] = true;
  }
  return groups
    .filter((group) => group.length > 0)
    .map((group) => {
      const nodes = group.map((node) => {
        let superscript = '';
        let subscript = '';
        if (node.musicIndex > 0) {
          superscript += 'M';
        }
        if (model.getNodeAssociatedEvents(node.id).value.length > 0) {
          superscript += 'E';
        }
        if (model.getSourceNodesByBranches(node.id).value.length > 1) {
          superscript += 'B';
        }
        if (model.getSourceNodesByRouters(node.id).value.length > 1) {
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
      });
      return {
        group: nodes,
        selected: nodes.some((d) => d.selected),
      };
    });
});
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
