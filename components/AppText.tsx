import { memo } from 'react';
import {
  StyleSheet,
  Text as RNText,
  TextInput as RNTextInput,
  type TextInputProps,
  type TextProps,
} from 'react-native';

import { scheduleKeyboardReveal } from '@/lib/keyboardInset';

import { scaleFont, useFontScale } from '@/lib/fontScale';
import { fonts, useColors } from '@/lib/theme';

function scaledStyle(style: TextProps['style'], scale: number) {
  const flat = StyleSheet.flatten(style);
  if (!flat) return style;
  const fontSize = flat.fontSize != null ? scaleFont(flat.fontSize, scale) : undefined;
  const lineHeight =
    flat.lineHeight != null ? scaleFont(flat.lineHeight, scale) : fontSize != null ? Math.ceil(fontSize * 1.35) : undefined;
  if (fontSize == null && lineHeight == null) return style;
  return [style, { fontSize, lineHeight }];
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
  onFocus,
  ...props
}: TextInputProps) {
  const scale = useFontScale();
  const colors = useColors();
  return (
    <RNTextInput
      {...props}
      allowFontScaling={allowFontScaling}
      placeholderTextColor={placeholderTextColor ?? colors.placeholder}
      onFocus={(event) => {
        onFocus?.(event);
        scheduleKeyboardReveal();
      }}
      style={[
        { color: colors.text, fontFamily: fonts.regular, paddingVertical: 10, includeFontPadding: false },
        scaledStyle(style, scale),
      ]}
    />
  );
});
