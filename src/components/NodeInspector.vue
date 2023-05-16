<template>
  <!-- list properties of PathMusicNode -->
  <div>
    <div>Index: {{ props.node.id }}</div>
    <div>Music: {{ props.node.musicIndex }}</div>
    <section>
      <h2>Branches</h2>
      <ol>
        <li v-for="(branch, i) in props.node.branches" :key="i">
          <label>
            ControlMin
            <input type="number" v-model="branch.controlmin" />
          </label>
          <label>
            ControlMax
            <input type="number" v-model="branch.controlmax" />
          </label>
          <label>
            Destination
            <input type="number" v-model="branch.dstnode" />
          </label>
        </li>
      </ol>
    </section>
    <section>
      <h2>From</h2>
      <ol>
        <li v-for="node in sourcesByBranches" :key="node.id">
          {{ node.id }}
        </li>
      </ol>
    </section>
    <section>
      <h2>Associated Events</h2>
      <ol>
        <li v-for="node in sourcesByBranches" :key="node.id">
          {{ node.id }}
        </li>
      </ol>
    </section>
  </div>
</template>
<script setup lang="ts">
import { useFileStore } from '@/file-store';
import { type PathMusicNode, type Model } from '@/model';
import { computed, type PropType } from 'vue';
const { requestedBinaryFiles } = useFileStore();

const props = defineProps({
  node: {
    type: Object as PropType<PathMusicNode>,
    required: true,
  },
  model: {
    type: Object as PropType<Model>,
    required: true,
  },
});
const sourcesByBranches = computed(
  () => props.model.getSourceNodesByBranches(props.node.id).value
);
const associatedEvents = computed(
  () => props.model.getNodeAssociatedEvents(props.node.id).value
);
</script>
