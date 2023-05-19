import { watch, type UnwrapRef, computed, ref, type Ref } from 'vue';

type AllowedType<T> = T & object extends UnwrapRef<T>
  ? UnwrapRef<T> extends T & object
    ? T & object
    : never
  : never;

type Prop<T> = { modelValue: AllowedType<T> };
type Emit<T> = (event: 'update:modelValue', value: AllowedType<T>) => void;

export function useFieldWrapper<T>(props: Prop<T>, emit: Emit<T>) {
  console.log('initial prop', props.modelValue);
  const localValue = ref({ ...props.modelValue }) as Ref<AllowedType<T>>;
  function buildComputed<K extends keyof T>(key: K) {
    return computed({
      get: () => localValue.value[key],
      set(newValue) {
        localValue.value[key] = newValue;
        emit('update:modelValue', { ...localValue.value });
      },
    });
  }
  watch(
    () => props.modelValue,
    (value) => (localValue.value = { ...value })
  );
  const result = {} as {
    [key in keyof T]: ReturnType<typeof buildComputed<key>>;
  };
  for (const key of Object.keys(localValue.value as {})) {
    result[key as keyof T] = buildComputed(key as keyof T);
  }
  return result;
}
