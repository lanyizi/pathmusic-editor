<template>
  <ol>
    <li v-for="event in model.data.events" :key="event.name">
      <RouterLink :to="{ query: createQuery('event', event.id) }">
        {{ event.name }}
      </RouterLink>
    </li>
  </ol>
</template>
<script setup lang="ts">
import { modelKey } from '@/model';
import { useCreateQuery } from '@/composables/useCreateQuery';
import { inject } from 'vue';

const model = inject(modelKey);
if (!model) {
  throw new Error('model is not provided');
}
const createQuery = useCreateQuery();
</script>
