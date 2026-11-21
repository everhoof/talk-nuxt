import { defineStore } from 'pinia';
import {

  reactive,
  toRefs,
  computed,
} from 'vue';
import { DateTime } from 'luxon';
import {
  Message,
  MessageState,
  MessageType,
} from '~/types/message';
import type {
  DeleteMessageMutation,
  DeleteMessageMutationVariables,
  GetActivePollsQuery,
  GetChatDataQuery,
  GetChatDataQueryVariables,
  GetMessagesQuery,
  GetMessagesQueryVariables,
} from '~/graphql/schema';
import GetChatData from '~/graphql/queries/get-chat-data.graphql';
import GetMessages from '~/graphql/queries/get-messages.graphql';
import GetActivePolls from '~/graphql/queries/get-active-polls.graphql';
import DeleteMessage from '~/graphql/mutations/delete-message.graphql';
import { mergeMessages } from '~/tools/message-list';
import { trackTabActivity } from '~/tools/tab-activity';

const state = () => ({
  rawMessages: [] as Message[],
  activePolls: [] as Message[],
  pollServerTimeOffset: 0,
  unreadCount: 0 as number,
  atLatest: true,
  lastDeliveredId: null as null | number,
  hasOlderMessages: true,
  hasNewerMessages: false,
});
export interface MentionEvent {
  id: number;
  username: string;
}
export type FetchDirection = 'older' | 'newer';
export const useMessagesStore = defineStore('messages', () => {
  const authStore = useAuthStore();
  const events = useChatEvents();
  const { client } = useGraphql();
  const router = useRouter();
  const storeState = reactive(state());
  const session = useSessionScope();
  const knownPolls = new Map<number, Message>();
  let tabActivity: ReturnType<typeof trackTabActivity> | undefined;
  const messages = computed(() =>
    [...storeState.rawMessages].toSorted((a, b) => b.createdAtMillis - a.createdAtMillis));

  function replaceMessages(payload: Message[]) {
    const ids = new Set(payload.map(({ id }) => id));
    const randomIds = new Set(payload.map(({ randomId }) => randomId).filter(Boolean));
    storeState.rawMessages = mergeMessages(storeState.rawMessages, payload)
      .filter((message) => ids.has(message.id) || !!(message.randomId && randomIds.has(message.randomId)));
    reconcilePolls(payload);
  }

  function clearPollData() {
    storeState.activePolls = [];
    knownPolls.clear();
    for (const message of storeState.rawMessages) {
      message.poll = null;
    }
  }

  function prependMessage(payload: Message) {
    prependMessages([payload]);
    return storeState.rawMessages.length;
  }

  function appendMessage(payload: Message) {
    appendMessages([payload]);
    return storeState.rawMessages.length;
  }

  function prependMessages(payload: Message[]) {
    storeState.rawMessages = mergeMessages(storeState.rawMessages, payload, 'start');
    reconcilePolls(payload);
  }

  function appendMessages(payload: Message[]) {
    storeState.rawMessages = mergeMessages(storeState.rawMessages, payload, 'end');
    reconcilePolls(payload);
  }

  function reconcilePolls(payload: Message[]) {
    const incoming = payload.filter(({ type }) => type === MessageType.POLL);
    if (!incoming.length) return;
    const visiblePolls = [...storeState.rawMessages, ...storeState.activePolls]
      .filter(({ type }) => type === MessageType.POLL);
    const current = mergeMessages(Array.from(knownPolls, ([, message]) => message), visiblePolls);
    const records = mergeMessages(current, incoming);
    for (const message of records) knownPolls.set(message.id, message);
    storeState.activePolls = records.filter((message) => message.poll && !message.poll.isClosed && !message.deletedAt)
      .toSorted((a, b) => a.id - b.id);
    const time = storeState.activePolls[0]?.poll?.serverTime;
    if (time) storeState.pollServerTimeOffset = Date.parse(time) - Date.now();
  }

  function receiveMessages(payload: Message[]) {
    const ids = new Set(storeState.rawMessages.map(({ id }) => id));
    const randomIds = new Set(storeState.rawMessages.map(({ randomId }) => randomId).filter(Boolean));
    const visible = storeState.hasNewerMessages
      ? payload.filter((message) => ids.has(message.id) || !!(message.randomId && randomIds.has(message.randomId)))
      : payload;
    storeState.rawMessages = mergeMessages(storeState.rawMessages, visible);
    reconcilePolls(payload);
  }

  function upsertMessage(payload: Message) {
    receiveMessages([payload]);
  }

  function removePendingMessage(payload: string) {
    if (storeState.rawMessages.length === 0) return;
    const index = storeState.rawMessages.findIndex(({ randomId, state }) =>
      randomId === payload && state === MessageState.SENT);
    if (index === -1) return;
    storeState.rawMessages.splice(index, 1);
  }

  function incrementUnread(count: number = 1) {
    return (storeState.unreadCount += count);
  }

  function resetUnread() {
    return (storeState.unreadCount = 0);
  }

  function isReadingLatest(): boolean {
    return (
      import.meta.client
        && storeState.atLatest
        && !storeState.hasNewerMessages
        && (tabActivity?.isActive() ?? true)
        && document.visibilityState === 'visible'
        && document.hasFocus()
    );
  }

  function markLatestRead() {
    if (isReadingLatest()) resetUnread();
  }

  function setAtLatest(value: boolean) {
    storeState.atLatest = value;
    markLatestRead();
  }

  function setPagination(payload: { direction: FetchDirection; value: boolean }) {
    if (payload.direction === 'older') storeState.hasOlderMessages = payload.value;
    else storeState.hasNewerMessages = payload.value;
  }

  function setLastDeliveredId(payload: number) {
    return (storeState.lastDeliveredId = payload);
  }

  async function loadInitialData() {
    await Promise.all([fetchBaseData(), fetchActivePolls()]);
  }

  const stream = useMessageStream({
    cursor: () => storeState.lastDeliveredId,
    receive: (messages) => receiveMessages(messages.map((message) => new Message(message))),
    created(messages) {
      const last = messages[0];
      if (last) storeState.lastDeliveredId = Math.max(storeState.lastDeliveredId ?? 0, last.id);
      const unread = messages.filter(({ type }) =>
        [MessageType.GENERAL, MessageType.DONATION, MessageType.POLL].includes(type));
      if (unread.length && !isReadingLatest()) incrementUnread(unread.length);
    },
    refresh: fetchActivePolls,
    invalidate() {
      clearPollData();
      storeState.rawMessages = storeState.rawMessages.filter((message) => message.state === MessageState.DELIVERED
        && (!message.deletedAt || authStore.can.readAny('deleted-message').granted));
    },
  });
  let live = false;
  function startLiveUpdates() {
    if (live) return;
    live = true;
    tabActivity = trackTabActivity(markLatestRead);
    stream.start();
  }

  function stopLiveUpdates() {
    stream.stop();
    tabActivity?.dispose();
    tabActivity = undefined;
    live = false;
  }

  async function fetchActivePolls() {
    const version = session.capture();
    try {
      const { data, errors } = await client.query<GetActivePollsQuery>({ query: GetActivePolls });
      if (errors || !data || !session.isCurrent(version)) return;
      reconcilePolls(data.getActivePolls.map((message) => new Message(message)));
    } catch {}
  }

  async function fetchBaseData() {
    const version = session.capture();
    let variables: GetChatDataQueryVariables = {};
    setPagination({ direction: 'newer', value: false });
    if (router.currentRoute.value.query.from) {
      const datetime = DateTime.fromISO(router.currentRoute.value.query.from.toString());
      if (datetime.isValid) {
        variables = {
          fromDateTime: datetime.toISO(),
          reverse: true,
        };
        setPagination({ direction: 'newer', value: true });
      }
    }
    const { data, errors } = await client.query<GetChatDataQuery, GetChatDataQueryVariables>({
      query: GetChatData,
      variables,
    });
    if (errors || !data || !session.isCurrent(version)) return;
    const messages = data.messages.map((message) => new Message(message));
    replaceMessages(messages);
    setPagination({ direction: 'older', value: messages.length > 0 });
    const lastMessage = data.lastMessages[0];
    if (lastMessage) {
      setLastDeliveredId(lastMessage.id);
    }
  }

  async function fetchMessages(payload?: GetMessagesQueryVariables): Promise<GetMessagesQuery['getMessages'] | undefined> {
    const version = session.capture();
    try {
      const { data, errors } = await client.query<GetMessagesQuery, GetMessagesQueryVariables>({
        query: GetMessages,
        variables: payload,
        fetchPolicy: 'no-cache',
      });
      if (errors || !data || !session.isCurrent(version)) return;
      return data.getMessages;
    } catch {}
  }

  function pushMessages(payload: {
    variables: GetMessagesQueryVariables;
    messages: GetMessagesQuery['getMessages'];
  }): void {
    const messages = payload.messages.map((message) => new Message(message));
    if (payload.variables?.reverse) {
      appendMessages(messages);
    } else {
      prependMessages(messages);
    }
  }

  async function deleteMessage(payload: DeleteMessageMutationVariables) {
    const version = session.capture();
    try {
      const { data, errors } = await client.mutate<DeleteMessageMutation, DeleteMessageMutationVariables>({
        mutation: DeleteMessage,
        variables: payload,
      });
      if (errors || !data?.deleteMessage || !session.isCurrent(version)) return;
      upsertMessage(new Message(data.deleteMessage));
    } catch {}
  }

  function mention(payload: MentionEvent) {
    events.emit('mention', payload);
  }

  return {
    ...toRefs(storeState),
    messages,
    replaceMessages,
    clearPollData,
    prependMessage,
    appendMessage,
    prependMessages,
    appendMessages,
    upsertMessage,
    removePendingMessage,
    incrementUnread,
    resetUnread,
    setAtLatest,
    setPagination,
    setLastDeliveredId,
    loadInitialData,
    startLiveUpdates,
    stopLiveUpdates,
    fetchBaseData,
    fetchActivePolls,
    fetchMessages,
    pushMessages,
    deleteMessage,
    mention,
  };
});
