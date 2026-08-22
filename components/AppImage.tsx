import { memo, useEffect, useState } from 'react';
import { type ImageStyle, type StyleProp } from 'react-native';
import { Image } from 'expo-image';

export const AppImage = memo(function AppImage({
  uri,
  style,
  onError,
  contentFit = 'cover',
}: {
  uri: string;
  style?: StyleProp<ImageStyle>;
  onError?: () => void;
  contentFit?: 'cover' | 'contain';
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [uri]);

  if (failed) return null;

  return (
    <Image
      source={{ uri }}
      style={style}
      contentFit={contentFit}
      cachePolicy="memory-disk"
      recyclingKey={uri}
      transition={0}
      priority="low"
      onError={() => {
        setFailed(true);
        onError?.();
      }}
    />
  );
});
