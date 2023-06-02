<template>
  <div>
    <EditableContent
      class="control"
      :hideNewButton="true"
      :editing="editing"
      :editButtonText="'Edit'"
      @update:editing="editing = $event"
      @update:ok="submitJson"
      @update:cancel="cancel"
    />
    <br />
    <div class="sticky-container">
      <JsonEditorVue
        v-for="(_, i) in data"
        :key="i"
        class="json jse-theme-dark"
        :readOnly="!editing"
        v-model="data[i]"
      />
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, watch } from 'vue';
import 'vanilla-jsoneditor/themes/jse-theme-dark.css';
import JsonEditorVue from 'json-editor-vue';
import { copyPathMusicAudio, type PathMusicAudio } from '@/audio';
import { useAudioPlayer } from '@/audio-player';
import EditableContent from '@/components/controls/EditableContent.vue';

const audioPlayer = useAudioPlayer();
const editing = ref(false);
const data = ref<(PathMusicAudio[] | string)[]>(getAudioData());

watch(audioPlayer.audioData, () => {
  data.value = getAudioData();
});

function getAudioData() {
  return audioPlayer.audioData.value.map((x) => x.map(copyPathMusicAudio));
}
function submitJson() {
  try {
    audioPlayer.audioData.value = data.value.map((x) =>
      typeof x === 'string' ? JSON.parse(x) : x
    );
  } catch (e) {
    console.error(e);
    alert(e);
    editing.value = true;
  }
}
function cancel() {
  data.value = getAudioData();
}
</script>
<style scoped>
.control {
  position: fixed;
  z-index: 100;
}
.json {
  height: 70vh;
}
</style>
