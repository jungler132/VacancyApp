import { memo, useCallback, useState } from 'react';
import { Pressable, View } from 'react-native';

import { AppImage } from '@/components/AppImage';
import { PhotoLightbox } from '@/components/PhotoLightbox';
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
  const [preview, setPreview] = useState<number | null>(null);
  const close = useCallback(() => setPreview(null), []);
  return (
    <View style={styles.row}>
      {uris.map((uri, index) => (
        <PhotoThumb
          key={uri}
          uri={uri}
          onRemove={onRemove}
          onOpen={onRemove ? undefined : () => setPreview(index)}
        />
      ))}
      {canAdd && onAdd ? (
        <Pressable onPress={onAdd} style={styles.add}>
          <Text style={styles.addText}>+</Text>
        </Pressable>
      ) : null}
      {preview != null ? <PhotoLightbox uris={uris} index={preview} onClose={close} /> : null}
    </View>
  );
});

const PhotoThumb = memo(function PhotoThumb({
  uri,
  onRemove,
  onOpen,
}: {
  uri: string;
  onRemove?: (uri: string) => void;
  onOpen?: () => void;
}) {
  const styles = useThemedStyles(photoGridStyles);
  const press = useCallback(() => {
    if (onRemove) onRemove(uri);
    else onOpen?.();
  }, [onOpen, onRemove, uri]);
  if (!onRemove && !onOpen) return <AppImage uri={uri} style={styles.photo} />;
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
