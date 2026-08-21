import { cacheDirectory, copyAsync, EncodingType, readAsStringAsync } from 'expo-file-system/legacy';

import { compressImage } from '@/lib/services/images';

import { MEDIA_BUCKET } from './config';
import { isRemoteUri } from './merge';
import { getSupabase } from './supabase';

function extPath(userId: string, kind: string, name: string) {
  return `${userId}/${kind}/${name}-${Date.now().toString(36)}.jpg`;
}

function fromBase64(value: string): Uint8Array {
  if (typeof atob === 'function') {
    const binary = atob(value);
    const out = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
    return out;
  }
  return Uint8Array.from(Buffer.from(value, 'base64'));
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

async function persistCache(uri: string): Promise<string> {
  if (!uri || isRemoteUri(uri) || !cacheDirectory) return uri;
  const dest = `${cacheDirectory}vakano-${Date.now().toString(36)}.jpg`;
  try {
    await copyAsync({ from: uri, to: dest });
    return dest;
  } catch {
    return uri;
  }
}

async function readBytes(uri: string): Promise<Uint8Array | null> {
  try {
    const base64 = await readAsStringAsync(uri, { encoding: EncodingType.Base64 });
    if (base64) return fromBase64(base64);
  } catch {
    // content:// and some Android caches fail here; try fetch next
  }
  try {
    const response = await fetch(uri);
    if (!response.ok) return null;
    return new Uint8Array(await response.arrayBuffer());
  } catch {
    return null;
  }
}

export async function uploadMedia(userId: string, uri: string, kind: string, name: string): Promise<string> {
  if (!uri || isRemoteUri(uri)) return uri;
  const supabase = getSupabase();
  if (!supabase) throw new Error('no backend');
  const local = await persistCache(await compressImage(uri, kind === 'avatar' ? 'avatar' : 'photo'));
  const body = (await readBytes(local)) ?? (local !== uri ? await readBytes(uri) : null);
  if (!body?.length) throw new Error('empty image');
  const path = extPath(userId, kind, name);
  const options = { contentType: 'image/jpeg', cacheControl: '3600', upsert: true };
  let { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, body, options);
  if (error) {
    ({ error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, toArrayBuffer(body), options));
  }
  if (error && typeof Blob !== 'undefined') {
    ({ error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, new Blob([toArrayBuffer(body)], { type: 'image/jpeg' }), options));
  }
  if (error) throw error;
  const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);
  if (!data.publicUrl) throw new Error('no public url');
  return `${data.publicUrl}?v=${Date.now().toString(36)}`;
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
