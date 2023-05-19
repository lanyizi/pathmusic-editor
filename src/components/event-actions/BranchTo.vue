<template>
  <EditableContent
    :editing="props.editing"
    :showButtons="false"
    @update:ok="edit"
    @update:cancel="cancel"
  >
    <template #edit>
      <label>
        To
        <TextInput type="number" v-model="localValue.node" />
      </label>
      <label>
        OffSection
        <TextInput type="number" v-model="localValue.ofsection" />
      </label>
      <label>
        Immediate
        <input type="checkbox" v-model="localValue.immediate" />
      </label>
    </template>
    <template #display>
      <label>
        To
        <RouterLink
          v-if="isValidNode(localValue.node)"
          :to="{ query: createQuery('node', localValue.node) }"
        >
          {{ localValue.node }}
        </RouterLink>
        <span v-else>{{ localValue.node }}</span>
      </label>
      <label>
        OffSection
        {{ localValue.ofsection }}
      </label>
      <label>
        Immediate
        <input type="checkbox" :checked="localValue.immediate" @click.prevent />
      </label>
    </template>
  </EditableContent>
</template>
<script setup lang="ts">
import { copyEventAction, type BranchToAction, modelKey } from '@/model';
import { useCancelableEdit } from '@/composables/useCancelableEdit';
import { createQuery } from '@/router/create-query';
import EditableContent from '@/components/controls/EditableContent.vue';
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

const { localValue, edit, cancel } = useCancelableEdit(props, emit, (action) =>
  copyEventAction(action)
);

function isValidNode(node: number) {
  return !!model?.value.data.nodes[node];
}
</script>
