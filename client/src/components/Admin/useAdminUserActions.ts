import { adminApi } from '../../api/client';
import type { TranslationFn } from '../../types';

interface UserActionsHost {
  toast: { success: (message: string) => void; error: (message: string) => void };
  setRotatingJwt: (value: boolean) => void;
  setShowRotateJwtModal: (value: boolean) => void;
  logout: () => void;
  navigate: (to: string, options?: { state?: unknown }) => void;
}

/**
 * The two irreversible user actions behind the admin dialogs and their phone sheets:
 * rotating the JWT secret, which signs everyone out including the admin, and removing a
 * user's passkeys. Each shell keeps its own confirm step and busy state around them.
 */
export function useAdminUserActions(admin: UserActionsHost, t: TranslationFn) {
  const { toast, setRotatingJwt, setShowRotateJwtModal, logout, navigate } = admin;

  const rotateJwt = async () => {
    setRotatingJwt(true);
    try {
      await adminApi.rotateJwtSecret();
      setShowRotateJwtModal(false);
      logout();
      navigate('/login', { state: { noRedirect: true } });
    } catch {
      toast.error(t('common.error'));
      setRotatingJwt(false);
    }
  };

  /** Removes the user's passkeys and toasts how many went; true when it worked. */
  const resetPasskeys = async (user: { id: number }): Promise<boolean> => {
    try {
      const r = await adminApi.resetUserPasskeys(user.id);
      toast.success(t('admin.passkey.resetDone', { count: r.deleted ?? 0 }));
      return true;
    } catch {
      toast.error(t('common.error'));
      return false;
    }
  };

  return { rotateJwt, resetPasskeys };
}
