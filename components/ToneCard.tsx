import { memo, type ReactNode, type Ref } from 'react';
import { Pressable, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';

import { cardChrome, useThemedStyles, type CardTone, type ColorSchemeName, type ThemeColors } from '@/lib/theme';

export const ToneCard = memo(function ToneCard({
  tone = 'default',
  onPress,
  disabled,
  style,
  children,
  cardRef,
  onLayout,
}: {
  tone?: CardTone;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
  cardRef?: Ref<View>;
  onLayout?: (event: LayoutChangeEvent) => void;
}) {
  const styles = useThemedStyles(toneCardStyles);
  const chrome = [styles.base, tone === 'premium' && styles.premium, tone === 'app' && styles.app, style];
  if (onPress) {
    return (
      <Pressable onPress={onPress} disabled={disabled} style={({ pressed }) => [...chrome, pressed && styles.pressed]}>
        {children}
      </Pressable>
    );
  }
  return (
    <View ref={cardRef} collapsable={false} style={chrome} onLayout={onLayout}>
      {children}
    </View>
  );
});

function toneCardStyles(colors: ThemeColors, scheme: ColorSchemeName) {
  return {
    base: cardChrome(colors, scheme, 'default'),
    premium: cardChrome(colors, scheme, 'premium'),
    app: cardChrome(colors, scheme, 'app'),
    pressed: { opacity: 0.86 },
  };
}
