import { GraphQLError } from 'graphql';
import { defineStore } from 'pinia';
import {
  reactive,
  toRefs,
  computed,
} from 'vue';
import type { FetchResult } from '@apollo/client/core';
import type { Query } from 'accesscontrol';
import { AccessControl } from 'accesscontrol';
import GetCurrentUser from '~/graphql/queries/get-current-user.graphql';
import GetGrants from '~/graphql/queries/get-grants.graphql';
import type {
  GetCurrentUserQuery,
  GetGrantsQuery,
  OAuthDiscordMutation,
  RequestPasswordResetMutation,
  RequestPasswordResetMutationVariables,
  ResetPasswordMutation,
  ResetPasswordMutationVariables,
  SignInMutation,
  SignInMutationVariables,
  SignUpMutation,
  SignUpMutationVariables,
} from '~/graphql/schema';
import SignIn from '~/graphql/mutations/sign-in.graphql';
import SignUp from '~/graphql/mutations/sign-up.graphql';
import RequestPasswordReset from '~/graphql/mutations/request-password-reset.graphql';
import ResetPassword from '~/graphql/mutations/reset-password.graphql';

type AuthStatus = 'unresolved' | 'loading' | 'authenticated' | 'guest' | 'error';
type Grants = Record<string, Record<string, Record<string, string[]>>>;
const guestGrants: Grants = { UNVERIFIED_USER: { message: { 'read:any': ['*'] } } };

export const useAuthStore = defineStore('auth', () => {
  const userIdCookie = useCookie<number | null>('user_id', { path: '/', sameSite: 'lax', maxAge: 86_400 * 365 * 10 });
  const graphqlSession = useGraphql();
  const { client } = graphqlSession;
  const router = useRouter();
  const storeState = reactive({
    user: null as GetCurrentUserQuery['getCurrentUser'] | null,
    grants: guestGrants,
    status: 'unresolved' as AuthStatus,
    error: '',
    sessionVersion: 0,
  });
  const userId = computed(() => storeState.user?.id ?? null);
  const loggedIn = computed(() => storeState.status === 'authenticated' && !!storeState.user);
  const isAdmin = computed(() => loggedIn.value && !!storeState.user?.roles.some((role) => role.name === 'ADMIN'));
  const ac = computed(() => new AccessControl(storeState.grants));
  const can = computed((): Query => ac.value.can(loggedIn.value
    ? storeState.user!.roles.map((role) => role.name)
    : 'UNVERIFIED_USER'));

  function updateUser(user: GetCurrentUserQuery['getCurrentUser']) {
    if (storeState.user && (storeState.user.id !== user.id
      || JSON.stringify(storeState.user.roles) !== JSON.stringify(user.roles))) storeState.sessionVersion++;
    storeState.user = user;
    userIdCookie.value = user.id;
  }

  function reportError(error: unknown) {
    storeState.status = 'error';
    storeState.error = error instanceof Error ? error.message : 'Unable to resolve your session';
  }

  async function loadGuestGrants() {
    const { data, errors } = await client.query<GetGrantsQuery>({ query: GetGrants });
    if (errors?.length) throw errors[0];
    if (!data?.getGrants) throw new Error('The server did not return guest permissions');
    return JSON.parse(data.getGrants) as Grants;
  }

  let resolution = 0;
  async function invalidateSession() {
    storeState.sessionVersion++;
    resolution++;
    storeState.user = null;
    storeState.grants = guestGrants;
    storeState.status = 'guest';
    storeState.error = '';
    userIdCookie.value = null;
    await graphqlSession.clearToken();
  }

  async function initialize() {
    storeState.sessionVersion++;
    const attempt = ++resolution;
    storeState.user = null;
    storeState.grants = guestGrants;
    storeState.status = 'loading';
    storeState.error = '';
    const token = graphqlSession.token.value;
    try {
      if (!token) {
        const grants = await loadGuestGrants();
        if (attempt === resolution) {
          storeState.grants = grants;
          storeState.status = 'guest';
        }
        return;
      }
      const { data, errors } = await client.query<GetCurrentUserQuery>({ query: GetCurrentUser });
      // A 401 or a newer login/logout may have replaced the session while this request ran.
      if (attempt !== resolution || token !== graphqlSession.token.value) return;
      if (errors?.length) throw errors[0];
      if (!data?.getCurrentUser) {
        await invalidateSession();
        await initialize();
        return;
      }
      const grants = JSON.parse(data.getGrants) as Grants;
      updateUser(data.getCurrentUser);
      storeState.grants = grants;
      storeState.status = 'authenticated';
    } catch (error) {
      if (attempt === resolution && token === graphqlSession.token.value) reportError(error);
    }
  }

  async function loginHandler(token: OAuthDiscordMutation['OAuthDiscord']) {
    await graphqlSession.setToken(token.value);
    await initialize();
    if (!loggedIn.value) throw new Error(storeState.error || 'Unable to resolve your session');
  }

  async function signIn(variables: SignInMutationVariables): Promise<FetchResult<SignInMutation>> {
    try {
      const result = await client.mutate<SignInMutation, SignInMutationVariables>({ mutation: SignIn, variables });
      if (!result.errors?.length && result.data) await loginHandler(result.data.signIn);
      return result;
    } catch (error) {
      return { errors: [new GraphQLError(error instanceof Error ? error.message : 'Unable to sign in')] };
    }
  }

  async function signUp(variables: SignUpMutationVariables): Promise<FetchResult<SignUpMutation>> {
    const response = await client.mutate<SignUpMutation, SignUpMutationVariables>({ mutation: SignUp, variables });
    if (!response.errors?.length && response.data) {
      const login = await signIn(variables);
      if (login.errors?.length) return { ...response, errors: login.errors };
    }
    return response;
  }

  async function requestPasswordReset(variables: RequestPasswordResetMutationVariables): Promise<boolean> {
    const response = await client.mutate<RequestPasswordResetMutation, RequestPasswordResetMutationVariables>({
      mutation: RequestPasswordReset, variables,
    });
    return !response.errors?.length && !!response.data;
  }

  async function resetPassword(variables: ResetPasswordMutationVariables): Promise<FetchResult<ResetPasswordMutation>> {
    try {
      const result = await client.mutate<ResetPasswordMutation, ResetPasswordMutationVariables>({
        mutation: ResetPassword,
        variables,
      });
      if (!result.errors?.length && result.data) await loginHandler(result.data.resetPassword);
      return result;
    } catch (error) {
      return { errors: [new GraphQLError(error instanceof Error ? error.message : 'Unable to reset password')] };
    }
  }

  async function logout() {
    await invalidateSession();
    const attempt = resolution;
    try {
      const grants = await loadGuestGrants();
      if (attempt === resolution) storeState.grants = grants;
    } catch (error) {
      if (attempt === resolution) {
        storeState.error = error instanceof Error ? error.message : 'Unable to load guest permissions';
      }
    }
    if (router.currentRoute.value.name !== 'main') await router.push({ name: 'main' });
  }

  return {
    ...toRefs(storeState),
    userId,
    loggedIn,
    isAdmin,
    can,
    initialize,
    updateUser,
    invalidateSession,
    loginHandler,
    signIn,
    signUp,
    requestPasswordReset,
    resetPassword,
    logout,
  };
});
