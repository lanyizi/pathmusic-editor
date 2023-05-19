<template>
  <div>
    <div>
      <slot v-if="props.editing" name="edit"></slot>
      <slot v-else name="display"></slot>
    </div>
    <template v-if="showButtons">
      <button
        v-if="!props.editing"
        key="Edit"
        class="edit-button"
        @click="edit"
      >
        Edit
      </button>
      <template v-else>
        <button class="edit-button" key="Ok" @click="ok">OK</button>
        <button class="edit-button" key="Cancel" @click="cancel">Cancel</button>
      </template>
    </template>
  </div>
</template>
<script setup lang="ts">
const props = defineProps<{
  editing: boolean;
  showButtons: boolean;
}>();
const emit = defineEmits<{
  (event: 'update:editing', value: boolean): void;
  (event: 'update:ok'): void;
  (event: 'update:cancel'): void;
}>();

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
  margin-left: 0.5em;
}
</style>
