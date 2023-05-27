<template>
  <div>
    <h2>Builtin Variables</h2>
    <ul>
      <li v-for="(name, i) in RecognizedBuiltinVariables" :key="i">
        <span class="variable-name">{{ name }}</span>
        <h2>Associated Events</h2>
        <ul>
          <li v-for="event in specialValueAssociatedEvents[i]" :key="event.id">
            <router-link :to="{ query: { event: event.id } }">
              {{ event.name }}
            </router-link>
          </li>
          <li v-if="!specialValueAssociatedEvents[i].length">None</li>
        </ul>
      </li>
    </ul>
    <h2>Named Vairbales</h2>
    <EditableContent
      :editing="editing"
      @update:editing="editing = $event"
      @update:new="newVariable"
      @update:ok="ok"
      @update:cancel="cancel"
    />
    <ol>
      <li v-for="([name], i) in variables" :key="i">
        <span v-if="!editing" class="variable-name">{{
          name || '&lt;MISSING NAME&gt;'
        }}</span>
        <template v-else>
          <input v-model="variables[i][0]" />
          <button @click="removeVariable(i)">Remove</button>
        </template>
        <h2>Associated Events</h2>
        <ul>
          <li v-for="event in associatedEvents[i]" :key="event.id">
            <router-link :to="{ query: { event: event.id } }">
              {{ event.name }}
            </router-link>
          </li>
          <li v-if="!associatedEvents[i].length">None</li>
        </ul>
      </li>
    </ol>
  </div>
</template>
<script setup lang="ts">
import { computed, inject, ref, watch } from 'vue';
import {
  SetValueSpecialLeftValues,
  WaitTimeSpecialValues,
  copyVariables,
  modelKey,
} from '@/model';
import EditableContent from './controls/EditableContent.vue';

const RecognizedBuiltinVariables = ['PATH_RANDOMSHORT']
  .concat(SetValueSpecialLeftValues)
  .concat(WaitTimeSpecialValues);
const specialValueAssociatedEvents = computed(() => {
  return RecognizedBuiltinVariables.map((name) => {
    return model.value.getSpecialValueAssociatedEvents(name);
  });
});

const model = inject(modelKey)!;
if (!model) {
  throw new Error('model is not provided');
}
const variables = ref(createCopy());
const editing = ref(false);
const associatedEvents = computed(() => {
  return variables.value.map(([name]) => {
    return model.value.getVariableAssociatedEvents(name);
  });
});
watch(model, () => (variables.value = createCopy()), { immediate: true });

function newVariable() {
  model.value.setVariables([...variables.value, ['', 0]]);
  variables.value = createCopy();
}
function removeVariable(index: number) {
  const newVariables = [...variables.value];
  newVariables.splice(index, 1);
  variables.value = newVariables;
}
function ok() {
  model.value.setVariables(variables.value);
  variables.value = createCopy();
}
function cancel() {
  variables.value = createCopy();
}
function createCopy() {
  return copyVariables(model.value.data.variables);
}
</script>
<style scoped>
.variable-name {
  font-weight: bold;
}
h2 {
  font-size: medium;
}
</style>
