import { memo } from 'react';
import { View, type TextInputProps } from 'react-native';

import { Text, TextInput } from '@/components/AppText';
import { scaleFont, useFontScale } from '@/lib/fontScale';
import { fonts, radius, useColors, useThemedStyles, type ColorSchemeName, type ThemeColors } from '@/lib/theme';

export const FormField = memo(function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  keyboardType,
  maxLength,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  multiline?: boolean;
  keyboardType?: TextInputProps['keyboardType'];
  maxLength?: number;
}) {
  const colors = useColors();
  const formStyles = useFormStyles();
  const scale = useFontScale();
  return (
    <View>
      <Text style={formStyles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
        style={[
          formStyles.input,
          { minHeight: scaleFont(multiline ? 120 : 48, scale) },
          multiline && formStyles.area,
        ]}
        multiline={multiline}
        keyboardType={keyboardType}
        maxLength={maxLength}
        autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
  );
});

export function useFormStyles() {
  return useThemedStyles(formStyleFactory);
}

function formStyleFactory(colors: ThemeColors, _scheme: ColorSchemeName) {
  return {
    screen: { flex: 1, backgroundColor: colors.bg },
    content: { padding: 20, paddingBottom: 88, gap: 12 },
    center: { flex: 1, backgroundColor: colors.bg, justifyContent: 'center' as const, padding: 24 },
    lead: { color: colors.muted, fontFamily: fonts.medium, fontSize: 14, lineHeight: 20 },
    label: { color: colors.muted, fontFamily: fonts.semibold, fontSize: 12, marginBottom: 6 },
    hint: { color: colors.faint, fontFamily: fonts.medium, fontSize: 12, lineHeight: 18 },
    input: {
      minHeight: 48,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.chipBorder,
      backgroundColor: colors.card,
      color: colors.text,
      fontFamily: fonts.medium,
      fontSize: 15,
      paddingHorizontal: 12,
      paddingVertical: 12,
    },
    area: { minHeight: 120, paddingTop: 12 },
    primary: {
      height: 48,
      borderRadius: radius.full,
      backgroundColor: colors.accent,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    primaryText: { color: colors.accentText, fontFamily: fonts.bold, fontSize: 16 },
    secondary: {
      height: 48,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.chipBorder,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    secondaryText: { color: colors.text, fontFamily: fonts.semibold, fontSize: 16 },
    pressed: { opacity: 0.86 },
  };
}
