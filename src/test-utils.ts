import { mount } from '@vue/test-utils';

export function withSetup<T, U>(composable: () => T, innerComposable: () => U) {
  let result: T = null as any;
  let innerResult: U = null as any;
  const childComponent = {
    setup() {
      innerResult = innerComposable();
    },
    template: `<div />`,
  };
  const app = mount({
    setup() {
      result = composable();
    },
    components: {
      childComponent,
    },
    template: `<child-component />`,
  });
  // return the result and the app instance
  // for testing provide / unmount
  return { app, result, innerResult };
}
