<template>
  <div>
    <template v-if="editing">
      <label class="margin-right">
        [tovolume
        <TextInput type="number" v-model="tovol" />]
      </label>
      <SelectOption
        class="margin-right"
        :choices="FadeTypes"
        v-model="id"
      ></SelectOption>
      <label class="margin-right">
        flip
        <TextInput type="number" v-model="flip" />
      </label>
      <TextInput type="number" v-model="ms" />ms
    </template>
    <template v-else>
      <span class="margin-right">tovolume {{ tovol }}</span>
      <span class="margin-right">{{ id }}</span>
      <span class="margin-right">flip {{ flip }}</span>
      <span>{{ ms }}ms</span>
    </template>
  </div>
</template>
<script setup lang="ts">
import { FadeTypes, type FadeAction } from '@/model';
import { useFieldWrapper } from '@/composables/useFieldWrappers';
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

const { tovol, id, flip, ms } = useFieldWrapper(props, emit);
</script>
<style scoped>
.margin-right {
  margin-right: 0.5em;
}
</style>
