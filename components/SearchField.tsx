import { memo, useEffect, useState } from 'react';
import { Searchbar } from 'react-native-paper';

import { scaleFont, useFontScale } from '@/lib/fontScale';
import { fonts, radius, shadowsFor, useColors, useThemedStyles, type ColorSchemeName, type ThemeColors } from '@/lib/theme';

export const SearchField = memo(function SearchField({
  value = '',
  onSearch,
  placeholder = '',
}: {
  value?: string;
  onSearch: (value: string) => void;
  placeholder?: string;
}) {
  const [text, setText] = useState(value);
  const scale = useFontScale();
  const colors = useColors();
  const styles = useThemedStyles(searchStyles);

  useEffect(() => {
    setText(value);
  }, [value]);

  useEffect(() => {
    if (text.trim() === value.trim()) return;
    const timer = setTimeout(() => onSearch(text.trim()), text ? 400 : 0);
    return () => clearTimeout(timer);
  }, [text, onSearch, value]);

  return (
    <Searchbar
      value={text}
      onChangeText={setText}
      placeholder={placeholder}
      autoCorrect={false}
      autoCapitalize="none"
      returnKeyType="search"
      elevation={0}
      style={styles.bar}
      inputStyle={[styles.input, { fontSize: scaleFont(15, scale) }]}
      iconColor={colors.faint}
      placeholderTextColor={colors.placeholder}
    />
  );
});

function searchStyles(colors: ThemeColors, scheme: ColorSchemeName) {
  return {
    bar: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      borderRadius: radius.md,
      height: 48,
      ...shadowsFor(scheme).card,
    },
    input: {
      minHeight: 48,
      fontSize: 15,
      fontFamily: fonts.regular,
    },
  };
}
