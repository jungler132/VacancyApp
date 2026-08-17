import { memo } from 'react';
import {
  StyleSheet,
  Text as RNText,
  TextInput as RNTextInput,
  type TextInputProps,
  type TextProps,
} from 'react-native';

import { scaleFont, useFontScale } from '@/lib/fontScale';

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
  return <RNText {...props} allowFontScaling={allowFontScaling} style={scaledStyle(style, scale)} />;
});

export const TextInput = memo(function TextInput({
  style,
  allowFontScaling = false,
  ...props
}: TextInputProps) {
  const scale = useFontScale();
  return <RNTextInput {...props} allowFontScaling={allowFontScaling} style={scaledStyle(style, scale)} />;
});
