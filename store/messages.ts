import { actionTree, getterTree, mutationTree } from 'typed-vuex';
import { DateTime } from 'luxon';
import { Context } from '@nuxt/types';
import { Message, MessageType } from '~/types/message';
import {
  DeleteMessageMutation,
  DeleteMessageMutationVariables,
  GetChatDataQuery,
  GetChatDataQueryVariables,
  GetMessagesQuery,
  GetMessagesQueryVariables,
  MessageDeletedSubscription,
  MessageUpdatedSubscription,
} from '~/graphql/schema';
import GetChatData from '~/graphql/queries/get-chat-data.graphql';
import MessageDeleted from '~/graphql/subscriptions/message-deleted.graphql';
import MessageUpdated from '~/graphql/subscriptions/message-updated.graphql';
import GetMessages from '~/graphql/queries/get-messages.graphql';
import DeleteMessage from '~/graphql/mutations/delete-message.graphql';
import { sleep } from '~/tools/util';

export interface MentionEvent {
  id: number;
  username: string;
}

export interface StartMessageEditEvent {
  message: Message;
}

export type FetchDirection = 'none' | 'older' | 'newer';

export const namespaced = true;

export const state = () => ({
  rawMessages: [] as Message[],
  unreadCount: 0 as number,
  lastDeliveredId: null as null | number,
  isEverythingFetched: 'newer' as FetchDirection,
  editableMessage: null as null | Message,
});

export const mutations = mutationTree(state, {
  SET_RAW_MESSAGES: (_state, payload: Message[]) => (_state.rawMessages = payload),
  ADD_RAW_MESSAGE_TO_START: (_state, payload: Message) => _state.rawMessages.unshift(payload),
  ADD_RAW_MESSAGE_TO_END: (_state, payload: Message) => _state.rawMessages.push(payload),
  ADD_RAW_MESSAGES_TO_START: (_state, payload: Message[]) => {
    _state.rawMessages.unshift(...payload);
  },
  ADD_RAW_MESSAGES_TO_END: (_state, payload: Message[]) => {
    _state.rawMessages.push(...payload);
  },
  CLEAR_MESSAGES: (_state, payload: 'from-start' | 'from-end' = 'from-end') => {
    if (_state.rawMessages.length > 200) {
      if (payload === 'from-end') {
        _state.rawMessages = _state.rawMessages.slice(0, 200);
      } else {
        _state.rawMessages = _state.rawMessages.slice(-200);
      }
    }
  },
  UPDATE_MESSAGE: (_state, payload: Message) => {
    let index = -1;
    if (payload.randomId !== null) {
      index = _state.rawMessages.findIndex((message) => message.randomId === payload.randomId);
    }
    if (index === -1) {
      index = _state.rawMessages.findIndex((message) => message.id === payload.id);
    }
    if (index !== -1) {
      _state.rawMessages.splice(index, 1, payload);
    } else if (_state.isEverythingFetched === 'newer') {
      _state.rawMessages.unshift(payload);
    }
  },
  DELETE_MESSAGE_BY_RANDOM_ID: (_state, payload: string) => {
    if (_state.rawMessages.length === 0) return;

    const index = _state.rawMessages.findIndex(({ randomId }) => randomId === payload);
    if (index === -1) return;
    _state.rawMessages.splice(index, 1);
  },
  INCREMENT_UNREAD: (_state) => (_state.unreadCount = _state.unreadCount + 1),
  RESET_UNREAD: (_state) => (_state.unreadCount = 0),
  SET_IS_EVERYTHING_FETCHED: (_state, payload: FetchDirection) => (_state.isEverythingFetched = payload),
  SET_LAST_DELIVERED_ID: (_state, payload: number) => (_state.lastDeliveredId = payload),
  SET_EDITABLE_MESSAGE: (_state, payload: Message) => (_state.editableMessage = payload),
  CLEAR_EDITABLE_MESSAGE: (_state) => (_state.editableMessage = null),
});

export const getters = getterTree(state, {
  messages: (_state) => Array.from(_state.rawMessages).sort((a, b) => b.createdAtMillis - a.createdAtMillis),
});

