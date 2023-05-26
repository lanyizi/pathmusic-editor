<template>
  <section>
    <span class="action-title">Actions</span>
    <!-- for add new event action-->
    <template v-if="props.editing">
      <template v-if="addingNewAction">
        <SelectOption
          :choices="mapComponentTypeKeys"
          v-model="newActionChoice"
        />
        <TrackSelectOption v-model="newActionTrack" />
      </template>
      <EditableContent
        :editing="addingNewAction"
        :hideNewButton="true"
        :editButtonText="'Add'"
        @update:editing="addingNewAction = $event"
        @update:ok="newItem"
      />
    </template>
    <ol>
      <li v-for="(action, i) in props.modelValue" :key="i">
        <span class="action-title" :style="getActionColor(action)">{{
          action.type
        }}</span>
        <component
          v-if="mapComponentType[action.type]"
          :is="mapComponentType[action.type]"
          class="action-body"
          :editing="props.editing"
          :modelValue="action"
          @update:modelValue="editItem(i, $event)"
        />
        <span v-else class="action-body"
          ><template v-if="action.type !== PathMusicActionType.Else"
            >[Unknown_{{ action.type }}]</template
          ></span
        >
        <template v-if="props.editing">
          <span class="margin-left"></span>
          <button
            v-if="props.editing"
            :disabled="i === 0"
            @click="moveItem(i, -1)"
          >
            ↑
          </button>
          <button
            v-if="props.editing"
            :disabled="i === props.modelValue.length - 1"
            @click="moveItem(i, +1)"
          >
            ↓
          </button>
          <button v-if="props.editing" @click="removeItem(i)">Remove</button>
        </template>
        <template v-if="'actions' in action">
          <EventActions
            class="nested-actions-block"
            :editing="props.editing"
            :modelValue="action.actions"
            :colors="props.colors"
            @update:modelValue="editItem(i, { ...action, actions: $event })"
          />
        </template>
      </li>
    </ol>
  </section>
</template>
<script setup lang="ts">
import {
  createEventAction,
  modelKey,
  PathMusicActionType,
  type PathMusicAction,
} from '@/model';
import { inject, ref, watch, type Component } from 'vue';
import BranchTo from '@/components/event-actions/BranchTo.vue';
import CalculateValue from '@/components/event-actions/CalculateValue.vue';
import ConditionCheck from '@/components/event-actions/ConditionCheck.vue';
import FadeVolume from '@/components/event-actions/FadeVolume.vue';
import SetValue from '@/components/event-actions/SetValue.vue';
import WaitTime from '@/components/event-actions/WaitTime.vue';
import EditableContent from '@/components/controls/EditableContent.vue';
import SelectOption from '@/components/controls/SelectOption.vue';
import TrackSelectOption from '@/components/TrackSelectOption.vue';

const model = inject(modelKey)!;
if (!model) {
  throw new Error('model is not provided');
}

const props = defineProps<{
  modelValue: PathMusicAction[];
  editing: boolean;
  colors: string[];
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
const mapComponentTypeKeys = Object.keys(
  mapComponentType
) as PathMusicActionType[];

const addingNewAction = ref(false);
const newActionChoice = ref(PathMusicActionType.BranchTo);
const newActionTrack = ref(0);
// reset addingNewAction when editing is changed
watch(
  () => props.editing,
  () => (addingNewAction.value = false),
  { immediate: true }
);

function getActionColor(action: PathMusicAction) {
  const color = props.colors[action.track ?? -1];
  return color ? { color } : {};
}

function newItem() {
  const newAction = createEventAction(
    newActionChoice.value as PathMusicActionType,
    model.value
  );
  newAction.track = newActionTrack.value;
  const newValue = [...props.modelValue, newAction];
  emit('update:modelValue', newValue);
}
function moveItem(i: number, offset: number) {
  const newValue = [...props.modelValue];
  const [item] = newValue.splice(i, 1);
  newValue.splice(i + offset, 0, item);
  emit('update:modelValue', newValue);
}
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
.margin-left {
  margin-left: 2em;
}
</style>
