import { defineStore } from 'pinia';
import {
  reactive,
  toRefs,
  computed,
} from 'vue';
import { DateTime } from 'luxon';
import UserUpdated from '~/graphql/subscriptions/user-updated.graphql';
import UpdateOnlineStatus from '~/graphql/mutations/update-online-status.graphql';
import GetUserById from '~/graphql/queries/get-user-by-id.graphql';
import SearchUsers from '~/graphql/queries/search-users.graphql';
import Punish from '~/graphql/mutations/punish.graphql';
import GetOnline from '~/graphql/queries/get-online.graphql';
import GetVersion from '~/graphql/queries/get-version.graphql';
import OnlineUpdated from '~/graphql/subscriptions/online-updated.graphql';
import type {
  GetOnlineQuery,
  GetUserByIdQuery,
  GetUserByIdQueryVariables,
  GetVersionQuery,
  OnlinePartsFragment,
  OnlineUpdatedSubscription,
  PunishMutation,
  PunishMutationVariables,
  SearchUsersQuery,
  SearchUsersQueryVariables,
  UpdateOnlineStatusMutation,
  UserUpdatedSubscription,
} from '~/graphql/schema';
import type { Emoji } from '~/types/emoji';

const state = () => ({
  apiVersion: 'unknown' as string,
  appVersion: 0 as number,
  online: [] as OnlinePartsFragment[],
  emoji: [
    { name: 'ab4', ext: 'png' },
    { name: 'chrysalis4', ext: 'png' },
    { name: 'kir5', ext: 'png' },
    { name: 'chrysalis2', ext: 'png' },
    { name: 'sc3', ext: 'png' },
    { name: 'tw4', ext: 'png' },
    { name: 'kir2', ext: 'png' },
    { name: 'ab2', ext: 'png' },
    { name: 'tw1', ext: 'png' },
    { name: 'kir4', ext: 'png' },
    { name: 'tw2', ext: 'png' },
    { name: 'sc1', ext: 'png' },
    { name: 'ab3', ext: 'png' },
    { name: 'tw3', ext: 'png' },
    { name: 'kir3', ext: 'png' },
    { name: 'chrysalis5', ext: 'png' },
    { name: 'sc2', ext: 'png' },
    { name: 'sc5', ext: 'png' },
    { name: 'chrysalis1', ext: 'png' },
    { name: 'ab5', ext: 'png' },
    { name: 'tw5', ext: 'png' },
    { name: 'chrysalis3', ext: 'png' },
    { name: 'ab1', ext: 'png' },
    { name: 'sc4', ext: 'png' },
    { name: 'kir1', ext: 'png' },
    { name: 'bestbat', ext: 'png' },
    { name: 'bj', ext: 'png' },
    { name: 'bj_smug', ext: 'png' },
    { name: 'bj_horror', ext: 'png' },
    { name: 'bj_wat', ext: 'png' },
    { name: 'bj_cool', ext: 'png' },
    { name: 'bj_hey', ext: 'png' },
    { name: 'bj_skuka', ext: 'png' },
    { name: 'bj_filly', ext: 'png' },
    { name: 'bj_like', ext: 'png' },
    { name: 'bj_ok', ext: 'png' },
    { name: 'bj_shotgun', ext: 'png' },
    { name: 'dash', ext: 'gif' },
    { name: 'facehoof', ext: 'png' },
    { name: 'bat_cute', ext: 'gif' },
    { name: 'isee', ext: 'gif' },
    { name: 'lyraspin', ext: 'gif' },
    { name: 'oldbol', ext: 'png' },
    { name: 're1', ext: 'png' },
    { name: 're4', ext: 'png' },
    { name: 're2', ext: 'png' },
    { name: 're3', ext: 'png' },
    { name: 'prrr', ext: 'gif' },
    { name: 'madness', ext: 'png' },
    { name: 'shimmy', ext: 'gif' },
    { name: 'chrissymlem', ext: 'gif' },
    { name: 'fire_mmm', ext: 'png' },
    { name: 'fire_angry', ext: 'png' },
    { name: 'fire_wut', ext: 'png' },
    { name: 'fire_meh', ext: 'png' },
    { name: 'fire_cool', ext: 'png' },
    { name: 'privet', ext: 'gif' },
    { name: 'shoock', ext: 'gif' },
    { name: 'aveluna', ext: 'gif' },
    { name: 'batpony', ext: 'gif' },
    { name: 'batpony3', ext: 'png' },
    { name: 'batpony4', ext: 'png' },
    { name: 'batpony1', ext: 'png' },
    { name: 'batpony5', ext: 'png' },
    { name: 'batpony2', ext: 'png' },
    { name: 'eeeeeee', ext: 'png' },
    { name: 'reeeeeeee', ext: 'gif' },
    { name: 'lilpip2', ext: 'png' },
    { name: 'lilpip1', ext: 'png' },
    { name: 'kiss', ext: 'gif' },
    { name: 'eeeees', ext: 'gif' },
    { name: 'pink2', ext: 'png' },
    { name: 'pink3', ext: 'png' },
    { name: 'pink1', ext: 'png' },
    { name: 'pink4', ext: 'png' },
    { name: 'pink5', ext: 'png' },
    { name: 'bad', ext: 'png' },
  ] as Emoji[],
  users: [] as GetUserByIdQuery['getUserById'][],
  asidePcOpened: true as boolean,
});

