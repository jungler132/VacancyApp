import type { Session } from '@supabase/supabase-js';
import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { backendConfigured } from '@/lib/backend/config';
import { getSupabase } from '@/lib/backend/supabase';

export type AuthState = {
  configured: boolean;
  ready: boolean;
  userId: string | null;
  email: string | null;
  anonymous: boolean;
  busy: boolean;
  notice: string | null;
};

const initialState: AuthState = {
  configured: backendConfigured(),
  ready: !backendConfigured(),
  userId: null,
  email: null,
  anonymous: false,
  busy: false,
  notice: null,
};

function fromSession(session: Session | null): Pick<AuthState, 'userId' | 'email' | 'anonymous'> {
  const user = session?.user;
  if (!user) return { userId: null, email: null, anonymous: false };
  return {
    userId: user.id,
    email: user.email ?? null,
    anonymous: Boolean(user.is_anonymous),
  };
}

export const hydrateAuth = createAsyncThunk('auth/hydrate', async () => {
  const supabase = getSupabase();
  if (!supabase) return { session: null as Session | null };
  const { data } = await supabase.auth.getSession();
  return { session: data.session };
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setSession(state, action: PayloadAction<Session | null>) {
      const next = fromSession(action.payload);
      state.userId = next.userId;
      state.email = next.email;
      state.anonymous = next.anonymous;
      state.ready = true;
      state.busy = false;
    },
    setAuthBusy(state, action: PayloadAction<boolean>) {
      state.busy = action.payload;
      if (action.payload) state.notice = null;
    },
    setAuthNotice(state, action: PayloadAction<string | null>) {
      state.notice = action.payload;
      state.busy = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(hydrateAuth.fulfilled, (state, action) => {
        const next = fromSession(action.payload.session);
        state.configured = backendConfigured();
        state.userId = next.userId;
        state.email = next.email;
        state.anonymous = next.anonymous;
        state.ready = true;
      })
      .addCase(hydrateAuth.rejected, (state) => {
        state.ready = true;
      });
  },
});

export const { setSession, setAuthBusy, setAuthNotice } = authSlice.actions;
export default authSlice.reducer;
