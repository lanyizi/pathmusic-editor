<template>
  <span>
    <template v-if="!props.editing">
      <button key="New" class="edit-button" @click="create">New</button>
      <button key="Edit" class="edit-button" @click="edit">Edit</button>
    </template>
    <template v-else>
      <button class="edit-button" key="Ok" @click="ok">OK</button>
      <button class="edit-button" key="Cancel" @click="cancel">Cancel</button>
    </template>
  </span>
</template>
<script setup lang="ts">
const props = defineProps<{
  editing: boolean;
}>();
const emit = defineEmits<{
  (event: 'update:new'): void;
  (event: 'update:editing', value: boolean): void;
  (event: 'update:ok'): void;
  (event: 'update:cancel'): void;
  (event: 'update:remove'): void;
}>();
function create() {
  emit('update:new');
}
function edit() {
  emit('update:editing', true);
}
function ok() {
  emit('update:editing', false);
  emit('update:ok');
}
function cancel() {
  emit('update:editing', false);
  emit('update:cancel');
}
</script>
<style scoped>
.edit-button {
  margin-right: 0.5em;
}
</style>
