export function useProfileUser() {
  const route = useRoute();
  const chat = useChatStore();
  const id = computed(() => Number(route.params.id));
  return useAsyncData(() => `profile:${id.value}`, async () => {
    if (!Number.isSafeInteger(id.value) || id.value <= 0) throw createError({ statusCode: 404, statusMessage: 'User not found' });
    const user = await chat.fetchUserById({ id: id.value });
    if (!user) throw createError({ statusCode: 404, statusMessage: 'User not found' });
    return user.id;
  });
}
