<template>
  <EditableContent
    :editing="props.editing"
    :showButtons="false"
    @update:ok="edit"
    @update:cancel="cancel"
  >
    <template #edit>
      <label>
        Lowest
        <TextInput type="number" v-model="localValue.lowest" />
      </label>
      <label>
        Time
        <TextInput
          type="number"
          :disabled="useRandom"
          v-model="localValue.millisecs"
        />ms
      </label>
      <laebl>
        <input type="checkbox" v-model="useRandom" />
        Time to next node
      </laebl>
    </template>
    <template #display>
      <span>Lowest {{ localValue.lowest }}</span>
      <span>Time {{ localValue.millisecs }}</span>
    </template>
  </EditableContent>
</template>
<script setup lang="ts">
import { computed } from 'vue';
import { useCancelableEdit } from '@/composables/useCancelableEdit';
import { copyEventAction, type WaitTimeAction } from '@/model';
import EditableContent from '@/components/controls/EditableContent.vue';
import TextInput from '@/components/controls/TextInput.vue';

const props = defineProps<{
  modelValue: WaitTimeAction;
  editing: boolean;
}>();

const emit = defineEmits<{
  (event: 'update:modelValue', value: WaitTimeAction): void;
  (event: 'update:cancel'): void;
}>();

const { localValue, edit, cancel } = useCancelableEdit(props, emit, (action) =>
  copyEventAction(action)
);
const useRandom = computed({
  get: () => localValue.value.millisecs === 'PATH_TIMETONEXTNODE',
  set: (value) => {
    if (value) {
      localValue.value.millisecs = 'PATH_TIMETONEXTNODE';
    } else {
      localValue.value.millisecs = localValue.value.lowest;
    }
  },
});
</script>
