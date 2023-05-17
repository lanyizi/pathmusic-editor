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
import { useFileStore, type PendingReadTask } from '@/file-store';

const emit = defineEmits(['file-loaded']);

const dropZone = ref<HTMLElement>(null as unknown as HTMLElement);
const {
  requestedTextFiles,
  requestedBinaryFiles,
  requestedResets,
  requestedTextSaves,
  requestedBinarySaves,
} = useFileStore();
const requiredFileList = computed(() =>
  (requestedTextFiles.value as PendingReadTask<any>[])
    .concat(requestedBinaryFiles.value)
    .map((file) => file.path)
);
interface AvailableFile {
  path: string;
  file: File;
}
const availableFilesList = ref<AvailableFile[]>([]);

watchEffect(() => {
  for (const resetRequest of requestedResets.value) {
    availableFilesList.value = [];
    resetRequest.resolve(Promise.resolve());
  }
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
  for (const requestedTextSave of requestedTextSaves.value) {
    download(requestedTextSave.data, requestedTextSave.path, 'text/plain');
    requestedTextSave.resolve(Promise.resolve());
  }
  for (const requestedBinarySave of requestedBinarySaves.value) {
    download(
      requestedBinarySave.data,
      requestedBinarySave.path,
      'application/octet-stream'
    );
    requestedBinarySave.resolve(Promise.resolve());
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

// https://stackoverflow.com/a/30832210/4399840
function download(data: BlobPart, filename: string, type: string) {
  const file = new Blob([data], { type });
  const navigator = window.navigator as Navigator & {
    msSaveOrOpenBlob?: (blob: Blob, filename: string) => void;
  };
  if (navigator.msSaveOrOpenBlob) {
    // IE10+
    navigator.msSaveOrOpenBlob(file, filename);
  } else {
    // Others
    const a = document.createElement('a');
    const url = URL.createObjectURL(file);
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 0);
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
