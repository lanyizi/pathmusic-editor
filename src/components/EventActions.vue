<template>
  <section>
    <span class="action-title">Actions</span>
    <ol>
      <li v-for="(action, i) in props.modelValue" :key="i">
        <span class="action-title">{{ action.type }}</span>
        <template v-if="mapComponentType[action.type]">
          <component
            :is="mapComponentType[action.type]"
            :modelValue="action"
            @update:modelValue="edit(i, $event)"
          />
        </template>
        <template v-if="'actions' in action">
          <EventActions
            class="nested-actions-block"
            v-model="action.actions"
            :model="props.model"
          />
        </template>
      </li>
    </ol>
  </section>
</template>
<script setup lang="ts">
import { PathMusicActionType, type PathMusicAction, type Model } from '@/model';
import BranchTo from '@/components/event-actions/BranchTo.vue';
import CalculateValue from '@/components/event-actions/CalculateValue.vue';
import ConditionCheck from '@/components/event-actions/ConditionCheck.vue';
import FadeVolume from '@/components/event-actions/FadeVolume.vue';
import SetValue from '@/components/event-actions/SetValue.vue';
import WaitTime from '@/components/event-actions/WaitTime.vue';
import type { Component } from 'vue';

const props = defineProps<{
  model: Model;
  modelValue: PathMusicAction[];
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

function edit(i: number, value: PathMusicAction) {
  const newValue = [...props.modelValue];
  newValue[i] = value;
  emit('update:modelValue', newValue);
}
</script>
<style scoped>
.action-title {
  font-weight: bold;
}
li {
  display: grid;
  grid-template-columns: auto auto;
  grid-template-rows: auto auto;
  gap: 0 1em;
}
.nested-actions-block {
  grid-column: 1 / 3;
}
</style>
