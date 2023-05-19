<template>
  <section>
    <span class="action-title">Actions</span>
    <ol>
      <li v-for="(action, i) in props.modelValue" :key="i">
        <span class="action-title">{{ action.type }}</span>
        <component
          v-if="mapComponentType[action.type]"
          :is="mapComponentType[action.type]"
          class="action-body"
          :editing="props.editing"
          :modelValue="action"
          @update:modelValue="editItem(i, $event)"
        />
        <span v-else class="action-body">[Unknown_{{ action.type }}]</span>
        <button v-if="props.editing" @click="removeItem(i)">Remove</button>
        <template v-if="'actions' in action">
          <EventActions
            class="nested-actions-block"
            :editing="props.editing"
            :modelValue="action.actions"
            @update:modelValue="editItem(i, { ...action, actions: $event })"
          />
        </template>
      </li>
    </ol>
  </section>
</template>
<script setup lang="ts">
import { PathMusicActionType, type PathMusicAction } from '@/model';
import { type Component } from 'vue';
import BranchTo from '@/components/event-actions/BranchTo.vue';
import CalculateValue from '@/components/event-actions/CalculateValue.vue';
import ConditionCheck from '@/components/event-actions/ConditionCheck.vue';
import FadeVolume from '@/components/event-actions/FadeVolume.vue';
import SetValue from '@/components/event-actions/SetValue.vue';
import WaitTime from '@/components/event-actions/WaitTime.vue';

const props = defineProps<{
  modelValue: PathMusicAction[];
  editing: boolean;
}>();

const emit = defineEmits<{
  (event: 'update:modelValue', value: PathMusicAction[]): void;
}>();

const mapComponentType: Partial<Record<PathMusicActionType, Component>> = {
  [PathMusicActionType.BranchTo]: BranchTo,
  [PathMusicActionType.Calculate]: CalculateValue,
  [PathMusicActionType.If]: ConditionCheck,
  [PathMusicActionType.ElseIf]: ConditionCheck,
  [PathMusicActionType.Fade]: FadeVolume,
  [PathMusicActionType.SetValue]: SetValue,
  [PathMusicActionType.WaitTime]: WaitTime,
};

function editItem(i: number, value: PathMusicAction) {
  const newValue = [...props.modelValue];
  newValue[i] = value;
  emit('update:modelValue', newValue);
}
function removeItem(i: number) {
  const newValue = [...props.modelValue];
  newValue.splice(i, 1);
  emit('update:modelValue', newValue);
}
</script>
<style scoped>
.action-title {
  font-weight: bold;
  margin-right: 0.5em;
}
li {
  grid-template-rows: auto auto;
  gap: 0 1em;
}
.action-body {
  display: inline-block;
}
</style>
