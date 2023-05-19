<template>
  <div>
    <template v-if="editing">
      <TextInput type="number" class="margin-right" v-model="node" />
      <!-- Always -1
      <label class="margin-right"
        >[{{ offsection }}<sub>offsection</sub>]</label
      >
      -->
      <label> <input type="checkbox" v-model="immediate" />immediate</label>
    </template>
    <template v-else>
      <label class="margin-right">
        <RouterLink
          v-if="isValidNode(node)"
          :to="{ query: createQuery('node', node) }"
        >
          {{ node }}
        </RouterLink>
        <span v-else>{{ node }}</span>
      </label>
      <!-- Always -1
      <label class="margin-right"
        >[{{ offsection }}<sub>offsection</sub>]</label
      >
      -->
      <label>
        <input type="checkbox" :checked="immediate" @click.prevent />immediate
      </label>
    </template>
  </div>
</template>
<script setup lang="ts">
import { type BranchToAction, modelKey } from '@/model';
import { createQuery } from '@/router/create-query';
import { useFieldWrapper } from '@/composables/useFieldWrappers';
import TextInput from '@/components/controls/TextInput.vue';
import { inject } from 'vue';

const model = inject(modelKey);
const props = defineProps<{
  modelValue: BranchToAction;
  editing: boolean;
}>();

const emit = defineEmits<{
  (event: 'update:modelValue', value: BranchToAction): void;
  (event: 'update:cancel'): void;
}>();
const { node, immediate } = useFieldWrapper(props, emit);
function isValidNode(node: number) {
  return !!model?.value.data.nodes[node];
}
</script>
<style scoped>
.margin-right {
  margin-right: 0.5em;
}
</style>
