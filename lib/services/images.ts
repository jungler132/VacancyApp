import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

import { isRemoteUri } from '@/lib/backend/merge';

const AVATAR = 512;
const PHOTO = 1280;

export async function compressImage(uri: string, kind: 'avatar' | 'photo' = 'photo'): Promise<string> {
  if (!uri || isRemoteUri(uri) || /ImageManipulator/i.test(uri)) return uri;
  try {
    const saved = await manipulateAsync(uri, [{ resize: { width: kind === 'avatar' ? AVATAR : PHOTO } }], {
      compress: 0.7,
      format: SaveFormat.JPEG,
    });
    return saved.uri || uri;
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
    });
    if (result.canceled) return undefined;
    const uri = result.assets[0]?.uri;
    if (!uri) return undefined;
    return compressImage(uri, opts?.square ? 'avatar' : 'photo');
  } catch {
    return undefined;
  }
}
