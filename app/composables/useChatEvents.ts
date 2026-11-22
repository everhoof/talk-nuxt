import mitt from 'mitt';
import type { Emitter } from 'mitt';
import type { NuxtApp } from '#app';
import type { Message } from '~/types/message';
import type { MentionEvent } from '~/stores/messages';

// eslint-disable-next-line ts/consistent-type-definitions -- mitt's Record constraint requires a type alias.
type ChatEvents = {
  'close-context-menus': void;
  'file-drag': DragEvent;
  'force-scroll': void;
  mention: MentionEvent;
  'private-chat-help': string;
  'show-message': Message;
  'start-message-edit': Message;
  'visible-polls-changed': number[];
};

const emitters = new WeakMap<NuxtApp, Emitter<ChatEvents>>();

export function useChatEvents(): Emitter<ChatEvents> {
  const app = useNuxtApp();
  let events = emitters.get(app);
  if (!events) {
    events = mitt<ChatEvents>();
    emitters.set(app, events);
  }
  return events;
}
