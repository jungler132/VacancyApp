import { memo, useCallback, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/AppText';
import { colors, fonts, radius } from '@/lib/theme';

export const NavRow = memo(function NavRow({
  title,
  meta,
  onPress,
  right,
}: {
  title: string;
  meta?: string;
  onPress: () => void;
  right?: ReactNode;
}) {
  const press = useCallback(() => onPress(), [onPress]);
  return (
    <Pressable onPress={press} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={styles.body}>
        <Text style={styles.title}>{title}</Text>
        {meta ? <Text style={styles.meta}>{meta}</Text> : null}
      </View>
      {right !== undefined ? right : <Text style={styles.chevron}>›</Text>}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  body: { flex: 1, minWidth: 0 },
  title: { color: colors.text, fontFamily: fonts.semibold, fontSize: 15 },
  meta: { color: colors.faint, fontFamily: fonts.medium, fontSize: 12, marginTop: 2 },
  chevron: { color: colors.faint, fontSize: 22, lineHeight: 24 },
  pressed: { opacity: 0.86 },
});
