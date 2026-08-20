import { memo, useCallback, useMemo, useRef, useState } from 'react';
import { Keyboard, Pressable, View } from 'react-native';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';

import { Text, TextInput } from '@/components/AppText';
import { useFormStyles } from '@/components/FormField';
import { useLocale, useT } from '@/lib/i18n/useT';
import { getPlace, placeLabel, searchPlaces } from '@/lib/places';
import { fonts, radius, useColors, useThemedStyles, type ColorSchemeName, type ThemeColors } from '@/lib/theme';
import type { RegionId } from '@/lib/types';

export const PlacePicker = memo(function PlacePicker({
  label,
  value,
  onChange,
  region = 'all',
  allowCountry = false,
  placeholder,
}: {
  label?: string;
  value?: string;
  onChange: (id: string) => void;
  region?: RegionId;
  allowCountry?: boolean;
  placeholder?: string;
}) {
  const t = useT();
  const locale = useLocale();
  const colors = useColors();
  const formStyles = useFormStyles();
  const styles = useThemedStyles(placePickerStyles);
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const picking = useRef(false);
  const selected = getPlace(value);
  const selectedLabel = selected ? placeLabel(selected.id, locale) : '';
  const options = useMemo(() => {
    const needle = query.trim();
    if (!needle) return [];
    const found = searchPlaces(needle, region);
    return (allowCountry ? found : found.filter((item) => item.kind === 'city')).slice(0, 8);
  }, [allowCountry, query, region]);
  const open = focused && query.trim().length > 0;
  const text = focused ? query : selectedLabel;

  const onFocus = useCallback(() => {
    setFocused(true);
    setQuery(selectedLabel);
  }, [selectedLabel]);

  const onBlur = useCallback(() => {
    if (picking.current) return;
    setFocused(false);
    setQuery('');
  }, []);

  const pick = useCallback(
    (id: string) => {
      picking.current = true;
      onChange(id);
      setQuery('');
      setFocused(false);
      Keyboard.dismiss();
      picking.current = false;
    },
    [onChange],
  );

  const clear = useCallback(() => {
    onChange('');
    setQuery('');
  }, [onChange]);

  return (
    <View>
      {label ? <Text style={formStyles.label}>{label}</Text> : null}
      <View style={styles.field}>
        <TextInput
          value={text}
          onChangeText={setQuery}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder={placeholder ?? t('filters.placeSearch')}
          placeholderTextColor={colors.placeholder}
          style={[formStyles.input, styles.input, selected && !focused ? styles.inputPicked : null]}
          autoCorrect={false}
          autoCapitalize="none"
        />
        {selected && !focused ? (
          <Pressable onPress={clear} hitSlop={10} style={styles.clear} accessibilityLabel={t('common.reset')}>
            <MaterialDesignIcons name="close" size={18} color={colors.faint} />
          </Pressable>
        ) : null}
      </View>
      {open ? (
        <View style={styles.menu}>
          {options.length ? (
            options.map((item, index) => (
              <PlaceRow
                key={item.id}
                id={item.id}
                label={placeLabel(item.id, locale)}
                meta={item.kind === 'country' ? t('filters.country') : placeLabel(`country:${item.countryId}`, locale)}
                selected={value === item.id}
                lined={index > 0}
                onPick={pick}
              />
            ))
          ) : (
            <Text style={styles.empty}>{t('filters.placeEmpty')}</Text>
          )}
        </View>
      ) : null}
    </View>
  );
});

const PlaceRow = memo(function PlaceRow({
  id,
  label,
  meta,
  selected,
  lined,
  onPick,
}: {
  id: string;
  label: string;
  meta: string;
  selected: boolean;
  lined: boolean;
  onPick: (id: string) => void;
}) {
  const styles = useThemedStyles(placePickerStyles);
  const press = useCallback(() => onPick(id), [id, onPick]);
  return (
    <Pressable onPressIn={press} style={[styles.row, lined && styles.rowLine, selected && styles.rowOn]}>
      <Text style={[styles.rowTitle, selected && styles.rowTitleOn]}>{label}</Text>
      {meta ? <Text style={styles.rowMeta}>{meta}</Text> : null}
    </Pressable>
  );
});

function placePickerStyles(colors: ThemeColors, _scheme: ColorSchemeName) {
  return {
    field: { position: 'relative' as const },
    input: { paddingRight: 40 },
    inputPicked: { color: colors.accent },
    clear: {
      position: 'absolute' as const,
      right: 10,
      top: 0,
      bottom: 0,
      justifyContent: 'center' as const,
    },
    menu: {
      marginTop: 4,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      backgroundColor: colors.card,
      overflow: 'hidden' as const,
    },
    row: {
      paddingHorizontal: 12,
      paddingVertical: 10,
      gap: 2,
    },
    rowLine: {
      borderTopWidth: 1,
      borderTopColor: colors.cardBorder,
    },
    rowOn: { backgroundColor: colors.accentDim },
    rowTitle: { color: colors.text, fontFamily: fonts.medium, fontSize: 15 },
    rowTitleOn: { color: colors.accent, fontFamily: fonts.semibold },
    rowMeta: { color: colors.faint, fontFamily: fonts.medium, fontSize: 12 },
    empty: {
      color: colors.faint,
      fontFamily: fonts.medium,
      fontSize: 13,
      paddingHorizontal: 12,
      paddingVertical: 12,
    },
  };
}
