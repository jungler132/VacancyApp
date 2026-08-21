import { cacheDirectory, copyAsync } from 'expo-file-system/legacy';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

import { isRemoteUri } from '@/lib/backend/merge';

const AVATAR = 512;
const PHOTO = 1280;

async function toJpeg(uri: string, width?: number): Promise<string | undefined> {
  const saved = await manipulateAsync(uri, width ? [{ resize: { width } }] : [], {
    compress: width ? 0.7 : 0.8,
    format: SaveFormat.JPEG,
  });
  return saved.uri || undefined;
}

export async function compressImage(uri: string, kind: 'avatar' | 'photo' = 'photo'): Promise<string> {
  if (!uri || isRemoteUri(uri)) return uri;
  const width = kind === 'avatar' ? AVATAR : PHOTO;
  try {
    return (await toJpeg(uri, width)) || uri;
  } catch {
    try {
      return (await toJpeg(uri)) || uri;
    } catch {
      return uri;
    }
  }
}

async function persistPicked(uri: string): Promise<string> {
  if (!uri || isRemoteUri(uri) || !cacheDirectory) return uri;
  const dest = `${cacheDirectory}vakano-pick-${Date.now().toString(36)}.jpg`;
  try {
    await copyAsync({ from: uri, to: dest });
    return dest;
  } catch {
    return uri;
  }
}

export async function pickServiceImage(opts?: { square?: boolean }): Promise<string | undefined> {
  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: Boolean(opts?.square),
      aspect: opts?.square ? [1, 1] : undefined,
      quality: 0.8,
      exif: false,
      preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode?.Compatible,
    });
    if (result.canceled) return undefined;
    const uri = result.assets[0]?.uri;
    if (!uri) return undefined;
    return persistPicked(await compressImage(uri, opts?.square ? 'avatar' : 'photo'));
  } catch {
    return undefined;
  }
}
