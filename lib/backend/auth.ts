import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

import { EMAIL_OTP_LENGTH } from './config';
import { getSupabase } from './supabase';

function errorText(error: unknown): string {
  if (error instanceof Error) {
    const cause = error.cause instanceof Error ? error.cause.message : '';
    return `${error.message} ${cause}`;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return String(error ?? '');
}

/** OkHttp often cancels the HTTP/2 stream after Supabase already queued the OTP email. */
export function isDroppedAuthFetch(error: unknown): boolean {
  return /StreamResetException|stream was reset|ERR_HTTP2|HTTP2_STREAM/i.test(errorText(error));
}

export async function startAnonymous() {
  const supabase = getSupabase();
  if (!supabase) throw new Error('off');
  const { error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
}

export async function sendEmailOtp(email: string) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('off');
  try {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    if (error) throw error;
  } catch (error) {
    if (isDroppedAuthFetch(error)) return;
    throw error;
  }
}

export async function verifyEmailOtp(email: string, token: string) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('off');
  const otp = token.replace(/\D/g, '').slice(0, EMAIL_OTP_LENGTH);
  const types = ['email', 'signup', 'magiclink'] as const;
  let last: Error | null = null;
  for (const type of types) {
    const { error } = await supabase.auth.verifyOtp({ email, token: otp, type });
    if (!error) return;
    last = error;
  }
  throw last;
}

/** Leave the current session if this is another email, then open that email's user. */
export async function signInWithEmailOtp(email: string, token: string) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('off');
  const { data } = await supabase.auth.getSession();
  const current = data.session?.user.email?.trim().toLowerCase() ?? '';
  const next = email.trim().toLowerCase();
  if (data.session && current !== next) await supabase.auth.signOut();
  await verifyEmailOtp(email, token);
}

export async function linkEmail(email: string) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('off');
  const { error } = await supabase.auth.updateUser({ email });
  if (error) throw error;
}

export async function signOutAccount() {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.auth.signOut();
}

function param(url: string, key: string) {
  const match = new RegExp(`[?&#]${key}=([^&#]+)`).exec(url);
  return match ? decodeURIComponent(match[1]) : null;
}

export async function exchangeAuthUrl(url: string) {
  const supabase = getSupabase();
  if (!supabase) return;
  const oauthError = param(url, 'error_description') ?? param(url, 'error');
  if (oauthError) throw new Error(oauthError.replace(/\+/g, ' '));
  const code = param(url, 'code');
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;
    return;
  }
  const accessToken = param(url, 'access_token');
  const refreshToken = param(url, 'refresh_token');
  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (error) throw error;
    return;
  }
  const token = param(url, 'token') ?? param(url, 'otp');
  const email = param(url, 'email');
  if (token && email) await supabase.auth.verifyOtp({ email, token, type: 'email' });
}

export function isAuthCancelled(error: unknown): boolean {
  if (!error) return false;
  if (typeof error === 'object' && error !== null && 'name' in error && (error as { name?: string }).name === 'AuthCancel') {
    return true;
  }
  return error instanceof Error && /cancel|dismiss/i.test(error.message);
}

export async function signInWithGoogle() {
  const supabase = getSupabase();
  if (!supabase) throw new Error('off');
  const { data: current } = await supabase.auth.getSession();
  if (current.session) await supabase.auth.signOut();
  const redirectTo = Linking.createURL('auth/callback');
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: true,
      queryParams: { access_type: 'offline', prompt: 'select_account' },
    },
  });
  if (error) throw error;
  if (!data.url) throw new Error('google');
  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo, { showInRecents: true });
  if (result.type !== 'success' || !result.url) {
    throw Object.assign(new Error('cancelled'), { name: 'AuthCancel' });
  }
  await exchangeAuthUrl(result.url);
}
