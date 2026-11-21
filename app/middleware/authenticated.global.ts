export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuthStore();
  await callOnce('auth-session', () => auth.initialize());
  if (['modal_login', 'modal_register'].includes(String(to.name)) && auth.loggedIn) {
    return navigateTo({ name: 'main' });
  }
});
