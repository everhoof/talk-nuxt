export function useSessionScope() {
  const auth = useAuthStore();
  return {
    capture: () => auth.sessionVersion,
    isCurrent: (version: number) => version === auth.sessionVersion,
  };
}
