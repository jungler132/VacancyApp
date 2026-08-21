import { useEffect, useRef } from 'react';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

import { exchangeAuthUrl } from '@/lib/backend/auth';
import { writeBoundEmail } from '@/lib/backend/boundEmail';
import { clearLocalAccount, pullAccount, refreshPublic, resetPushCache, schedulePush } from '@/lib/backend/sync';
import { getSupabase } from '@/lib/backend/supabase';
import { hydrateAuth, setSession } from '@/lib/store/authSlice';
import { useAppDispatch, useAppSelector, useAppStore } from '@/lib/store/hooks';

export function BackendHost() {
  const dispatch = useAppDispatch();
  const store = useAppStore();
  const ready = useAppSelector(
    (state) =>
      state.freelance.ready &&
      state.localJobs.ready &&
      state.identity.ready &&
      state.auth.ready &&
      state.saved.ready &&
      state.savedCatalog.ready &&
      state.savedServices.ready &&
      state.appearance.ready &&
      state.filters.ready &&
      state.alerts.ready &&
      state.sources.ready &&
      state.visits.ready &&
      state.company.ready,
  );
  const userId = useAppSelector((state) => state.auth.userId);
  const email = useAppSelector((state) => state.auth.email);
  const lastUser = useRef<string | null | undefined>(undefined);
  const lastEmail = useRef<string | null | undefined>(undefined);
  const userIdRef = useRef(userId);
  userIdRef.current = userId;

  useEffect(() => {
    WebBrowser.maybeCompleteAuthSession();
    dispatch(hydrateAuth());
    const supabase = getSupabase();
    if (!supabase) return undefined;
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextId = session?.user.id ?? null;
      if (userIdRef.current !== nextId) resetPushCache();
      dispatch(setSession(session));
    });
    const sub = Linking.addEventListener('url', ({ url }) => {
      exchangeAuthUrl(url).catch(() => undefined);
    });
    Linking.getInitialURL()
      .then((url) => {
        if (url) exchangeAuthUrl(url).catch(() => undefined);
      })
      .catch(() => undefined);
    return () => {
      data.subscription.unsubscribe();
      sub.remove();
    };
  }, [dispatch]);

  useEffect(() => {
    if (!ready) return;
    const prev = lastUser.current;
    if (prev !== userId) {
      lastUser.current = userId;
      lastEmail.current = email ?? null;
      resetPushCache();
      if (!userId) {
        if (prev) {
          clearLocalAccount(dispatch);
          void writeBoundEmail(null);
        }
      } else {
        pullAccount(dispatch, () => store.getState()).catch(() => undefined);
      }
    } else if (userId && email && lastEmail.current !== email) {
      lastEmail.current = email;
      schedulePush(() => store.getState(), dispatch);
    }
    refreshPublic(dispatch, userId).catch(() => undefined);
  }, [dispatch, email, ready, store, userId]);

  return null;
}
