import { memo } from 'react';
import {
  StyleSheet,
  Text as RNText,
  TextInput as RNTextInput,
  type TextInputProps,
  type TextProps,
} from 'react-native';

import { scaleFont, useFontScale } from '@/lib/fontScale';
import { fonts, useColors } from '@/lib/theme';

function scaledStyle(style: TextProps['style'], scale: number) {
  if (scale === 1 || style == null) return style;
  const flat = StyleSheet.flatten(style);
  if (!flat || (flat.fontSize == null && flat.lineHeight == null)) return style;
  return [
    style,
    {
      fontSize: flat.fontSize != null ? scaleFont(flat.fontSize, scale) : undefined,
      lineHeight: flat.lineHeight != null ? scaleFont(flat.lineHeight, scale) : undefined,
    },
  ];
}

export const Text = memo(function Text({ style, allowFontScaling = false, ...props }: TextProps) {
  const scale = useFontScale();
  const colors = useColors();
  return (
    <RNText
      {...props}
      allowFontScaling={allowFontScaling}
      style={[{ color: colors.text, fontFamily: fonts.regular }, scaledStyle(style, scale)]}
    />
  );
});

export const TextInput = memo(function TextInput({
  style,
  allowFontScaling = false,
  placeholderTextColor,
  ...props
}: TextInputProps) {
  const scale = useFontScale();
  const colors = useColors();
  return (
    <RNTextInput
      {...props}
      allowFontScaling={allowFontScaling}
      placeholderTextColor={placeholderTextColor ?? colors.placeholder}
      style={[{ color: colors.text, fontFamily: fonts.regular }, scaledStyle(style, scale)]}
    />
  );
});
