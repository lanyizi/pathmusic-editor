<template>
  <EditableContent
    :editing="props.editing"
    :showButtons="false"
    @update:ok="edit"
    @update:cancel="cancel"
  >
    <template #edit>
      <TextInput type="text" v-model="localValue.left" />
      =
      <TextInput
        type="number"
        :disabled="useRandom"
        v-model="localValue.right"
      />
      <label>
        <input type="checkbox" v-model="useRandom" />
        Random
      </label>
    </template>
    <template #display>
      <span>{{ localValue.left }}</span>
      <span>=</span>
      <span>{{ localValue.right }}</span>
    </template>
  </EditableContent>
</template>
<script setup lang="ts">
import { computed } from 'vue';
import { useCancelableEdit } from '@/composables/useCancelableEdit';
import { copyEventAction, type SetValueAction } from '@/model';
import EditableContent from '@/components/controls/EditableContent.vue';
import TextInput from '@/components/controls/TextInput.vue';

const props = defineProps<{
  modelValue: SetValueAction;
  editing: boolean;
}>();

const emit = defineEmits<{
  (event: 'update:modelValue', value: SetValueAction): void;
  (event: 'update:cancel'): void;
}>();

const { localValue, edit, cancel } = useCancelableEdit(props, emit, (action) =>
  copyEventAction(action)
);
const useRandom = computed({
  get: () => localValue.value.right === 'PATH_RANDOMSHORT',
  set: (value) => {
    if (value) {
      localValue.value.right = 'PATH_RANDOMSHORT';
    } else {
      localValue.value.right = 0;
    }
  },
});
</script>
