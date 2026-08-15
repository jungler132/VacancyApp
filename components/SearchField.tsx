import { memo, useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { Searchbar } from 'react-native-paper';

import { colors, radius } from '@/lib/theme';

export const SearchField = memo(function SearchField({
  onSearch,
}: {
  onSearch: (value: string) => void;
}) {
  const [text, setText] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => onSearch(text.trim()), text ? 400 : 0);
    return () => clearTimeout(timer);
  }, [text, onSearch]);

  return (
    <Searchbar
      value={text}
      onChangeText={setText}
      placeholder="Должность или компания"
      autoCorrect={false}
      autoCapitalize="none"
      returnKeyType="search"
      elevation={0}
      style={styles.bar}
      inputStyle={styles.input}
      iconColor={colors.placeholder}
      placeholderTextColor={colors.placeholder}
    />
  );
});

const styles = StyleSheet.create({
  bar: {
    backgroundColor: 'rgba(18, 26, 40, 0.78)',
    borderWidth: 1,
    borderColor: colors.chipBorder,
    borderRadius: radius.md,
    height: 44,
  },
  input: {
    minHeight: 44,
    fontSize: 15,
  },
});
