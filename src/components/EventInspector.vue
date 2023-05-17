<template>
  <div v-if="event">
    <dl>
      <dt>Event</dt>
      <dl>{{ event.name }}</dl>
      <dt>Id</dt>
      <dl>{{ event.id }}</dl>
    </dl>
    <EventActions v-model="event.actions" :model="props.model" />
  </div>
</template>
<script setup lang="ts">
import { useQueryNumberValue } from '@/composables/useQueryNumberValue';
import { type Model, copyEvent } from '@/model';
import { ref, watch } from 'vue';
import EventActions from './EventActions.vue';

const props = defineProps<{
  model: Model;
}>();
const currentEventId = useQueryNumberValue('event', -1);
const event = ref(createCopy());
watch(currentEventId, () => {
  event.value = createCopy();
});
watch(
  event,
  (newValue, oldValue) => {
    if (newValue && newValue === oldValue) {
      // If new value is the same instance of old value, but it has changed,
      // then it's changed by us, so we need to update the model.
      // Otherwise, it's changed by the previous watcher (which watches currentEventId),
      // so we don't need to update the model.
      props.model.setEvent(newValue);
    }
  },
  { deep: true }
);

function createCopy() {
  const source = props.model.getEvent(currentEventId.value);
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
