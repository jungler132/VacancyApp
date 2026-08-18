import { Children, memo, type ReactNode } from 'react';
import { View, type ViewStyle } from 'react-native';

import { useThemedStyles, type ThemeColors } from '@/lib/theme';

export const ChipWrap = memo(function ChipWrap({
  children,
  center,
  style,
}: {
  children: ReactNode;
  center?: boolean;
  style?: ViewStyle;
}) {
  const styles = useThemedStyles(chipWrapStyles);
  return (
    <View style={[styles.wrap, center && styles.center, style]}>
      {Children.map(children, (child) =>
        child == null || child === false ? null : (
          <View style={styles.item} collapsable={false}>
            {child}
          </View>
        ),
      )}
    </View>
  );
});

function chipWrapStyles(_colors: ThemeColors) {
  return {
    wrap: { flexDirection: 'row' as const, flexWrap: 'wrap' as const },
    center: { justifyContent: 'center' as const },
    item: {
      flexGrow: 0,
      flexShrink: 0,
      alignSelf: 'flex-start' as const,
      marginRight: 8,
      marginBottom: 8,
    },
  };
}
