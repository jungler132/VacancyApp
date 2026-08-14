import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import type { Job } from './types';

const KEY = 'workly:saved-jobs';

type SavedContextValue = {
  saved: Job[];
  isSaved: (id: string) => boolean;
  toggle: (job: Job) => void;
  ready: boolean;
};

const SavedContext = createContext<SavedContextValue | null>(null);

export function SavedProvider({ children }: { children: ReactNode }) {
  const [saved, setSaved] = useState<Job[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (raw) setSaved(JSON.parse(raw) as Job[]);
      })
      .catch(() => undefined)
      .finally(() => setReady(true));
  }, []);

  const persist = useCallback((next: Job[]) => {
    setSaved(next);
    AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => undefined);
  }, []);

  const isSaved = useCallback((id: string) => saved.some((job) => job.id === id), [saved]);

  const toggle = useCallback(
    (job: Job) => {
      persist(isSaved(job.id) ? saved.filter((item) => item.id !== job.id) : [job, ...saved]);
    },
    [isSaved, persist, saved],
  );

  const value = useMemo(() => ({ saved, isSaved, toggle, ready }), [saved, isSaved, toggle, ready]);
  return createElement(SavedContext.Provider, { value }, children);
}

export function useSaved() {
  const ctx = useContext(SavedContext);
  if (!ctx) throw new Error('useSaved must be used inside SavedProvider');
  return ctx;
}
