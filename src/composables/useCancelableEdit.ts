import { ref, watch, type UnwrapRef } from 'vue';

type AllowedType<T> = T extends UnwrapRef<T>
  ? UnwrapRef<T> extends T
    ? T
    : never
  : never;

type Prop<T> = { modelValue: AllowedType<T> };
type EmitValue<T> = (event: 'update:modelValue', value: AllowedType<T>) => void;
type EmitCancel = (event: 'update:cancel') => void;
type Emit<T> = EmitValue<T> & EmitCancel;
type Clone<T> = (value: AllowedType<T>) => AllowedType<T>;

export function useCancelableEdit<T>(
  props: Prop<T>,
  emit: Emit<T>,
  clone: Clone<T>
) {
  const localValue = ref<T>(clone(props.modelValue));
  watch(
    () => props.modelValue,
    (value) => (localValue.value = clone(value)),
    { deep: true }
  );
  return {
    localValue,
    edit() {
      emit('update:modelValue', localValue.value as AllowedType<T>);
    },
    cancel() {
      localValue.value = clone(props.modelValue);
      emit('update:cancel');
    },
  };
}
