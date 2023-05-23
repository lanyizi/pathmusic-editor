<template>
  <!-- list properties of PathMusicNode -->
  <div>
    <EditableContent
      :editing="editing"
      :hide-edit-button="!node"
      @update:editing="editing = $event"
      @update:ok="ok"
      @update:cancel="cancel"
    />
    <template v-if="node">
      <div>Index: {{ node.id }}</div>
      <label v-if="editing">
        Music
        <TextInput v-model="node.musicIndex" type="number" />
      </label>
      <div v-else>
        Music {{ node.musicIndex }}
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
              <span>controlmax {{ branch.controlmax }}</span>
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
        <ul v-if="!sourcesByBranches.length">
          <li>None</li>
        </ul>
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
        <ul v-if="!associatedEvents.length">
          <li>None</li>
        </ul>
      </section>
      <section>
        <h2>Other data</h2>
        <dl>
          <!--  trackID: 0, sectionID: 0, repeat: 0, routerID: 0, numbranches: 1, beats: 1, bars: 1, partID: 0, notes: 0 -->
          <dt>Track</dt>
          <dd>{{ node.trackID }}</dd>
          <dt>Section</dt>
          <dd>{{ node.sectionID }}</dd>
          <dt>Repeat</dt>
          <dd>{{ node.repeat }}</dd>
          <dt>Router</dt>
          <dd>{{ node.routerID }}</dd>
          <dt>Beats</dt>
          <dd>{{ node.beats }}</dd>
          <dt>Bars</dt>
          <dd>{{ node.bars }}</dd>
          <dt>Part</dt>
          <dd>{{ node.partID }}</dd>
          <dt>Notes</dt>
          <dd>{{ node.notes }}</dd>
        </dl>
      </section>
    </template>
  </div>
</template>
<script setup lang="ts">
import { computed, inject, ref, watch } from 'vue';
import { copyNode, modelKey } from '@/model';
import { createQuery } from '@/router/create-query';
import { useQueryNumberValue } from '@/composables/useQueryNumberValue';
import EditableContent from '@/components/controls/EditableContent.vue';
import MusicPlayer from '@/components/controls/MusicPlayer.vue';
import TextInput from '@/components/controls/TextInput.vue';

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
  const trackIndex = node.value?.trackID ?? NaN;
  const musicIndex = node.value?.musicIndex ?? NaN;
  return musicIndex > 0 ? `track${trackIndex}.${musicIndex - 1}.mp3` : null;
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
<style scoped>
hr {
  margin: 1em 0;
  /* border: navy; */
  border: none;
  border-bottom: 1px solid var(--color-link);
}

dl {
  display: grid;
  grid-template-columns: max-content 1fr;
  grid-gap: 0 1em;
}
dt::before {
  content: '>';
  margin-right: 0.5em;
}
</style>
