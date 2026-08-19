import { getSupabase } from './supabase';

export async function startAnonymous() {
  const supabase = getSupabase();
  if (!supabase) throw new Error('off');
  const { error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
}

export async function sendEmailOtp(email: string) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('off');
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true },
  });
  if (error) throw error;
}

export async function verifyEmailOtp(email: string, token: string) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('off');
  const types = ['email', 'signup', 'magiclink'] as const;
  let last: Error | null = null;
  for (const type of types) {
    const { error } = await supabase.auth.verifyOtp({ email, token: token.trim(), type });
    if (!error) return;
    last = error;
  }
  throw last;
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
  const code = param(url, 'code');
  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
    return;
  }
  const token = param(url, 'token') ?? param(url, 'otp');
  const email = param(url, 'email');
  if (token && email) await supabase.auth.verifyOtp({ email, token, type: 'email' });
}
