<template>
  <!-- list properties of PathMusicNode -->
  <div>
    <!--
      To be implemented: automatically play the next node when the current node finishes
      <label><input type="checkbox" v-model="followNode" />Follow Node</label>
    -->
    <EditableContent
      :editing="editing"
      :hide-edit-button="!node"
      @update:editing="editing = $event"
      @update:new="newNode"
      @update:ok="ok"
      @update:cancel="cancel"
    />
    <template v-if="node">
      <dl>
        <dt>Index</dt>
        <dd>{{ node.id }}</dd>
        <dt>Track</dt>
        <dd v-if="editing">
          <TrackSelectOption v-model="node.trackID" />
        </dd>
        <dd v-else>{{ model.data.tracks[node.trackID].path }}</dd>
        <dt>Music</dt>
        <dd v-if="editing">
          <TextInput v-model="node.musicIndex" type="number" />
        </dd>
        <dd v-else>
          {{ node.musicIndex }}
        </dd>
      </dl>
      <Suspense v-if="node.musicIndex > 0">
        <MusicPlayer :track="node.trackID" :musicId="node.musicIndex - 1" />
        <template #fallback>Loading MusicPlayer</template>
      </Suspense>
      <section>
        <h2>Branches</h2>
        <span class="branch-control">
          <LimitedCount :current="node.branches.length" :errorThreshold="31" />
          <button v-if="editing" @click="addBranch">Add</button>
        </span>
        <ol>
          <li v-for="(branch, i) in node.branches" :key="i">
            <dl>
              <dt>destination</dt>
              <dd v-if="editing">
                <TextInput v-model="branch.dstnode" type="number" />
                <button @click="removeBranch(i)">Remove</button>
              </dd>
              <dd v-else>
                <RouterLink
                  :to="{ query: createQuery('node', branch.dstnode) }"
                  >{{ branch.dstnode }}</RouterLink
                >
              </dd>
              <dt>controlmin</dt>
              <dd v-if="editing">
                <TextInput v-model="branch.controlmin" type="number" />
              </dd>
              <dd v-else>{{ branch.controlmin }}</dd>
              <dt>controlmax</dt>
              <dd v-if="editing">
                <TextInput v-model="branch.controlmax" type="number" />
              </dd>
              <dd v-else>{{ branch.controlmax }}</dd>
            </dl>
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
import { useCreateQuery } from '@/composables/useCreateQuery';
import { useQueryNumberValue } from '@/composables/useQueryNumberValue';
import EditableContent from '@/components/controls/EditableContent.vue';
import LimitedCount from './controls/LimitedCount.vue';
import MusicPlayer from '@/components/controls/MusicPlayer.vue';
import TextInput from '@/components/controls/TextInput.vue';
import TrackSelectOption from '@/components/TrackSelectOption.vue';

const emit = defineEmits<{
  (type: 'wantFocus'): void;
}>();

const model = inject(modelKey)!;
if (!model) {
  throw new Error('model is not provided');
}
const createQuery = useCreateQuery();
// const followNode = ref(false); TODO: automatically play the next node when the current node finishes
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

const editing = ref(false);
function newNode() {
  currentNodeId.value = model.value.addNode(-1, 0);
}
function addBranch() {
  node?.value?.branches.push({ controlmin: 0, controlmax: 127, dstnode: 0 });
}
function removeBranch(index: number) {
  node?.value?.branches.splice(index, 1);
}
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
  grid-row: span 2;
  display: grid;
  grid-template-columns: max-content 1fr;
  grid-gap: 0 1em;
}

.branch-control {
  display: flex;
  align-items: center;
  gap: 1em;
}
</style>
