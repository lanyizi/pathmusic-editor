<template>
  <section>
    <span class="action-title">Actions</span>
    <ol>
      <li v-for="(action, i) in props.modelValue" :key="i">
        <dl>
          <dt>Type</dt>
          <dl>{{ action.type }}</dl>
          <template v-if="action.type === PathMusicActionType.BranchTo">
            <dt>Destination</dt>
            <dl>
              <RouterLink
                v-if="isValidNode(action.node)"
                :to="{ query: createQuery('node', action.node) }"
              >
                {{ action.node }}
              </RouterLink>
              <template v-else>{{ action.node }}</template>
            </dl>
            <dt>OffSection</dt>
            <dl>{{ action.ofsection }}</dl>
            <dt>Immediate</dt>
            <dl>{{ action.immediate }}</dl>
          </template>
          <template v-else-if="'condition' in action">
            <dt>Condition</dt>
            <dl>{{ action.condition }}</dl>
          </template>
          <template v-else-if="'data' in action">
            <dt>Data</dt>
            <dl>{{ action.data }}</dl>
          </template>
        </dl>
        <template v-if="'actions' in action">
          <EventActions v-model="action.actions" :model="props.model" />
        </template>
      </li>
    </ol>
  </section>
</template>
<script setup lang="ts">
import { PathMusicActionType, type PathMusicAction, type Model } from '@/model';
import { createQuery } from '@/router/create-query';

const props = defineProps<{
  model: Model;
  modelValue: PathMusicAction[];
}>();

function isValidNode(node: number) {
  return !!props.model.data.nodes[node];
}
</script>
<style scoped>
.action-title {
  font-weight: bold;
}
dl {
  display: grid;
  grid-template-columns: max-content auto;
  gap: 0 1em;
}
dt {
  font-weight: bold;
  grid-column-start: 1;
}
dd {
  grid-column-start: 2;
}
</style>
