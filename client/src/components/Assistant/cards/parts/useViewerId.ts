import { useAuthStore } from '../../../../store/authStore';

/** The signed-in user's id, which a card compares its people with; cards never say "me" themselves. */
export function useViewerId(): number | null {
  return useAuthStore((s) => s.user?.id ?? null);
}
