<template>
  <div v-if="event">
    <dl>
      <dt>Event</dt>
      <dl>{{ event.name }}</dl>
      <dt>Id</dt>
      <dl>{{ event.id }}</dl>
    </dl>
    <EventActions v-model="event.actions" :model="model" />
  </div>
</template>
<script setup lang="ts">
import { useQueryNumberValue } from '@/composables/useQueryNumberValue';
import { copyEvent, modelKey } from '@/model';
import { inject, ref, watch } from 'vue';
import EventActions from './EventActions.vue';

const emit = defineEmits<{
  (type: 'wantFocus'): void;
}>();

const model = inject(modelKey)!;
if (!model) {
  throw new Error('model is not provided');
}
const currentEventId = useQueryNumberValue('event', -1);
const event = ref(createCopy());
watch(
  currentEventId,
  () => {
    // check if is valid event id
    if (model.value.getEvent(currentEventId.value)) {
      console.log('valid event id, want focus');
      emit('wantFocus');
    }
    event.value = createCopy();
  },
  { immediate: true }
);
watch(
  event,
  (newValue, oldValue) => {
    if (newValue && newValue === oldValue) {
      // If new value is the same instance of old value, but it has changed,
      // then it's changed by us, so we need to update the model.
      // Otherwise, it's changed by the previous watcher (which watches currentEventId),
      // so we don't need to update the model.
      model.value.setEvent(newValue);
    }
  },
  { deep: true }
);

function createCopy() {
  const source = model.value.getEvent(currentEventId.value);
  return source ? copyEvent(source) : null;
}
</script>
<style scoped>
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
</style>
