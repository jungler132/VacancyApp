import { memo, useEffect, useState } from 'react';
import { View } from 'react-native';

import { AppImage } from '@/components/AppImage';
import { Text } from '@/components/AppText';
import { initialsOf } from '@/lib/services/kinds';
import { fonts, useThemedStyles, type ColorSchemeName, type ThemeColors } from '@/lib/theme';

export const ServiceAvatar = memo(function ServiceAvatar({
  uri,
  name,
  size,
}: {
  uri?: string;
  name: string;
  size: number;
}) {
  const styles = useThemedStyles(serviceAvatarStyles);
  const [failed, setFailed] = useState(false);
  const radius = size / 2;
  const box = { width: size, height: size, borderRadius: radius };
  const showImage = Boolean(uri) && !failed;

  useEffect(() => {
    setFailed(false);
  }, [uri]);

  if (showImage) {
    return <AppImage uri={uri!} style={[styles.image, box]} onError={() => setFailed(true)} />;
  }

  return (
    <View style={[styles.fallback, box]}>
      <Text style={[styles.initials, { fontSize: Math.round(size * 0.3) }]}>{initialsOf(name)}</Text>
    </View>
  );
});

function serviceAvatarStyles(colors: ThemeColors, _scheme: ColorSchemeName) {
  return {
    image: { backgroundColor: colors.chip },
    fallback: {
      backgroundColor: colors.accentDim,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    initials: { color: colors.accent, fontFamily: fonts.bold },
  };
}
