import {

  ApolloClient,
  ApolloLink,
  HttpLink,
  InMemoryCache,
  split,
} from '@apollo/client/core';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { WebSocketLink } from '@apollo/client/link/ws';
import { getMainDefinition } from '@apollo/client/utilities';
import { SubscriptionClient } from 'subscriptions-transport-ws';
import type { NuxtApp } from '#app';

interface ApiError {
  status?: number;
  statusCode?: number;
  message?: string | string[];
}

function serverError(extensions?: Record<string, unknown>): ApiError | undefined {
  return (extensions?.exception as { response?: ApiError } | undefined)?.response;
}

type GraphqlService = ReturnType<typeof createGraphql>;
const clients = new WeakMap<NuxtApp, GraphqlService>();

export function useGraphql(): GraphqlService {
  const app = useNuxtApp();
  let service = clients.get(app);
  if (!service) {
    service = createGraphql(app);
    clients.set(app, service);
  }
  return service;
}

function createGraphql(app: NuxtApp) {
  const config = useRuntimeConfig().public;
  const token = useCookie<string | null>('token', { maxAge: 86_400 * 365 * 10, sameSite: 'lax', path: '/' });
  const notify = useNotifications();
  const errorLink = onError(({ graphQLErrors, networkError, response, operation }) => {
    const unauthorized = (networkError && 'statusCode' in networkError && networkError.statusCode === 401)
      || graphQLErrors?.some((error) => {
        const details = serverError(error.extensions);
        return (details?.statusCode || details?.status) === 401;
      });
    if (unauthorized && operation.operationName !== 'SignIn' && token.value
      && operation.getContext().headers?.authorization === `Bearer ${token.value}`) {
      void useAuthStore(app.$pinia).invalidateSession();
    }
    if (!graphQLErrors) return;
    const firstResponse = serverError(graphQLErrors[0]?.extensions);
    if (response && firstResponse) {
      const message = Array.isArray(firstResponse.message) ? firstResponse.message.join('\n') : firstResponse.message;
      response.errors = [{ ...graphQLErrors[0], ...firstResponse, message: message || graphQLErrors[0]!.message }];
    }
    for (const error of graphQLErrors) {
      const details = serverError(error.extensions);
      if (!details) continue;
      if (import.meta.client) {
        const messages = Array.isArray(details.message) ? details.message : [details.message];
        for (const message of messages) {
          if (message) notify.error(message);
        }
      }
    }
  });
  const http = new HttpLink({
    uri: config.graphqlHttpEndpoint || '/graphql',
    fetch: (uri, options) => fetch(`${uri}${String(uri).includes('?') ? '&' : '?'}lang=ru`, options),
  });
  const auth = setContext((_, { headers }) => ({
    headers: { ...headers, ...(token.value && { authorization: `Bearer ${token.value}` }) },
  }));
  let transport: ApolloLink = http;
  let websocket: SubscriptionClient | undefined;
  if (import.meta.client && config.graphqlWsEndpoint) {
    websocket = new SubscriptionClient(config.graphqlWsEndpoint, {
      reconnect: true,
      lazy: true,
      connectionParams: () => ({ Authorization: token.value ? `Bearer ${token.value}` : '' }),
    });
    transport = split(
      ({ query }) => {
        const definition = getMainDefinition(query);
        return definition.kind === 'OperationDefinition' && definition.operation === 'subscription';
      },
      new WebSocketLink(websocket),
      http,
    );
  }
  const client = new ApolloClient({
    ssrMode: import.meta.server,
    // Identical operations may run under different credentials during a session change.
    queryDeduplication: false,
    cache: new InMemoryCache(),
    link: ApolloLink.from([errorLink, auth, transport]),
    defaultOptions: {
      watchQuery: { fetchPolicy: 'no-cache', errorPolicy: 'all' },
      query: { fetchPolicy: 'no-cache', errorPolicy: 'all' },
      mutate: { fetchPolicy: 'no-cache', errorPolicy: 'all' },
    },
  });
  const restartSocket = () => websocket?.close(false, false);
  // Queries use no-cache and discard results from a previous auth session in the stores.
  // Clear normalized data without cancelling the chat's in-flight long poll.
  const clearAuthCache = () => client.cache.reset();
  const session = {
    async setToken(value: string) {
      token.value = value;
      restartSocket();
      await clearAuthCache();
    },
    async clearToken() {
      token.value = null;
      restartSocket();
      await clearAuthCache();
    },
  };
  app.vueApp.onUnmount(() => {
    websocket?.close(true, true);
    client.stop();
  });
  return { client, token, ...session };
}
