<template>
  <div v-if="event">
    <div class="description">
      Track id is displayed on the right side of action type.<br />
      For example: branchto<sup>1</sup>.<br />
      Newly created event actions have track id 0 by default.<br />
      So it's recommended to always use track 0.
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
    </dl>
    <EventActions :editing="editing" v-model="event.actions" />
  </div>
</template>
<script setup lang="ts">
import { computed, inject, ref, watch } from 'vue';
import { copyEvent, modelKey } from '@/model';
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
</style>
