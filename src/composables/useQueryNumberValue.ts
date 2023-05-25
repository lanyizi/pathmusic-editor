import { useCreateQuery } from '@/composables/useCreateQuery';
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

export function useQueryNumberValue(key: string, defaultValue: number) {
  const route = useRoute();
  const router = useRouter();
  const createQuery = useCreateQuery();

  return computed({
    get() {
      return route.query[key] ? Number(route.query[key]) : defaultValue;
    },
    set(newValue?: number) {
      router.push(createQuery(key, newValue, defaultValue));
    },
  });
}
