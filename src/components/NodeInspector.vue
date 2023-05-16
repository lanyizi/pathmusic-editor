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
            <TextInput v-model="branch.controlmin" />
          </label>
          <label>
            ControlMax
            <TextInput v-model="branch.controlmax" />
          </label>
          <label>
            Destination
            <TextInput v-model="branch.dstnode">
              <RouterLink
                :to="{ query: createQuery('node', branch.dstnode) }"
              />
            </TextInput>
          </label>
        </li>
      </ol>
    </section>
    <section>
      <h2>From</h2>
      <ol>
        <li v-for="fromNode in sourcesByBranches" :key="fromNode.id">
          {{ fromNode.id }}
        </li>
      </ol>
    </section>
    <section>
      <h2>Associated Events</h2>
      <ol>
        <li v-for="event in associatedEvents" :key="event.id">
          {{ event.name }}
        </li>
      </ol>
    </section>
  </div>
</template>
<script setup lang="ts">
import { useFileStore } from '@/file-store';
import { type PathMusicNode, type Model } from '@/model';
import { computed, type PropType } from 'vue';
import TextInput from './controls/TextInput.vue';
import { createQuery } from '@/router/create-query';
const { requestedBinaryFiles } = useFileStore();

const props = defineProps<{
  node: PathMusicNode;
  model: Model;
}>();
const sourcesByBranches = computed(
  () => props.model.getSourceNodesByBranches(props.node.id).value
);
const associatedEvents = computed(
  () => props.model.getNodeAssociatedEvents(props.node.id).value
);
</script>
