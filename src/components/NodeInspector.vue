<template>
  <!-- list properties of PathMusicNode -->
  <div v-if="node">
    <div>Index: {{ node.id }}</div>
    <div>
      Music: {{ node.musicIndex }}
      <span v-if="musicFileName">[{{ musicFileName }}]</span>
    </div>
    <section>
      <h2>Branches</h2>
      <ol>
        <li v-for="(branch, i) in node.branches" :key="i">
          <label>
            ControlMin
            <TextInput v-model="branch.controlmin" type="number" />
          </label>
          <br />
          <label>
            ControlMax
            <TextInput v-model="branch.controlmax" type="number" />
          </label>
          <br />
          <label>
            Destination
            <TextInput v-model="branch.dstnode" type="number">
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
          <RouterLink :to="{ query: createQuery('node', fromNode.id) }">
            {{ fromNode.id }}
          </RouterLink>
        </li>
      </ol>
    </section>
    <section>
      <h2>Associated Events</h2>
      <ol>
        <li v-for="event in associatedEvents" :key="event.id">
          <RouterLink :to="{ query: createQuery('event', event.id) }">
            {{ event.name }}
          </RouterLink>
        </li>
      </ol>
    </section>
  </div>
</template>
<script setup lang="ts">
import { useFileStore } from '@/file-store';
import { type Model, copyNode } from '@/model';
import { computed, ref, watch } from 'vue';
import TextInput from './controls/TextInput.vue';
import { createQuery } from '@/router/create-query';
import { useQueryNumberValue } from '@/composables/useQueryNumberValue';
const { requestedBinaryFiles } = useFileStore();

const props = defineProps<{
  model: Model;
}>();
const currentNodeId = useQueryNumberValue('node', -1);
const sourcesByBranches = computed(() =>
  props.model.getSourceNodesByBranches(currentNodeId.value)
);
const associatedEvents = computed(() =>
  props.model.getNodeAssociatedEvents(currentNodeId.value)
);
const node = ref(createCopy());
watch(currentNodeId, () => {
  // obtain a fresh copy of the node
  node.value = createCopy();
});
watch(
  node,
  (newValue, oldValue) => {
    if (newValue && newValue === oldValue) {
      // If new value is the same instance of old value, but it has changed,
      // then it's changed by us, so we need to update the model.
      // Otherwise, it's changed by the previous watcher (which watches currentNodeId),
      // so we don't need to update the model.
      props.model.setNode(newValue);
    }
  },
  { deep: true }
);

const musicFileName = computed(() => {
  const musicIndex = node.value?.musicIndex ?? -1;
  return musicIndex > 0 ? `${musicIndex - 1}.mp3` : null;
});

function createCopy() {
  const source = props.model.data.nodes[currentNodeId.value];
  if (!source) {
    return null;
  }
  return copyNode(source);
}
</script>
