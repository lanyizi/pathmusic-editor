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
    <div class="sticky-container" v-for="(_, i) in texts" :key="i">
      <p class="json" :contenteditable="editing" @input="setText(i, $el)">
        {{ texts[i] }}
      </p>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, watch } from 'vue';
import { useAudioPlayer } from '@/audio-player';
import EditableContent from './controls/EditableContent.vue';

const audioPlayer = useAudioPlayer();
const editing = ref(false);
const texts = ref(getSourceText());

watch(audioPlayer.audioData, () => {
  texts.value = getSourceText();
});

function getSourceText() {
  return audioPlayer.audioData.value.map((x) => JSON.stringify(x, null, 2));
}
function setText(i: number, target: HTMLParagraphElement) {
  texts.value[i] = target.innerText;
}
function submitJson() {
  try {
    audioPlayer.audioData.value = texts.value.map((t) => JSON.parse(t));
  } catch (e) {
    console.error(e);
    alert(e);
  }
}
function cancel() {
  texts.value = getSourceText();
}
</script>
<style scoped>
.control {
  position: fixed;
}
.json {
  font-family: 'Cascadia Code', Consolas, monospace;
  white-space: pre;
}
</style>
