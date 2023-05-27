<template>
  <div v-if="event">
    <div class="description">
      Tracks:
      <ol start="0">
        <li
          v-for="(track, i) in model.data.tracks"
          :key="i"
          :style="{ color: trackColors[i] }"
        >
          {{ track.path }}
        </li>
      </ol>
    </div>
    <EditableContent
      :editing="editing"
      :hideNewButton="true"
      :inputInvalid="!isInputEventIdValid"
      @update:ok="ok"
      @update:cancel="cancel"
      @update:editing="editing = $event"
    />
    <dl>
      <dt>Event</dt>
      <dl>
        <template v-if="!editing">{{ event.name }}</template
        ><template v-else>
          <TextInput type="text" v-model="event.name" long />
        </template>
      </dl>
      <dt>Id</dt>
      <dl>{{ event.id }}</dl>
      <dt>Action Count</dt>
      <dl :class="{ 'action-count-warning': actionCount >= 255 }">
        {{ actionCount }} / 255
      </dl>
    </dl>
    <EventActions
      :editing="editing"
      :colors="trackColors"
      v-model="event.actions"
    />
  </div>
</template>
<script setup lang="ts">
import { computed, inject, ref, watch } from 'vue';
import { copyEvent, countEventActions, modelKey } from '@/model';
import { useQueryNumberValue } from '@/composables/useQueryNumberValue';
import EventActions from '@/components/EventActions.vue';
import EditableContent from '@/components/controls/EditableContent.vue';
import TextInput from '@/components/controls/TextInput.vue';

const emit = defineEmits<{
  (type: 'wantFocus'): void;
}>();

const model = inject(modelKey)!;
if (!model) {
  throw new Error('model is not provided');
}
const currentEventId = useQueryNumberValue('event', -1);
const event = ref(createCopy());
const editing = ref(false);
const isInputEventIdValid = computed(() => {
  const newId = parseId(event.value?.name);
  if (isNaN(newId)) {
    return false;
  }
  if (newId <= 0 || newId > 0xffffff) {
    return false;
  }
  if (newId === event.value!.id) {
    // allowed if id is not changed
    return true;
  }
  // modify existing event id is not supported yet
  return false;
  // should not conflict with other existing event id
  // return !model.value.getEvent(newId);
});

const trackColors = computed(() => {
  const colors: string[] = [];
  const tracksCount = model.value.data.tracks.length;
  for (let i = 0; i < tracksCount; i++) {
    colors.push(`hsl(${(i * 360 + 450) / tracksCount}, 50%, 50%)`);
  }
  return colors;
});

const actionCount = computed(() => countEventActions(event.value!));

watch(
  [model, currentEventId],
  () => {
    // check if is valid event id
    if (model.value.getEvent(currentEventId.value)) {
      emit('wantFocus');
    }
    cancel();
    event.value = createCopy();
  },
  { immediate: true }
);

function ok() {
  if (event.value) {
    model.value.setEvent(event.value);
    event.value = createCopy();
  }
  editing.value = false;
}
function cancel() {
  event.value = createCopy();
  editing.value = false;
}
function createCopy() {
  const source = model.value.getEvent(currentEventId.value);
  return source ? copyEvent(source) : null;
}
function parseId(name?: string) {
  const match = name?.match(/_(0x[A-Fa-f0-9]+)$/);
  if (!match) {
    return NaN;
  }
  return parseInt(match[1]);
}
</script>
<style scoped>
.description {
  font-size: 80%;
  margin-bottom: 1em;
}
dl {
  display: grid;
  grid-template-columns: max-content auto;
  gap: 0 1em;
}
dt {
  font-weight: bold;
  grid-column-start: 1;
}
dd {
  grid-column-start: 2;
}
* {
  white-space: nowrap;
}
.action-count-warning {
  color: red;
}
</style>
