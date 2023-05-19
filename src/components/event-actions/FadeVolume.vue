<template>
  <EditableContent
    :editing="props.editing"
    :showButtons="false"
    @update:ok="edit"
    @update:cancel="cancel"
  >
    <template #edit>
      <label>
        To Volume
        <TextInput type="number" v-model="localValue.tovol" />
      </label>
      <SelectOption :choices="FadeTypes" v-model="localValue.id"></SelectOption>
      <label>
        Flip
        <TextInput type="number" v-model="localValue.flip" />
      </label>
      <label>
        Time
        <TextInput type="number" v-model="localValue.ms" />ms
      </label>
    </template>
    <template #display>
      <span>To Volume {{ localValue.tovol }}</span>
      <span>{{ localValue.id }}</span>
      <span>Flip {{ localValue.flip }}</span>
      <span>Time {{ localValue.ms }}ms</span>
    </template>
  </EditableContent>
</template>
<script setup lang="ts">
import { useCancelableEdit } from '@/composables/useCancelableEdit';
import { copyEventAction, type FadeAction } from '@/model';
import EditableContent from '@/components/controls/EditableContent.vue';
import TextInput from '@/components/controls/TextInput.vue';
import SelectOption from '@/components/controls/SelectOption.vue';

const props = defineProps<{
  modelValue: FadeAction;
  editing: boolean;
}>();

const emit = defineEmits<{
  (event: 'update:modelValue', value: FadeAction): void;
  (event: 'update:cancel'): void;
}>();

const FadeTypes = [
  'PATH_FADE_LINEAR',
  'PATH_FADE_EQPOWER',
  'PATH_FADE_EXPONENTIAL',
  'PATH_FADE_COSINE',
];

const { localValue, edit, cancel } = useCancelableEdit(props, emit, (action) =>
  copyEventAction(action)
);
</script>
