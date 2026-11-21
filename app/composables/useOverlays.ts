import {
  markRaw,
  shallowRef,
} from 'vue';
import type { Component } from 'vue';
import type { NuxtApp } from '#app';

interface ModalEntry {
  name: string;
  component: Component | string;
  props: Record<string, unknown>;
  events: { closed?: () => void; 'before-close'?: (event: unknown) => void };
}

const instances = new WeakMap<NuxtApp, ReturnType<typeof createOverlays>>();

export function useOverlays() {
  const app = useNuxtApp();
  let overlays = instances.get(app);
  if (!overlays) {
    overlays = createOverlays();
    instances.set(app, overlays);
  }
  return overlays;
}

function createOverlays() {
  const modals = shallowRef<ModalEntry[]>([]);
  const notices = shallowRef<{ id: number; message: string }[]>([]);
  let nextId = 0;
  const hide = (name: string) => {
    const entry = modals.value.find((modal) => modal.name === name);
    modals.value = modals.value.filter((modal) => modal.name !== name);
    entry?.events['before-close']?.({});
    entry?.events.closed?.();
  };
  return {
    modals,
    notices,
    modal: {
      show(
        component: Component | string,
        props: Record<string, unknown> = {},
        options: { name?: string; width?: string; height?: string } = {},
        events: ModalEntry['events'] = {},
      ) {
        modals.value = [
          ...modals.value,
          {
            name: options.name || `modal-${++nextId}`,
            component: typeof component === 'string' ? component : markRaw(component),
            props,
            events,
          },
        ];
      },
      hide,
    },
    notify: {
      dismiss(id: number) { notices.value = notices.value.filter((notice) => notice.id !== id); },
      error(message: string) {
        const id = ++nextId;
        notices.value = [...notices.value, { id, message }];
      },
    },
  };
}
