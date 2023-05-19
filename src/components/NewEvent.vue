<!-- No completed yet -->
<template>
  <div>
    <template v-if="editState === 'normal'">
      <button :disabled="eventCountReachedLimit">Create New Event</button>
      <span :class="{ limit: eventCountReachedLimit }"
        >Number of events: {{ eventCount }}</span
      >
    </template>
    <template v-else>
      <label>
        Name
        <TextInput
          type="text"
          :modelValue="name"
          @update:modelValue="updateModelValue"
          @update:cancel="cancel"
        />
      </label>
      <br />
      <span v-if="isNaN(id)">Id {{ id }}</span>
      <span v-else-if="alreadyExists">Id {{ id }} already exists</span>
      <span v-else>Name must end with _ and hexadecimal number</span>
    </template>
  </div>
</template>
<script setup lang="ts">
import TextInput from '@/components/controls/TextInput.vue';
import type { Model } from '@/model';
import { computed, ref } from 'vue';

const props = defineProps<{
  model: Model;
}>();
const eventCount = computed(() => props.model.data.events.length);
const eventCountReachedLimit = computed(() => eventCount.value >= 255);

const editState = ref<'normal' | 'editing'>('normal');
const name = ref('');
const id = computed(() => getNumber(name.value));
const alreadyExists = computed(
  () => props.model.getEvent(name.value) ?? props.model.getEvent(id.value)
);

function updateModelValue(value: string) {
  name.value = value;
  if (isNaN(id.value)) {
    editState.value = 'editing';
    return;
  }
  if (alreadyExists.value) {
    editState.value = 'editing';
    return;
  }
  props.model.addEvent({
    name: name.value,
    id: id.value,
    actions: [],
  });
  editState.value = 'normal';
}

function cancel() {
  name.value = '';
}

function getNumber(value: string) {
  const lastPart = `${value.split('_').pop()}`;
  if (!lastPart.toLowerCase().startsWith('0x')) {
    return NaN;
  }
  const result = parseInt(lastPart, 16);
  return result >= 0 && result <= 0xffffffff ? result : NaN;
}
</script>
<style scoped>
.limit {
  color: red;
}
</style>
