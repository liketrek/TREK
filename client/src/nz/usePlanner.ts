import { useState } from 'react';
import { days, type Place } from './data';
export type Saved = { notes: Record<number, string>; checked: string[] };
const key = 'trek-nz-2026-v1';
function read(): Saved {
  try {
    const x = JSON.parse(localStorage.getItem(key) || 'null');
    return {
      notes: x?.notes && typeof x.notes === 'object' ? x.notes : {},
      checked: Array.isArray(x?.checked) ? x.checked.filter((s: unknown) => typeof s === 'string') : [],
    };
  } catch {
    return { notes: {}, checked: [] };
  }
}
export function usePlanner() {
  const [dayId, setDayId] = useState(3),
    [tab, setTab] = useState('行程'),
    [overview, setOverview] = useState(false),
    [focus, setFocus] = useState<Place | null>(null),
    [query, setQuery] = useState(''),
    [saved, setSaved] = useState<Saved>(read),
    [storageError, setStorageError] = useState(''),
    [notice, setNotice] = useState('');
  const day = days.find((d) => d.id === dayId)!;
  const save = (next: Saved) => {
    setSaved(next);
    try {
      localStorage.setItem(key, JSON.stringify(next));
      setStorageError('');
    } catch {
      setStorageError('浏览器无法保存，请导出行程备份。');
    }
  };
  const selectDay = (id: number) => {
    setDayId(id);
    setFocus(null);
    setOverview(false);
    setQuery('');
    setTab('行程');
  };
  const selectPlace = (place: Place | null) => {
    setFocus(place);
  };
  const download = () => {
    const blob = new Blob([JSON.stringify({ trip: '新西兰南岛 · 2026', days, ...saved }, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '新西兰南岛-旅行计划.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice('行程与个人备注已导出');
  };
  return {
    day,
    tab,
    setTab,
    overview,
    setOverview,
    focus,
    selectPlace,
    query,
    setQuery,
    saved,
    storageError,
    notice,
    selectDay,
    download,
    save,
  };
}
