import { memo, useCallback, useRef, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as WebBrowser from 'expo-web-browser';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import PagerView from 'react-native-pager-view';

import { AppHeader } from '@/components/AppHeader';
import { useTabBarLayout } from '@/lib/layout';
import { AZ_JOB_SITES, TELEGRAM_GROUPS, type CatalogLink } from '@/lib/telegramGroups';
import { colors, fonts, radius } from '@/lib/theme';

const SECTIONS = [
  { id: 'telegram', label: 'Telegram', items: TELEGRAM_GROUPS, telegram: true },
  { id: 'sites', label: 'Сайты', items: AZ_JOB_SITES, telegram: false },
] as const;

async function openCatalogLink(item: CatalogLink) {
  if (item.handle) {
    await Linking.openURL(item.url);
    return;
  }
  await WebBrowser.openBrowserAsync(item.url);
}

const LinkCard = memo(function LinkCard({ item, telegram }: { item: CatalogLink; telegram?: boolean }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onOpen = useCallback(() => {
    openCatalogLink(item).catch(() => undefined);
  }, [item]);

  const onCopy = useCallback(async () => {
    await Clipboard.setStringAsync(item.url);
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1600);
  }, [item.url]);

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{item.title}</Text>
      {telegram && item.handle ? <Text style={styles.handle}>@{item.handle}</Text> : null}
      {item.note ? <Text style={styles.note}>{item.note}</Text> : null}
      <View style={styles.actions}>
        <Pressable onPress={onOpen} style={({ pressed }) => [styles.openBtn, pressed && styles.pressed]}>
          <MaterialDesignIcons name={telegram ? 'send' : 'open-in-new'} size={16} color={colors.accentText} />
          <Text style={styles.openLabel}>Открыть</Text>
        </Pressable>
        <Pressable onPress={onCopy} style={({ pressed }) => [styles.copyBtn, pressed && styles.pressed]}>
          <MaterialDesignIcons name={copied ? 'check' : 'content-copy'} size={16} color={copied ? colors.accent : colors.muted} />
          <Text style={[styles.copyLabel, copied && styles.copyDone]}>{copied ? 'Скопировано' : 'Ссылка'}</Text>
        </Pressable>
      </View>
    </View>
  );
});

export default function TelegramScreen() {
  const tabBar = useTabBarLayout();
  const pager = useRef<PagerView>(null);
  const [page, setPage] = useState(0);

  const goTo = useCallback((index: number) => {
    setPage(index);
    pager.current?.setPage(index);
  }, []);

  return (
    <View style={styles.screen}>
      <AppHeader title="Чаты">
        <View style={styles.tabs}>
          {SECTIONS.map((item, index) => (
            <Pressable key={item.id} onPress={() => goTo(index)} style={styles.tab} android_ripple={null}>
              <Text style={[styles.tabLabel, page === index && styles.tabLabelOn]}>{item.label}</Text>
              <View style={[styles.tabLine, page === index && styles.tabLineOn]} />
            </Pressable>
          ))}
        </View>
      </AppHeader>
      <PagerView
        ref={pager}
        style={styles.pager}
        initialPage={0}
        onPageSelected={(event) => setPage(event.nativeEvent.position)}>
        {SECTIONS.map((section) => (
          <View key={section.id} style={styles.page}>
            <ScrollView
              contentContainerStyle={[styles.content, { paddingBottom: tabBar.listPaddingBottom }]}
              showsVerticalScrollIndicator={false}>
              {section.items.map((item) => (
                <LinkCard key={item.id} item={item} telegram={section.telegram} />
              ))}
            </ScrollView>
          </View>
        ))}
      </PagerView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' },
  tabs: { flexDirection: 'row', marginTop: 10, marginHorizontal: -12, marginBottom: -8 },
  tab: { flex: 1, alignItems: 'center', gap: 8 },
  tabLabel: { color: colors.faint, fontSize: 14, fontFamily: fonts.semibold },
  tabLabelOn: { color: colors.text },
  tabLine: { height: 2, alignSelf: 'stretch', borderRadius: 1, backgroundColor: 'transparent' },
  tabLineOn: { backgroundColor: colors.accent },
  pager: { flex: 1 },
  page: { flex: 1 },
  content: { padding: 16, gap: 10 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 14,
  },
  cardTitle: { color: colors.text, fontSize: 16, fontFamily: fonts.semibold },
  handle: { color: colors.faint, fontSize: 13, fontFamily: fonts.medium, marginTop: 4 },
  note: { color: colors.muted, fontSize: 13, marginTop: 6, lineHeight: 18 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  openBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
  },
  openLabel: { color: colors.accentText, fontSize: 14, fontFamily: fonts.semibold },
  copyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 40,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.chipBorder,
    backgroundColor: colors.chip,
  },
  copyLabel: { color: colors.muted, fontSize: 14, fontFamily: fonts.semibold },
  copyDone: { color: colors.accent },
  pressed: { opacity: 0.82 },
});
