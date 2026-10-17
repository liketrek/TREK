import { useEffect, useEffectEvent, useMemo, useState } from 'react';

import { adminApi } from '../../api/client';
import { useTranslation } from '../../i18n';
import { type PermissionLevel, usePermissionsStore } from '../../store/permissionsStore';
import { useToast } from '../shared/Toast';

interface PermissionEntry {
  key: string;
  level: PermissionLevel;
  defaultLevel: PermissionLevel;
  allowedLevels: PermissionLevel[];
}

export const LEVEL_LABELS: Record<string, string> = {
  admin: 'perm.level.admin',
  trip_owner: 'perm.level.tripOwner',
  trip_member: 'perm.level.tripMember',
  everybody: 'perm.level.everybody',
};

export const CATEGORIES = [
  { id: 'trip', keys: ['trip_create', 'trip_edit', 'trip_delete', 'trip_archive', 'trip_cover_upload'] },
  { id: 'members', keys: ['member_manage'] },
  { id: 'files', keys: ['file_upload', 'file_edit', 'file_delete'] },
  { id: 'content', keys: ['place_edit', 'day_edit', 'reservation_edit'] },
  { id: 'extras', keys: ['budget_edit', 'packing_edit', 'collab_edit', 'share_manage'] },
];

/**
 * The permission levels behind both admin shells: loaded once on mount, edited locally
 * until saved, and resettable to the server's defaults. A save pushes the result into the
 * permissions store so the rest of the app follows straight away.
 */
export function usePermissionsAdmin() {
  const { t } = useTranslation();
  const toast = useToast();
  const [entries, setEntries] = useState<PermissionEntry[]>([]);
  const [values, setValues] = useState<Record<string, PermissionLevel>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const loadPermissions = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getPermissions();
      setEntries(data.permissions);
      const vals: Record<string, PermissionLevel> = {};
      for (const p of data.permissions) vals[p.key] = p.level;
      setValues(vals);
      setDirty(false);
    } catch {
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const loadOnMount = useEffectEvent(() => {
    void loadPermissions();
  });
  useEffect(() => {
    loadOnMount();
  }, []);

  const handleChange = (key: string, level: PermissionLevel) => {
    setValues((prev) => ({ ...prev, [key]: level }));
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = await adminApi.updatePermissions(values);
      if (data.permissions) {
        usePermissionsStore.getState().setPermissions(data.permissions);
      }
      setDirty(false);
      toast.success(t('perm.saved'));
    } catch {
      toast.error(t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    const defaults: Record<string, PermissionLevel> = {};
    for (const p of entries) defaults[p.key] = p.defaultLevel;
    setValues(defaults);
    setDirty(true);
  };

  const entryMap = useMemo(() => new Map(entries.map((e) => [e.key, e])), [entries]);

  return { entryMap, values, loading, saving, dirty, handleChange, handleSave, handleReset };
}
