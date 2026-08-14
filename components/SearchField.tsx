import { memo, useEffect, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { colors, fonts, radius } from '@/lib/theme';

export const SearchField = memo(function SearchField({
  onSearch,
}: {
  onSearch: (value: string) => void;
}) {
  const [text, setText] = useState('');
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => onSearch(text.trim()), text ? 400 : 0);
    return () => clearTimeout(timer);
  }, [text, onSearch]);

  return (
    <View style={[styles.wrap, focused && styles.focused]}>
      <SymbolView
        name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
        tintColor={focused ? colors.accent : colors.placeholder}
        size={18}
      />
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="Должность или компания"
        placeholderTextColor={colors.placeholder}
        style={styles.input}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
        blurOnSubmit={false}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(18, 26, 40, 0.78)',
    borderColor: colors.chipBorder,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 2,
  },
  focused: {
    borderColor: colors.accent,
  },
  input: {
    flex: 1,
    color: colors.text,
        paddingVertical: 6,
    fontSize: 15,
    fontFamily: fonts.regular,
  },
});
