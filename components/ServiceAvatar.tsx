import { memo } from 'react';
import { Image, View } from 'react-native';

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
  const radius = size / 2;
  const box = { width: size, height: size, borderRadius: radius };

  if (uri) return <Image source={{ uri }} style={[styles.image, box]} />;

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
