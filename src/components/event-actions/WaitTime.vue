<template>
  <div>
    <template v-if="editing">
      <label>
        lowest
        <TextInput type="number" v-model="lowest" />
      </label>
      <label>
        <TextInput type="number" :disabled="useRandom" v-model="millisecs" />ms
      </label>
      <laebl>
        <input type="checkbox" v-model="useRandom" />
        time to next node
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
import { type WaitTimeAction } from '@/model';
import { useFieldWrapper } from '@/composables/useFieldWrappers';
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
const useRandom = computed({
  get: () => millisecs.value === 'PATH_TIMETONEXTNODE',
  set: (value) => {
    if (value) {
      millisecs.value = 'PATH_TIMETONEXTNODE';
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
