import { memo } from 'react';
import { StyleSheet, View, type TextInputProps } from 'react-native';

import { Text, TextInput } from '@/components/AppText';
import { colors, fonts, radius } from '@/lib/theme';

export const FormField = memo(function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  multiline?: boolean;
  keyboardType?: TextInputProps['keyboardType'];
}) {
  return (
    <View>
      <Text style={formStyles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
        style={[formStyles.input, multiline && formStyles.area]}
        multiline={multiline}
        keyboardType={keyboardType}
        autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
  );
});

export const formStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingBottom: 48, gap: 12 },
  center: { flex: 1, backgroundColor: colors.bg, justifyContent: 'center', padding: 24 },
  lead: { color: colors.muted, fontFamily: fonts.medium, fontSize: 14, lineHeight: 20 },
  label: { color: colors.muted, fontFamily: fonts.semibold, fontSize: 12, marginBottom: 6 },
  hint: { color: colors.faint, fontFamily: fonts.medium, fontSize: 12, lineHeight: 18 },
  input: {
    minHeight: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.chipBorder,
    backgroundColor: colors.card,
    color: colors.text,
    fontFamily: fonts.medium,
    fontSize: 15,
    paddingHorizontal: 12,
  },
  area: { minHeight: 120, paddingTop: 12 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  primary: {
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { color: colors.accentText, fontFamily: fonts.bold, fontSize: 16 },
  secondary: {
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.chipBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: { color: colors.text, fontFamily: fonts.semibold, fontSize: 16 },
  pressed: { opacity: 0.86 },
});