export const useChatStore = defineStore('chat', () => {
  const authStore = useAuthStore();
  const asideCookie = useCookie<boolean>('aside_pc_opened');
  const { client } = useGraphql();
  const session = useSessionScope();
  const storeState = reactive(state());
  storeState.asidePcOpened = asideCookie.value ?? true;
  const user = computed(() =>
    (id: number): GetUserByIdQuery['getUserById'] | undefined =>
      storeState.users.find((user) => user.id === id));

  function setAsidePcOpened(payload: boolean) {
    asideCookie.value = payload;
    storeState.asidePcOpened = payload;
  }

  function upsertUser(payload: GetUserByIdQuery['getUserById']) {
    const index = storeState.users.findIndex(({ id }) => id === payload.id);
    if (index === -1) storeState.users.push(payload);
    else storeState.users[index] = payload;
  }

  async function loadInitialData() {
    storeState.appVersion = DateTime.now().toUnixInteger();
    await Promise.all([fetchOnline(), fetchApiVersion()]);
  }

  let stopLiveSession: (() => void) | undefined;
  function startLiveUpdates() {
    if (stopLiveSession) return;
    const subscriptions = [subscribeOnlineUpdated(), subscribeUserUpdated()];
    const initialOnlineTimer = setTimeout(async () => {
      await fetchOnline();
    }, 3000);
    const versionTimer = setInterval(
      async () => {
        await fetchApiVersion();
        await checkAppVersion();
      },
      5 * 60 * 1000,
    );
    const onlineTimer = setInterval(async () => {
      if (authStore.loggedIn) await updateOnlineStatus();
    }, 30_000);
    stopLiveSession = () => {
      subscriptions.forEach((subscription) => subscription?.unsubscribe());
      clearTimeout(initialOnlineTimer);
      clearInterval(versionTimer);
      clearInterval(onlineTimer);
    };
  }

  function stopLiveUpdates() {
    stopLiveSession?.();
    stopLiveSession = undefined;
  }

  function subscribeOnlineUpdated() {
    if (!client) {
      return;
    }

    const onlineUpdatedObserver = client.subscribe<OnlineUpdatedSubscription>({
      query: OnlineUpdated,
    });
    return onlineUpdatedObserver.subscribe({
      next({ data }) {
        if (!data?.onlineUpdated) return;
        storeState.online = data.onlineUpdated;
      },
    });
  }

  function subscribeUserUpdated() {
    if (!client) {
      return;
    }

    const userUpdatedObserver = client.subscribe<UserUpdatedSubscription>({
      query: UserUpdated,
    });
    return userUpdatedObserver.subscribe({
      next({ data }) {
        if (!data?.userUpdated) return;
        upsertUser(data.userUpdated);
        if (data.userUpdated.id === authStore.user?.id) {
          authStore.updateUser(data.userUpdated);
        }
      },
    });
  }

  async function updateOnlineStatus() {
    try {
      await client.mutate<UpdateOnlineStatusMutation>({ mutation: UpdateOnlineStatus });
    } catch {}
  }

  async function fetchOnline() {
    try {
      const { data, errors } = await client.query<GetOnlineQuery>({
        query: GetOnline,
      });
      if (errors || !data) return;
      storeState.online = data.getOnline;
    } catch {}
  }

  async function fetchApiVersion() {
    try {
      const { data, errors } = await client.query<GetVersionQuery>({
        query: GetVersion,
      });
      if (errors || !data) return;
      storeState.apiVersion = data.version;
    } catch {
      //
    }
  }

  async function checkAppVersion() {
    try {
      const response = await fetch('/version.json', { cache: 'no-cache' });
      const json = await response.json();
      if ('version' in json && typeof json.version === 'number' && json.version > storeState.appVersion) {
        location.reload();
      }
    } catch {
      //
    }
  }

  async function fetchUserById(payload: GetUserByIdQueryVariables) {
    const version = session.capture();
    try {
      const { data, errors } = await client.query<GetUserByIdQuery, GetUserByIdQueryVariables>({
        query: GetUserById,
        variables: payload,
      });
      if (errors || !data?.getUserById || !session.isCurrent(version)) return null;
      upsertUser(data.getUserById);
      return data.getUserById;
    } catch {}
    return null;
  }

  async function searchUsers(payload: SearchUsersQueryVariables): Promise<SearchUsersQuery['searchUsers']> {
    try {
      const { data, errors } = await client.query<SearchUsersQuery, SearchUsersQueryVariables>({
        query: SearchUsers,
        variables: payload,
      });
      if (errors || !data?.searchUsers) return [];
      return data.searchUsers;
    } catch {}
    return [];
  }

  async function punishUser(payload: PunishMutationVariables) {
    try {
      const { data, errors } = await client.query<PunishMutation, PunishMutationVariables>({
        query: Punish,
        variables: payload,
      });

      if (errors || !data?.punish) return;
    } catch {}
  }
  return {
    ...toRefs(storeState),
    user,
    setAsidePcOpened,
    upsertUser,
    loadInitialData,
    startLiveUpdates,
    stopLiveUpdates,
    subscribeOnlineUpdated,
    subscribeUserUpdated,
    updateOnlineStatus,
    fetchOnline,
    fetchApiVersion,
    checkAppVersion,
    fetchUserById,
    searchUsers,
    punishUser,
  };
});
