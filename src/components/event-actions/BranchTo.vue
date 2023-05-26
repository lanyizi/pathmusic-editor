<template>
  <div>
    <template v-if="editing">
      <TextInput type="number" v-model="node" />
      <!-- Always -1
      <label
        >[{{ offsection }}<sub>offsection</sub>]</label
      >
      -->
      <label class="margin-left"
        ><input type="checkbox" v-model="immediate" />immediate</label
      >
    </template>
    <template v-else>
      <label>
        <RouterLink
          v-if="isValidNode"
          :class="{ warning: invalidTrack }"
          :to="{ query: createQuery('node', node) }"
        >
          {{ node }}
        </RouterLink>
        <span v-else>{{ node }}</span>
      </label>
      <!-- Always -1
      <label
        >[{{ offsection }}<sub>offsection</sub>]</label
      >
      -->
      <label class="margin-left">
        <input type="checkbox" :checked="immediate" @click.prevent />immediate
      </label>
    </template>
    <span v-if="invalidTrack" class="margin-left warning">⚠Track Mismatch</span>
  </div>
</template>
<script setup lang="ts">
import { computed, inject } from 'vue';
import { type BranchToAction, modelKey } from '@/model';
import { useCreateQuery } from '@/composables/useCreateQuery';
import { useFieldWrapper } from '@/composables/useFieldWrappers';
import TextInput from '@/components/controls/TextInput.vue';

const model = inject(modelKey);
const props = defineProps<{
  modelValue: BranchToAction;
  editing: boolean;
}>();

const emit = defineEmits<{
  (event: 'update:modelValue', value: BranchToAction): void;
  (event: 'update:cancel'): void;
}>();
const createQuery = useCreateQuery();
const { node, immediate } = useFieldWrapper(props, emit);
const nodeObject = computed(() => model?.value.data.nodes[node.value]);
const isValidNode = computed(() => !!nodeObject.value);
const invalidTrack = computed(
  () => nodeObject.value && props.modelValue.track !== nodeObject.value.trackID
);
</script>
<style scoped>
.margin-left {
  margin-left: 0.5em;
}
.warning {
  color: red;
}
</style>
