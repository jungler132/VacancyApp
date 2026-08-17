import { memo, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fonts, radius } from '@/lib/theme';

export const FiltersButton = memo(function FiltersButton({
  active,
  onPress,
}: {
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Button
      mode={active ? 'contained-tonal' : 'outlined'}
      compact
      onPress={onPress}
      icon="filter-variant"
      style={styles.filterBtn}
      labelStyle={styles.filterLabel}>
      Фильтры
    </Button>
  );
});

export const AppHeader = memo(function AppHeader({
  title,
  subtitle,
  right,
  children,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  children?: ReactNode;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
      <View style={styles.row}>
        <View style={styles.titles}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {right}
      </View>
      {children}
    </View>
  );
});

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    backgroundColor: colors.bg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.cardBorder,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 36 },
  titles: { flex: 1, minWidth: 0 },
  title: { color: colors.text, fontSize: 18, fontFamily: fonts.semibold },
  subtitle: { color: colors.faint, fontSize: 12, fontFamily: fonts.medium, marginTop: 2 },
  filterBtn: { borderColor: colors.chipBorder, borderRadius: radius.md },
  filterLabel: { marginVertical: 6, fontSize: 12 },
});
