import { useRoute } from 'vue-router';

export function useCreateQuery() {
  const route = useRoute();
  return (key: string, newValue?: number, defaultValue?: number) => {
    if (newValue === undefined || Number(newValue) === defaultValue) {
      const query = { ...route.query };
      delete query[key];
      return query;
    }

    return {
      ...route.query,
      [key]: newValue,
    };
  };
}
