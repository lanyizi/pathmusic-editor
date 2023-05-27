<template>
  <div>
    <template v-if="editing">
      <label>
        lowest
        <TextInput type="number" v-model="lowest" />
      </label>
      <label v-if="typeof millisecs === 'number'">
        <TextInput type="number" v-model="millisecs" />ms
      </label>
      <SelectOption
        v-else
        :choices="WaitTimeSpecialValues"
        v-model="millisecs"
      />
      <laebl>
        <input type="checkbox" v-model="isSpecial" />
        Special
      </laebl>
    </template>
    <template v-else>
      <span class="margin-right">lowest {{ lowest }}</span>
      <span
        >{{ millisecs
        }}<template v-if="typeof millisecs === 'number'">ms</template></span
      >
    </template>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue';
import { type WaitTimeAction, WaitTimeSpecialValues } from '@/model';
import { useFieldWrapper } from '@/composables/useFieldWrappers';
import SelectOption from '@/components/controls/SelectOption.vue';
import TextInput from '@/components/controls/TextInput.vue';

const props = defineProps<{
  modelValue: WaitTimeAction;
  editing: boolean;
}>();

const emit = defineEmits<{
  (event: 'update:modelValue', value: WaitTimeAction): void;
  (event: 'update:cancel'): void;
}>();

const { lowest, millisecs } = useFieldWrapper(props, emit);
const isSpecial = computed({
  get: () =>
    typeof millisecs.value !== 'number' &&
    WaitTimeSpecialValues.includes(millisecs.value),
  set: (value) => {
    if (value) {
      if (
        typeof millisecs.value === 'number' ||
        !WaitTimeSpecialValues.includes(millisecs.value)
      ) {
        millisecs.value = WaitTimeSpecialValues[0];
      }
    } else {
      millisecs.value = lowest.value;
    }
  },
});
</script>
<style scoped>
.margin-right {
  margin-right: 0.5em;
}
</style>
