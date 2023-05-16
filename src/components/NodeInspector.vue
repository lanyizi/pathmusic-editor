<template>
  <!-- list properties of PathMusicNode -->
  <div>
    <div>Index: {{ props.node.id }}</div>
    <div>
      Music: {{ props.node.musicIndex }}
      <span v-if="musicFileName">[{{ musicFileName }}]</span>
    </div>
    <section>
      <h2>Branches</h2>
      <ol>
        <li v-for="(branch, i) in props.node.branches" :key="i">
          <label>
            ControlMin
            <TextInput v-model="branch.controlmin" />
          </label>
          <br />
          <label>
            ControlMax
            <TextInput v-model="branch.controlmax" />
          </label>
          <br />
          <label>
            Destination
            <TextInput v-model="branch.dstnode">
              <RouterLink
                :to="{ query: createQuery('node', branch.dstnode) }"
                >{{ branch.dstnode }}</RouterLink
              >
            </TextInput>
          </label>
        </li>
      </ol>
    </section>
    <section>
      <h2>From</h2>
      <ol>
        <li v-for="fromNode in sourcesByBranches" :key="fromNode.id">
          <RouterLink :to="{ query: createQuery('node', fromNode.id) }">{{
            fromNode.id
          }}</RouterLink>
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

const musicFileName = computed(() =>
  props.node.musicIndex > 0 ? `${props.node.musicIndex - 1}.mp3` : null
);
</script>
