import { memo } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { Text } from '@/components/AppText';
import { initialsOf } from '@/lib/services/kinds';
import { colors, fonts } from '@/lib/theme';

export const ServiceAvatar = memo(function ServiceAvatar({
  uri,
  name,
  size,
}: {
  uri?: string;
  name: string;
  size: number;
}) {
  const radius = size / 2;
  const box = { width: size, height: size, borderRadius: radius };

  if (uri) return <Image source={{ uri }} style={[styles.image, box]} />;

  return (
    <View style={[styles.fallback, box]}>
      <Text style={[styles.initials, { fontSize: Math.round(size * 0.3) }]}>{initialsOf(name)}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  image: { backgroundColor: colors.chip },
  fallback: {
    backgroundColor: colors.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { color: colors.accent, fontFamily: fonts.bold },
});
