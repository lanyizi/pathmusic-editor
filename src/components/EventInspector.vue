<template>
  <div v-if="event">
    <div class="description">
      Track id is displayed at the right side of action type.<br />
      For example: branchto<sup>1</sup>.<br />
      Newly created event actions have track id 0 by default.<br />
      So it's recommended to always use track 0.
    </div>
    <EditableContent
      :editing="editing"
      @update:ok="ok"
      @update:cancel="cancel"
      @update:editing="editing = $event"
    >
    </EditableContent>
    <dl>
      <dt>Event</dt>
      <dl>{{ event.name }}</dl>
      <dt>Id</dt>
      <dl>{{ event.id }}</dl>
    </dl>
    <EventActions :editing="editing" v-model="event.actions" />
  </div>
</template>
<script setup lang="ts">
import { useQueryNumberValue } from '@/composables/useQueryNumberValue';
import { copyEvent, modelKey } from '@/model';
import { inject, ref, watch } from 'vue';
import EventActions from './EventActions.vue';
import EditableContent from './controls/EditableContent.vue';

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
</style>
