import { compressImage } from '@/lib/services/images';

import { MEDIA_BUCKET } from './config';
import { isRemoteUri } from './merge';
import { getSupabase } from './supabase';

function extPath(userId: string, kind: string, name: string) {
  return `${userId}/${kind}/${name}.jpg`;
}

export async function uploadMedia(userId: string, uri: string, kind: string, name: string): Promise<string> {
  if (!uri || isRemoteUri(uri)) return uri;
  const supabase = getSupabase();
  if (!supabase) return uri;
  try {
    const local = await compressImage(uri, kind === 'avatar' ? 'avatar' : 'photo');
    const response = await fetch(local);
    if (!response.ok) return uri;
    const body = new Uint8Array(await response.arrayBuffer());
    const path = extPath(userId, kind, name);
    const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, body, {
      contentType: 'image/jpeg',
      cacheControl: '3600',
      upsert: true,
    });
    if (error) return uri;
    const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);
    return data.publicUrl || uri;
  } catch {
    return uri;
  }
}

export async function uploadMany(userId: string, uris: string[], kind: string): Promise<string[]> {
  return Promise.all(uris.map((uri, index) => uploadMedia(userId, uri, kind, String(index))));
}

export async function deleteOfferMedia(userId: string, offerId: string) {
  const supabase = getSupabase();
  if (!supabase) return;
  const prefix = `${userId}/offers/${offerId}`;
  const { data } = await supabase.storage.from(MEDIA_BUCKET).list(prefix);
  if (!data?.length) return;
  await supabase.storage.from(MEDIA_BUCKET).remove(data.map((file) => `${prefix}/${file.name}`));
}
