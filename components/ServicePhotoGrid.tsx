import { memo, useCallback } from 'react';
import { Pressable, View } from 'react-native';

import { AppImage } from '@/components/AppImage';
import { Text } from '@/components/AppText';
import { fonts, radius, useThemedStyles, type ThemeColors } from '@/lib/theme';

export const ServicePhotoGrid = memo(function ServicePhotoGrid({
  uris,
  canAdd,
  onAdd,
  onRemove,
}: {
  uris: string[];
  canAdd?: boolean;
  onAdd?: () => void;
  onRemove?: (uri: string) => void;
}) {
  const styles = useThemedStyles(photoGridStyles);
  return (
    <View style={styles.row}>
      {uris.map((uri) => (
        <PhotoThumb key={uri} uri={uri} onRemove={onRemove} />
      ))}
      {canAdd && onAdd ? (
        <Pressable onPress={onAdd} style={styles.add}>
          <Text style={styles.addText}>+</Text>
        </Pressable>
      ) : null}
    </View>
  );
});

const PhotoThumb = memo(function PhotoThumb({
  uri,
  onRemove,
}: {
  uri: string;
  onRemove?: (uri: string) => void;
}) {
  const styles = useThemedStyles(photoGridStyles);
  const press = useCallback(() => onRemove?.(uri), [onRemove, uri]);
  if (!onRemove) return <AppImage uri={uri} style={styles.photo} />;
  return (
    <Pressable onPress={press}>
      <AppImage uri={uri} style={styles.photo} />
    </Pressable>
  );
});

function photoGridStyles(colors: ThemeColors) {
  return {
    row: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 8 },
    photo: { width: 72, height: 72, borderRadius: radius.md, backgroundColor: colors.chip },
    add: {
      width: 72,
      height: 72,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.chipBorder,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor: colors.card,
    },
    addText: { color: colors.accent, fontFamily: fonts.medium, fontSize: 28, lineHeight: 32 },
  };
}
