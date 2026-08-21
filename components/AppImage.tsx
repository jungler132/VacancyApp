import { memo, useEffect, useState } from 'react';
import { Image, type ImageStyle, type StyleProp } from 'react-native';

export const AppImage = memo(function AppImage({
  uri,
  style,
  onError,
}: {
  uri: string;
  style?: StyleProp<ImageStyle>;
  onError?: () => void;
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
      resizeMode="cover"
      resizeMethod="resize"
      onError={() => {
        setFailed(true);
        onError?.();
      }}
    />
  );
});
