import * as ImagePicker from 'expo-image-picker';

export async function pickServiceImage(opts?: { square?: boolean }): Promise<string | undefined> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: Boolean(opts?.square),
    aspect: opts?.square ? [1, 1] : undefined,
    quality: 0.8,
  });
  if (result.canceled) return undefined;
  return result.assets[0]?.uri;
}
