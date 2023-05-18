import TextInput from '@/components/controls/TextInput.vue';
import { mount } from '@vue/test-utils';
import { expect, test } from 'vitest';

test('TextInput', async () => {
  const wrapper = mount(TextInput, {
    props: {
      modelValue: 'test',
      type: 'text',
    },
  });
  // initial value of input should be the model value
  await wrapper.find('button').trigger('click');
  expect(wrapper.emitted('state')).toEqual([['editing']]);
  expect(
    wrapper.find<HTMLInputElement>('input[type="text"]').element.value
  ).toEqual('test');
  // set new input value
  await wrapper
    .find<HTMLInputElement>('input[type="text"]')
    .setValue('new-value');
  expect(
    wrapper.find<HTMLInputElement>('input[type="text"]').element.value
  ).toEqual('new-value');
  // model value should not change for now
  expect(wrapper.props().modelValue).toEqual('test');
  // update the model value from outside
  await wrapper.setProps({ modelValue: 'new-value-2' });
  // input value should be reset
  expect(
    wrapper.find<HTMLInputElement>('input[type="text"]').element.value
  ).toEqual('new-value-2');
  // submit new value
  await wrapper
    .find<HTMLInputElement>('input[type="text"]')
    .setValue('new-value-3');
  // component have a debounce of 300ms
  await new Promise((resolve) => setTimeout(resolve, 300 * 1.5));
  await wrapper.find('button').trigger('click');
  expect(wrapper.emitted('state')).toEqual([['editing'], ['normal']]);
  expect(wrapper.emitted('update:modelValue')).toEqual([['new-value-3']]);
});
