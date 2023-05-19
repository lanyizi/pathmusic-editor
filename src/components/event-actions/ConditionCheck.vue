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
        :choices="Comparisons"
        v-model="localValue.comparison"
      ></SelectOption>
      <TextInput type="number" v-model="localValue.right" />
    </template>
    <template #display>
      <span>{{ localValue.left }}</span>
      <span>{{ localValue.comparison }}</span>
      <span>{{ localValue.right }}</span>
    </template>
  </EditableContent>
</template>
<script setup lang="ts">
import {
  Comparisons,
  copyEventAction,
  type ElseIfAction,
  type IfAction,
} from '@/model';
import { useCancelableEdit } from '@/composables/useCancelableEdit';
import EditableContent from '@/components/controls/EditableContent.vue';
import SelectOption from '@/components/controls/SelectOption.vue';
import TextInput from '@/components/controls/TextInput.vue';

type ConditionCheck = IfAction | ElseIfAction;
const props = defineProps<{
  modelValue: ConditionCheck;
  editing: boolean;
}>();

const emit = defineEmits<{
  (event: 'update:modelValue', value: ConditionCheck): void;
  (event: 'update:cancel'): void;
}>();

const { localValue, edit, cancel } = useCancelableEdit(props, emit, (action) =>
  copyEventAction(action)
);
</script>
