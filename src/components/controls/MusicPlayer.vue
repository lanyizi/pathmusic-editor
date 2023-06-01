<template>
  <div>
    <div v-if="musicDescription">{{ musicDescription }}</div>
    <div class="music-player">
      <button @click="toggle">Play/Stop</button>
      <input
        type="range"
        min="0"
        :max="musicLength"
        step="0.1"
        v-model="musicProgress"
      />
      <span>{{ musicProgress.toFixed(1) }} / {{ musicLength.toFixed(1) }}</span>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useAudioPlayer } from '@/audio-player';
import { computed } from 'vue';
import { onUnmounted } from 'vue';
import { ref, watch } from 'vue';

const props = defineProps<{
  track: number;
  musicId: number;
}>();
const emit = defineEmits<{
  (event: 'finished'): void;
}>();
const { getAudio, getAudioNode } = useAudioPlayer();
const musicSource = ref<AudioBufferSourceNode>(
  await getAudioNode(props.track, props.musicId)
);
const musicDescription = computed(() => {
  try {
    return JSON.stringify(getAudio(props.track, props.musicId));
  } catch (e) {
    return undefined;
  }
});
const musicLength = computed(() => musicSource.value?.buffer?.duration ?? 1);
const musicStartTime = ref(0);
const musicStartOffset = ref(0);
const isPlaying = ref(false);
const musicProgressValue = ref(0);
const musicProgress = computed({
  get: () => Math.min(musicProgressValue.value, musicLength.value),
  set(time) {
    time = Number(time);
    if (isNaN(time)) {
      time = 0;
    }
    musicProgressValue.value = Math.min(time, musicLength.value);
    if (isPlaying.value) {
      stop();
      play(musicProgressValue.value);
    }
  },
});
const playingIntervalId = ref<number | NodeJS.Timer>();

onUnmounted(() => stop());
watch(
  () => [props.track, props.musicId] as const,
  async () => {
    stop();
    musicSource.value = await getAudioNode(props.track, props.musicId);
    musicProgress.value = 0;
  }
);
async function toggle() {
  if (isPlaying.value) {
    stop();
  } else {
    await play(musicProgressValue.value);
  }
}
async function play(offset: number) {
  stop();
  musicSource.value = await getAudioNode(props.track, props.musicId);
  musicSource.value.loop = false;
  musicSource.value.onended = () => {
    stop();
    emit('finished');
  };
  musicStartTime.value = musicSource.value.context.currentTime;
  musicStartOffset.value = offset;
  playingIntervalId.value = setInterval(updateProgress, 100);
  musicSource.value.start(0, musicProgressValue.value);
  isPlaying.value = true;
}
function stop() {
  if (isPlaying.value) {
    musicSource.value.stop();
    musicSource.value.disconnect();
    isPlaying.value = false;
    clearInterval(playingIntervalId.value);
    playingIntervalId.value = undefined;
  }
}
function updateProgress() {
  const timeElapsed =
    musicSource.value.context.currentTime - musicStartTime.value;
  musicProgressValue.value = musicStartOffset.value + timeElapsed;
}
</script>
<style scoped>
.music-player {
  display: flex;
  align-items: center;
}
</style>
