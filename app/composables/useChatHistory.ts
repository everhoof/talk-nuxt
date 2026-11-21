import {

  nextTick,
  onBeforeUnmount,
  reactive,
  ref,
} from 'vue';
import {
  Message,
  MessageState,
} from '~/types/message';
import type { FetchDirection } from '~/stores/messages';

const PAGE_SIZE = 100;

export function useChatHistory() {
  const session = useSessionScope();
  const messagesStore = useMessagesStore();
  const store = messagesStore;
  const loading = reactive({ older: false, newer: false });
  const errors = reactive({ older: false, newer: false, latest: false });
  const loadingLatest = ref(false);
  const navigating = ref(false);
  let generation = 0;

  async function load(direction: FetchDirection): Promise<void> {
    const hasMore = direction === 'older' ? store.hasOlderMessages : store.hasNewerMessages;
    if (!hasMore || loading[direction] || loadingLatest.value || navigating.value) return;
    // The API paginates by ID, independently of display dates and optimistic IDs.
    const current = store.rawMessages.filter((message) => message.state === MessageState.DELIVERED);
    const cursor = current.reduce<Message | undefined>((edge, message) => {
      if (!edge) return message;
      return (direction === 'older' ? message.id < edge.id : message.id > edge.id) ? message : edge;
    }, undefined);
    if (!cursor) return;
    const version = generation;
    const auth = session.capture();
    const variables = { count: PAGE_SIZE, reverse: direction === 'older', lastId: cursor.id };
    loading[direction] = true;
    errors[direction] = false;
    try {
      const messages = await store.fetchMessages(variables);
      if (version !== generation || !session.isCurrent(auth)) return;
      if (!messages) {
        errors[direction] = true;
        return;
      }
      store.pushMessages({ variables, messages });
      store.setPagination({ direction, value: messages.length >= PAGE_SIZE });
      await nextTick();
    } finally {
      if (version === generation) loading[direction] = false;
    }
  }

  async function loadLatest(): Promise<boolean> {
    if (loadingLatest.value || navigating.value) return false;
    const version = ++generation;
    const auth = session.capture();
    loading.older = loading.newer = false;
    errors.older = errors.newer = errors.latest = false;
    loadingLatest.value = true;
    try {
      // No lastId: include the newest delivered message as well as its history.
      const messages = await store.fetchMessages({ count: PAGE_SIZE, reverse: true });
      if (version !== generation || !session.isCurrent(auth)) return false;
      if (!messages) {
        errors.latest = true;
        return false;
      }
      store.replaceMessages(messages.map((message) => new Message(message)));
      store.setPagination({ direction: 'older', value: messages.length >= PAGE_SIZE });
      store.setPagination({ direction: 'newer', value: false });
      return true;
    } finally {
      if (version === generation) loadingLatest.value = false;
    }
  }

  async function loadAround(message: Message): Promise<boolean> {
    if (navigating.value || loadingLatest.value) return false;
    const version = ++generation;
    const auth = session.capture();
    loading.older = loading.newer = false;
    errors.older = errors.newer = errors.latest = false;
    navigating.value = true;
    try {
      const [older, newer] = await Promise.all([
        store.fetchMessages({ count: 50, fromDateTime: message.createdAt, reverse: true }),
        store.fetchMessages({ count: 50, fromDateTime: message.createdAt, reverse: false }),
      ]);
      if (version !== generation || !session.isCurrent(auth)) return false;
      if (!older || !newer) {
        errors.latest = true;
        return false;
      }
      const messages = new Map([...older, ...newer].map((item) => [item.id, new Message(item)]));
      messages.set(message.id, message);
      store.replaceMessages(Array.from(messages, ([, value]) => value));
      store.setPagination({ direction: 'older', value: older.length >= 50 });
      store.setPagination({ direction: 'newer', value: newer.length >= 50 });
      return true;
    } finally {
      if (version === generation) navigating.value = false;
    }
  }

  onBeforeUnmount(() => generation++);
  return {
    loading, errors, loadingLatest, navigating, load, loadLatest, loadAround,
  };
}
