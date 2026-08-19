import { memo } from 'react';
import { Image, type ImageStyle, type StyleProp } from 'react-native';

export const AppImage = memo(function AppImage({
  uri,
  style,
}: {
  uri: string;
  style?: StyleProp<ImageStyle>;
}) {
  return <Image source={{ uri }} style={style} resizeMode="cover" resizeMethod="resize" />;
});