export const actions = actionTree(
  { state, mutations, getters },
  {
    async nuxtServerInit({ dispatch }, context: Context) {
      await dispatch('fetchBaseData', context);
    },

    nuxtClientInit({ dispatch, commit }) {
      dispatch('subscribeMessageCreated');
      dispatch('subscribeMessageDeleted');
      dispatch('subscribeMessageUpdated');

      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          commit('RESET_UNREAD');
        }
      });
    },

    async fetchBaseData({ commit }) {
      const client = this.app.apolloProvider.defaultClient;
      if (!client) return;

      let variables: GetChatDataQueryVariables = {};

      if (this.$router.currentRoute.query.from) {
        const datetime = DateTime.fromISO(this.$router.currentRoute.query.from.toString());

        if (datetime.isValid) {
          variables = {
            fromDateTime: datetime.toISO(),
            reverse: true,
          };
        }

        commit('SET_IS_EVERYTHING_FETCHED', 'none');
      }

      const { data, errors } = await client.query<GetChatDataQuery, GetChatDataQueryVariables>({
        query: GetChatData,
        variables,
      });
      if (errors || !data) return;

      const messages = data.messages.map((message) => new Message(message));
      commit('SET_RAW_MESSAGES', messages);

      const lastMessage = data.lastMessages[0];
      if (lastMessage) {
        commit('SET_LAST_DELIVERED_ID', lastMessage.id);
      }
    },

    async fetchMessages(
      _context,
      payload?: GetMessagesQueryVariables,
    ): Promise<GetMessagesQuery['getMessages'] | void> {
      const client = this?.app.apolloProvider?.defaultClient ?? this.app.apolloProvider?.defaultClient;
      if (!client) return;
      try {
        const { data, errors } = await client.query<GetMessagesQuery, GetMessagesQueryVariables>({
          query: GetMessages,
          variables: payload,
        });
        if (errors || !data) return;

        return data.getMessages;
      } catch (e) {}
    },

    pushMessages(
      { commit },
      payload: {
        variables: GetMessagesQueryVariables;
        messages: GetMessagesQuery['getMessages'];
      },
    ): void {
      const messages = payload.messages.map((message) => new Message(message));

      if (payload.variables?.reverse) {
        commit('ADD_RAW_MESSAGES_TO_END', messages);
      } else {
        commit('ADD_RAW_MESSAGES_TO_START', messages);
      }
    },

    async deleteMessage({ commit }, payload: DeleteMessageMutationVariables) {
      const client = this.app.apolloProvider?.defaultClient;
      if (!client) return;

      try {
        const { data, errors } = await client.query<DeleteMessageMutation, DeleteMessageMutationVariables>({
          query: DeleteMessage,
          variables: payload,
        });
        if (errors || !data?.deleteMessage) return;

        commit('UPDATE_MESSAGE', new Message(data.deleteMessage));
      } catch (e) {}
    },

    mention(_, payload: MentionEvent) {
      window.$nuxt.$emit('mention', payload);
    },

    startMessageEdit({ commit }, payload: Message) {
      window.$nuxt.$emit('start-message-edit', payload);
      commit('SET_EDITABLE_MESSAGE', payload);
    },

    stopMessageEdit({ commit }) {
      window.$nuxt.$emit('stop-message-edit');
      commit('CLEAR_EDITABLE_MESSAGE');
    },

    async subscribeMessageCreated({ state, commit }) {
      const client = this.app.apolloProvider.defaultClient;
      if (!client) return;

      let errorsCount: number = 0;
      const errorTimeouts: number[] = [1, 5, 5, 5, 10, 10, 10, 30, 30, 60];

      do {
        try {
          const variables: GetMessagesQueryVariables = {
            poll: true,
          };

          if (state.lastDeliveredId) {
            variables.lastId = state.lastDeliveredId;
          }

          const response = await client.query<GetMessagesQuery, GetMessagesQueryVariables>({
            query: GetMessages,
            variables,
          });

          const messages = response.data.getMessages;
          for (let i = 0; i < messages.length; ++i) {
            commit('UPDATE_MESSAGE', new Message(messages[i]));
          }

          const lastMessage = messages[0];
          if (lastMessage) {
            commit('SET_LAST_DELIVERED_ID', lastMessage.id);
          }

          const filteredMessages = messages.filter((message) => {
            return [MessageType.GENERAL, MessageType.DONATION, MessageType.POLL].includes(message.type);
          });

          if (filteredMessages.length > 0 && process.client && document.visibilityState === 'hidden') {
            commit('INCREMENT_UNREAD');
          }

          errorsCount = 0;
        } catch (e) {
          await sleep((errorTimeouts[errorsCount] ?? 1) * 1000);
          /* eslint-disable no-console */
          console.error(e);
          console.log(`Polling error: waiting ${errorTimeouts[errorsCount]} seconds before retry...`);
          /* eslint-enable no-console */

          errorsCount += 1;

          if (errorsCount >= errorTimeouts.length) {
            errorsCount = 0;
          }
        }
      } while (true);
    },

    subscribeMessageDeleted({ commit }) {
      const client = this.app.apolloProvider.defaultClient;
      if (!client) return;

      client
        .subscribe<MessageDeletedSubscription>({ query: MessageDeleted })
        .subscribe({
          next({ data }) {
            if (!data?.messageDeleted) return;

            commit('UPDATE_MESSAGE', new Message(data.messageDeleted));
          },
        });
    },

    subscribeMessageUpdated({ commit }) {
      const client = this.app.apolloProvider.defaultClient;
      if (!client) return;

      client
        .subscribe<MessageUpdatedSubscription>({ query: MessageUpdated })
        .subscribe({
          next({ data }) {
            if (!data?.messageUpdated) return;

            commit('UPDATE_MESSAGE', new Message(data.messageUpdated));
          },
        });
    },
  },
);
