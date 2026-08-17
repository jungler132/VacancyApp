import { memo, useCallback, useMemo, useRef, useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as WebBrowser from 'expo-web-browser';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';

import { catalogFacts, countryMeta, type CatalogLink } from '@/lib/telegramGroups';
import { Text } from '@/components/AppText';
import { selectIsCatalogSaved } from '@/lib/store/selectors';
import { toSavedCatalogItem, toggleSavedCatalog } from '@/lib/store/savedCatalogSlice';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { colors, fonts, radius, regionColor } from '@/lib/theme';

async function openCatalogLink(item: CatalogLink) {
  if (item.handle) {
    await Linking.openURL(item.url);
    return;
  }
  await WebBrowser.openBrowserAsync(item.url);
}

export const CatalogLinkCard = memo(function CatalogLinkCard({
  item,
  telegram,
}: {
  item: CatalogLink;
  telegram: boolean;
}) {
  const dispatch = useAppDispatch();
  const saved = useAppSelector(selectIsCatalogSaved(telegram ? 'telegram' : 'site', item.id));
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const country = countryMeta(item.country);
  const tint = regionColor[country.region] ?? colors.muted;
  const facts = useMemo(() => (open ? catalogFacts(item, telegram) : []), [open, item, telegram]);

  const onOpen = useCallback(() => {
    openCatalogLink(item).catch(() => undefined);
  }, [item]);

  const onCopy = useCallback(async () => {
    await Clipboard.setStringAsync(item.url);
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1600);
  }, [item.url]);

  const onToggle = useCallback(() => {
    dispatch(toggleSavedCatalog(toSavedCatalogItem(item, telegram)));
  }, [dispatch, item, telegram]);

  return (
    <Pressable
      onPress={() => setOpen((value) => !value)}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.cardHead}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <View style={[styles.countryBadge, { borderColor: tint }]}>
          <Text style={[styles.countryLabel, { color: tint }]}>{country.label}</Text>
        </View>
        <Pressable
          onPress={(event) => {
            event.stopPropagation();
            onToggle();
          }}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={saved ? 'Убрать из избранного' : 'Сохранить'}>
          <MaterialDesignIcons
            name={saved ? 'star' : 'star-outline'}
            size={20}
            color={saved ? colors.accent : colors.faint}
          />
        </Pressable>
      </View>
      {telegram && item.handle ? <Text style={styles.handle}>@{item.handle}</Text> : null}
      {open ? (
        <View style={styles.details}>
          {item.note ? <Text style={styles.note}>{item.note}</Text> : null}
          {facts.map((fact) => (
            <View key={fact.label} style={styles.fact}>
              <Text style={styles.factLabel}>{fact.label}</Text>
              <Text style={styles.factValue}>{fact.value}</Text>
            </View>
          ))}
          <Pressable
            onPress={(event) => {
              event.stopPropagation();
              onCopy();
            }}
            hitSlop={6}>
            <Text style={styles.url} numberOfLines={2}>
              {copied ? 'Скопировано' : item.url}
            </Text>
          </Pressable>
          <Pressable
            onPress={(event) => {
              event.stopPropagation();
              onOpen();
            }}
            style={({ pressed }) => [styles.openBtn, pressed && styles.pressed]}>
            <MaterialDesignIcons name={telegram ? 'send' : 'open-in-new'} size={16} color={colors.accentText} />
            <Text style={styles.openLabel}>Открыть</Text>
          </Pressable>
        </View>
      ) : null}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 14,
    marginBottom: 10,
  },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  cardTitle: { color: colors.text, fontSize: 16, fontFamily: fonts.semibold, flex: 1 },
  countryBadge: {
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: 7,
    paddingVertical: 3,
    maxWidth: 140,
  },
  countryLabel: { fontSize: 11, fontFamily: fonts.semibold },
  handle: { color: colors.faint, fontSize: 13, fontFamily: fonts.medium, marginTop: 4 },
  details: { marginTop: 12, gap: 8 },
  note: { color: colors.muted, fontSize: 13, lineHeight: 18, marginBottom: 4 },
  fact: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  factLabel: { color: colors.faint, fontSize: 12, fontFamily: fonts.medium },
  factValue: { color: colors.text, fontSize: 12, fontFamily: fonts.semibold, flexShrink: 1, textAlign: 'right' },
  url: { color: colors.accent, fontSize: 13, fontFamily: fonts.medium, lineHeight: 18, marginTop: 4 },
  openBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
  },
  openLabel: { color: colors.accentText, fontSize: 14, fontFamily: fonts.semibold },
  pressed: { opacity: 0.82 },
});
