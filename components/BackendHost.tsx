import { useEffect, useRef } from 'react';
import * as Linking from 'expo-linking';

import { exchangeAuthUrl } from '@/lib/backend/auth';
import { pullAccount, refreshPublic, resetPushCache } from '@/lib/backend/sync';
import { getSupabase } from '@/lib/backend/supabase';
import { hydrateAuth, setSession } from '@/lib/store/authSlice';
import { useAppDispatch, useAppSelector, useAppStore } from '@/lib/store/hooks';

export function BackendHost() {
  const dispatch = useAppDispatch();
  const store = useAppStore();
  const ready = useAppSelector(
    (state) => state.freelance.ready && state.localJobs.ready && state.identity.ready && state.auth.ready,
  );
  const userId = useAppSelector((state) => state.auth.userId);
  const pulled = useRef<string | null>(null);

  useEffect(() => {
    dispatch(hydrateAuth());
    const supabase = getSupabase();
    if (!supabase) return undefined;
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      dispatch(setSession(session));
      if (!session) resetPushCache();
    });
    const sub = Linking.addEventListener('url', ({ url }) => {
      exchangeAuthUrl(url).catch(() => undefined);
    });
    Linking.getInitialURL().then((url) => {
      if (url) exchangeAuthUrl(url).catch(() => undefined);
    });
    return () => {
      data.subscription.unsubscribe();
      sub.remove();
    };
  }, [dispatch]);

  useEffect(() => {
    if (!ready) return;
    refreshPublic(dispatch, userId).catch(() => undefined);
    if (!userId || pulled.current === userId) return;
    pulled.current = userId;
    pullAccount(dispatch, store.getState()).catch(() => undefined);
  }, [dispatch, ready, store, userId]);

  return null;
}
