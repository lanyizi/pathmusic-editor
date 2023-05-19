<template>
  <!-- list properties of PathMusicNode -->
  <div v-if="node">
    <EditableContent
      :editing="editing"
      @update:editing="editing = $event"
      @update:ok="ok"
      @update:cancel="cancel"
    />
    <div>Index: {{ node.id }}</div>
    <div>
      Music: {{ node.musicIndex }}
      <span v-if="musicFileName">[{{ musicFileName }}]</span>
    </div>
    <Suspense v-if="musicFileName">
      <MusicPlayer music-type="file" :musicId="musicFileName" />
      <template #fallback>Loading MusicPlayer</template>
    </Suspense>
    <section>
      <h2>Branches</h2>
      <ol>
        <li v-for="(branch, i) in node.branches" :key="i">
          <template v-if="editing">
            <label>
              controlmin
              <TextInput v-model="branch.controlmin" type="number" />
            </label>
            <br />
            <label>
              controlmax
              <TextInput v-model="branch.controlmax" type="number" />
            </label>
            <br />
            <label>
              destination
              <TextInput v-model="branch.dstnode" type="number" />
            </label>
          </template>
          <template v-else>
            <span>controlmin {{ branch.controlmin }}</span>
            <br />
            <span> controlmax {{ branch.controlmax }}</span>
            <br />
            <span>
              destination
              <RouterLink
                :to="{ query: createQuery('node', branch.dstnode) }"
                >{{ branch.dstnode }}</RouterLink
              >
            </span>
          </template>
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
import { copyNode, modelKey } from '@/model';
import { computed, ref, watch } from 'vue';
import TextInput from './controls/TextInput.vue';
import { createQuery } from '@/router/create-query';
import { useQueryNumberValue } from '@/composables/useQueryNumberValue';
import { inject } from 'vue';
import MusicPlayer from './controls/MusicPlayer.vue';
import EditableContent from './controls/EditableContent.vue';

const emit = defineEmits<{
  (type: 'wantFocus'): void;
}>();

const model = inject(modelKey)!;
if (!model) {
  throw new Error('model is not provided');
}
const currentNodeId = useQueryNumberValue('node', -1);
const sourcesByBranches = computed(() =>
  model.value.getSourceNodesByBranches(currentNodeId.value)
);
const associatedEvents = computed(() =>
  model.value.getNodeAssociatedEvents(currentNodeId.value)
);
const node = ref(createCopy());
watch(
  [model, currentNodeId],
  () => {
    if (model.value.data.nodes[currentNodeId.value]) {
      emit('wantFocus');
    }
    // obtain a fresh copy of the node
    node.value = createCopy();
  },
  { immediate: true }
);

const musicFileName = computed(() => {
  const musicIndex = node.value?.musicIndex ?? -1;
  return musicIndex > 0 ? `${musicIndex - 1}.mp3` : null;
});

const editing = ref(false);
function ok() {
  if (node.value) {
    model.value.setNode(node.value);
    node.value = createCopy();
  }
  editing.value = false;
}
function cancel() {
  node.value = createCopy();
  editing.value = false;
}
function createCopy() {
  const source = model.value.data.nodes[currentNodeId.value];
  if (!source) {
    return null;
  }
  return copyNode(source);
}
</script>
