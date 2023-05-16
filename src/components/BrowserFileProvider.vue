<template>
  <div
    class="drop-zone"
    ref="dropZone"
    @dragover="handleDragOver"
    @drop="handleFileDrop"
  >
    Drop files here<br />
    Required files:
    <ul>
      <li v-for="file in requiredFileList" :key="file">
        {{ file }}
      </li>
    </ul>
    Available files:
    <ul>
      <li v-for="file in availableFilesList" :key="file.path">
        {{ file.path }}
      </li>
    </ul>
  </div>
</template>
<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue';
import { useFileStore, type PendingTask } from '@/file-store';

const emit = defineEmits(['file-loaded']);

const dropZone = ref<HTMLElement>(null as unknown as HTMLElement);
const { requestedTextFiles, requestedBinaryFiles } = useFileStore();
const requiredFileList = computed(() =>
  (requestedTextFiles.value as PendingTask<any>[])
    .concat(requestedBinaryFiles.value)
    .map((file) => file.path)
);
interface AvailableFile {
  path: string;
  file: File;
}
const availableFilesList = ref<AvailableFile[]>([]);

watchEffect(() => {
  for (const available of availableFilesList.value) {
    for (const requested of requestedTextFiles.value) {
      if (requested.path == available.path) {
        requested.resolve(available.file.text());
      }
    }
    for (const requested of requestedBinaryFiles.value) {
      if (requested.path == available.path) {
        requested.resolve(available.file.arrayBuffer());
      }
    }
  }
});

function handleDragOver(event: DragEvent) {
  event.preventDefault();
  // Add CSS styles to indicate the drop zone is active
  dropZone.value.classList.add('drag-over');
}

function handleFileDrop(event: DragEvent) {
  event.preventDefault();
  // Remove CSS styles indicating active drop zone
  dropZone.value.classList.remove('drag-over');

  const files = event.dataTransfer?.files;
  if (files) {
    emit('file-loaded');
    // Process the dropped files (e.g., upload, preview, etc.)
    handleFiles(files);
  }
}

function handleFiles(files: FileList) {
  // Process each file individually
  for (const file of files) {
    // Perform necessary operations (e.g., upload, read, etc.)
    availableFilesList.value = [
      ...availableFilesList.value,
      {
        path: file.name,
        file,
      },
    ];
  }
}
</script>
<style scoped>
.drop-zone {
  border: 4px dashed var(--color-border);
}

.drag-over {
  background-color: var(--color-background-soft);
}
</style>
