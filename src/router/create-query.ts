import { useRoute } from 'vue-router';

export function createQuery(
  key: string,
  newValue?: number,
  defaultValue?: number
) {
  const route = useRoute();
  if (newValue === undefined || Number(newValue) === defaultValue) {
    const query = { ...route.query };
    delete query[key];
    return query;
  }

  return {
    ...route.query,
    [key]: newValue,
  };
}
