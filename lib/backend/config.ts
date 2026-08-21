export const MEDIA_BUCKET = 'media';
export const JOBS_TABLE = 'vakano_jobs';
export const CATALOG_PAGE = 200;
export const EMAIL_OTP_LENGTH = 8;

export function backendConfigured(): boolean {
  return Boolean(process.env.EXPO_PUBLIC_SUPABASE_URL && process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);
}

export function backendUrl(): string {
  return process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
}

export function backendAnonKey(): string {
  return process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
}
