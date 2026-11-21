import { watch } from 'vue';
import type {

  MessagePartsFragment,
  GetMessagesQuery,
  GetMessagesQueryVariables,
  MessageDeletedSubscription,
  MessageUpdatedSubscription,
} from '~/graphql/schema';
import GetMessages from '~/graphql/queries/get-messages.graphql';
import MessageDeleted from '~/graphql/subscriptions/message-deleted.graphql';
import MessageUpdated from '~/graphql/subscriptions/message-updated.graphql';

interface MessageStreamOptions {
  cursor: () => number | null;
  receive: (messages: MessagePartsFragment[]) => void;
  created: (messages: MessagePartsFragment[]) => void;
  refresh: () => Promise<void>;
  invalidate: () => void;
}

export function useMessageStream(options: MessageStreamOptions) {
  const { client } = useGraphql();
  const auth = useAuthStore();
  const session = useSessionScope();
  const retrySeconds = [1, 5, 5, 5, 10, 10, 10, 30, 30, 60];
  let stopSession: (() => void) | undefined;
  let stop: (() => void) | undefined;

  async function poll(signal: AbortSignal, version: number) {
    let failures = 0;
    while (!signal.aborted && session.isCurrent(version)) {
      try {
        const { data, errors } = await client.query<GetMessagesQuery, GetMessagesQueryVariables>({
          query: GetMessages,
          variables: { poll: true, ...(options.cursor() && { lastId: options.cursor() }) },
          context: { fetchOptions: { signal }, queryDeduplication: false },
        });
        if (signal.aborted || !session.isCurrent(version)) return;
        if (errors?.length || !data) throw new Error(errors?.[0]?.message || 'Unable to load messages');
        options.receive(data.getMessages);
        options.created(data.getMessages);
        failures = 0;
      } catch {
        if (signal.aborted || !session.isCurrent(version)) return;
        const delay = retrySeconds[Math.min(failures++, retrySeconds.length - 1)] * 1000;
        await new Promise<void>((resolve) => {
          const finish = () => {
            clearTimeout(timer);
            signal.removeEventListener('abort', finish);
            resolve();
          };
          const timer = setTimeout(finish, delay);
          signal.addEventListener('abort', finish, { once: true });
        });
      }
    }
  }

  function connect() {
    stopSession?.();
    const version = session.capture();
    const controller = new AbortController();
    void poll(controller.signal, version);
    const subscriptions = [
      client.subscribe<MessageDeletedSubscription>({ query: MessageDeleted }).subscribe({
        next: ({ data }) => {
          if (session.isCurrent(version) && data?.messageDeleted) options.receive([data.messageDeleted]);
        },
        error: () => { void options.refresh(); },
      }),
      client.subscribe<MessageUpdatedSubscription>({ query: MessageUpdated }).subscribe({
        next: ({ data }) => {
          if (session.isCurrent(version) && data?.messageUpdated) options.receive([data.messageUpdated]);
        },
        error: () => { void options.refresh(); },
      }),
    ];
    stopSession = () => {
      controller.abort();
      subscriptions.forEach((subscription) => subscription.unsubscribe());
    };
  }

  function start() {
    if (stop) return;
    connect();
    void options.refresh();
    const stopWatching = watch(() => auth.sessionVersion, () => {
      options.invalidate();
      connect();
      void options.refresh();
    }, { flush: 'post' });
    const timer = setInterval(() => void options.refresh(), 30_000);
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') void options.refresh();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    stop = () => {
      stopWatching();
      stopSession?.();
      stopSession = undefined;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }

  return {
    start,
    stop() {
      stop?.();
      stop = undefined;
    },
  };
}
