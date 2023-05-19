<template>
  <EditableContent
    :editing="props.editing"
    :showButtons="false"
    @update:ok="edit"
    @update:cancel="cancel"
  >
    <template #edit>
      <TextInput type="text" v-model="localValue.left" />
      <SelectOption
        :choices="Operators"
        v-model="localValue.operator"
      ></SelectOption>
      <TextInput type="number" v-model="localValue.right" />
    </template>
    <template #display>
      <span>{{ localValue.left }}</span>
      <span>{{ localValue.operator }}</span>
      <span>{{ localValue.right }}</span>
    </template>
  </EditableContent>
</template>
<script setup lang="ts">
import { useCancelableEdit } from '@/composables/useCancelableEdit';
import { copyEventAction, Operators, type CalculateAction } from '@/model';
import EditableContent from '@/components/controls/EditableContent.vue';
import TextInput from '@/components/controls/TextInput.vue';

const props = defineProps<{
  modelValue: CalculateAction;
  editing: boolean;
}>();

const emit = defineEmits<{
  (event: 'update:modelValue', value: CalculateAction): void;
  (event: 'update:cancel'): void;
}>();

const { localValue, edit, cancel } = useCancelableEdit(props, emit, (action) =>
  copyEventAction(action)
);
</script>
