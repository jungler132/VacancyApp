import { useCallback, useMemo, useRef, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Switch } from 'react-native-paper';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import * as WebBrowser from 'expo-web-browser';

import { AppHeader } from '@/components/AppHeader';
import { SelectChip } from '@/components/FilterChips';
import { Text } from '@/components/AppText';
import { SOURCES, availableSourceIds } from '@/lib/api/aggregator';
import { FONT_SIZE_OPTIONS, type FontSizeId } from '@/lib/fontScale';
import { jobTier } from '@/lib/tiers';
import { useTabBarLayout } from '@/lib/layout';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { selectSourceErrorMap } from '@/lib/store/selectors';
import { jobHref } from '@/lib/jobRoute';
import { pinViewedJob } from '@/lib/store/jobsSlice';
import { setFontSize } from '@/lib/store/appearanceSlice';
import { clearPremiumStub, openPaywall } from '@/lib/store/premiumSlice';
import { toggleSource } from '@/lib/store/sourcesSlice';
import { colors, fonts, radius } from '@/lib/theme';

const PRIVACY_URL = 'https://jungler132.github.io/VacancyApp/';
const FEEDBACK_EMAIL = 'feedback@workly.app';

function openFeedbackMail(kind: 'idea' | 'report') {
  const subject = kind === 'idea' ? 'Workly: предложение' : 'Workly: жалоба';
  const body =
    kind === 'idea'
      ? 'Что можно улучшить:\n'
      : 'На что жалоба:\n\nВакансия или источник:\n';
  return Linking.openURL(
    `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
  );
}

const STATUS = {
  live: { label: 'онлайн' },
  key: { label: 'нужен ключ' },
  soon: { label: 'скоро' },
};

export default function SettingsScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const tabBar = useTabBarLayout();
  const isPremium = useAppSelector((state) => state.premium.isPremium);
  const localJobs = useAppSelector((state) => state.localJobs.items);
  const disabled = useAppSelector((state) => state.sources.disabledIds);
  const sourceErrors = useAppSelector(selectSourceErrorMap);
  const fontSize = useAppSelector((state) => state.appearance.fontSize);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const disabledSet = useMemo(() => new Set(disabled), [disabled]);
  const available = useMemo(() => new Set(availableSourceIds()), []);

  const openPrivacy = useCallback(() => {
    WebBrowser.openBrowserAsync(PRIVACY_URL);
  }, []);

  const copyEmail = useCallback(async () => {
    await Clipboard.setStringAsync(FEEDBACK_EMAIL);
    setCopied(true);
    if (copyTimer.current) clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopied(false), 1600);
  }, []);

  const onIdea = useCallback(() => {
    openFeedbackMail('idea').catch(() => copyEmail());
  }, [copyEmail]);

  const onReport = useCallback(() => {
    openFeedbackMail('report').catch(() => copyEmail());
  }, [copyEmail]);

  return (
    <View style={styles.screen}>
      <AppHeader title="Настройки" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: tabBar.listPaddingBottom }]}>
        <Text style={styles.section}>Премиум</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{isPremium ? 'Премиум включён' : 'Обычный аккаунт'}</Text>
          <Text style={styles.cardNote}>
            {isPremium
              ? 'Можно публиковать вакансии в топ ленты (T1).'
              : 'Премиум поднимает вашу вакансию выше площадок.'}
          </Text>
          {isPremium ? (
            <Pressable
              onPress={() => dispatch(clearPremiumStub())}
              style={({ pressed }) => [styles.reset, pressed && styles.pressed]}>
              <Text style={styles.resetText}>Сбросить премиум</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={() => dispatch(openPaywall())}
              style={({ pressed }) => [styles.buy, pressed && styles.pressed]}>
              <Text style={styles.buyText}>Купить премиум</Text>
            </Pressable>
          )}
        </View>

        <Text style={styles.section}>Размер шрифта</Text>
        <View style={styles.wrap}>
          {FONT_SIZE_OPTIONS.map((item) => (
            <SelectChip
              key={item.id}
              id={item.id}
              label={item.label}
              selected={fontSize === item.id}
              onChange={(id) => dispatch(setFontSize(id as FontSizeId))}
            />
          ))}
        </View>

        <View style={styles.rowBetween}>
          <Text style={styles.section}>Мои вакансии</Text>
          <Pressable onPress={() => router.push('/job/create')} hitSlop={8}>
            <Text style={styles.link}>Создать</Text>
          </Pressable>
        </View>
        {localJobs.length ? (
          localJobs.map((job) => (
            <Pressable
              key={job.id}
              onPress={() => {
                dispatch(pinViewedJob(job));
                router.push(jobHref(job.id));
              }}
              style={({ pressed }) => [styles.jobRow, pressed && styles.pressed]}>
              <View style={styles.jobBody}>
                <Text style={styles.jobTitle} numberOfLines={1}>
                  {job.title}
                </Text>
                <Text style={styles.jobMeta} numberOfLines={1}>
                  {job.company}
                  {jobTier(job) === 1 ? ' · Премиум' : ' · Workly'}
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          ))
        ) : (
          <Text style={styles.empty}>Пока нет объявлений, созданных в приложении.</Text>
        )}

        <Pressable onPress={() => setSourcesOpen((value) => !value)} style={styles.rowBetween}>
          <Text style={styles.section}>Источники</Text>
          <Text style={styles.link}>{sourcesOpen ? 'Скрыть' : 'Показать'}</Text>
        </Pressable>
        {sourcesOpen ? (
          <>
            <Text style={styles.lead}>Выключенные площадки не запрашиваются.</Text>
            {SOURCES.map((source) => {
              const canToggle = available.has(source.id);
              const on = canToggle && !disabledSet.has(source.id);
              const tone = STATUS[source.status];
              const error = sourceErrors[source.id];
              return (
                <View key={source.id} style={[styles.sourceRow, !on && canToggle ? styles.sourceOff : null]}>
                  <View style={styles.jobBody}>
                    <Text style={styles.jobTitle}>{source.name}</Text>
                    <Text style={styles.jobMeta}>
                      {source.regionLabel} · {canToggle ? (on ? 'вкл' : 'выкл') : tone.label}
                    </Text>
                    {error ? <Text style={styles.sourceError}>Не отвечает: {error}</Text> : null}
                  </View>
                  {canToggle ? (
                    <Switch
                      value={on}
                      onValueChange={() => dispatch(toggleSource(source.id))}
                      style={styles.switch}
                    />
                  ) : null}
                </View>
              );
            })}
          </>
        ) : (
          <Text style={styles.empty}>{SOURCES.length} площадок. Нажмите «Показать», чтобы включить или выключить.</Text>
        )}

        <Text style={styles.section}>Обратная связь</Text>
        <Text style={styles.empty}>Предложения по приложению и жалобы на вакансии или источники.</Text>
        <Pressable onPress={onIdea} style={({ pressed }) => [styles.jobRow, pressed && styles.pressed]}>
          <View style={styles.jobBody}>
            <Text style={styles.jobTitle}>Предложение</Text>
            <Text style={styles.jobMeta}>Идея, ошибка, чего не хватает</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
        <Pressable onPress={onReport} style={({ pressed }) => [styles.jobRow, pressed && styles.pressed]}>
          <View style={styles.jobBody}>
            <Text style={styles.jobTitle}>Жалоба</Text>
            <Text style={styles.jobMeta}>Вакансия, источник или контент</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
        <Pressable onPress={copyEmail} style={({ pressed }) => [styles.jobRow, pressed && styles.pressed]}>
          <View style={styles.jobBody}>
            <Text style={styles.jobTitle}>Почта</Text>
            <Text style={styles.jobMeta}>{copied ? 'Скопировано' : FEEDBACK_EMAIL}</Text>
          </View>
        </Pressable>

        <Text style={styles.section}>О приложении</Text>
        <Pressable onPress={openPrivacy} style={({ pressed }) => [styles.jobRow, pressed && styles.pressed]}>
          <Text style={styles.jobTitle}>Политика конфиденциальности</Text>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 8 },
  section: {
    color: colors.muted,
    fontFamily: fonts.semibold,
    fontSize: 12,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginTop: 16,
    marginBottom: 4,
  },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  link: { color: colors.accent, fontFamily: fonts.semibold, fontSize: 14 },
  lead: { color: colors.faint, fontFamily: fonts.medium, fontSize: 13, marginBottom: 4 },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radius.lg,
    padding: 14,
    gap: 8,
  },
  cardTitle: { color: colors.text, fontFamily: fonts.bold, fontSize: 16 },
  cardNote: { color: colors.muted, fontFamily: fonts.medium, fontSize: 13, lineHeight: 18 },
  buy: {
    marginTop: 4,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyText: { color: colors.accentText, fontFamily: fonts.bold, fontSize: 15 },
  reset: {
    marginTop: 4,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.chipBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetText: { color: colors.muted, fontFamily: fonts.semibold, fontSize: 15 },
  jobRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  jobBody: { flex: 1, minWidth: 0 },
  jobTitle: { color: colors.text, fontFamily: fonts.semibold, fontSize: 15 },
  jobMeta: { color: colors.faint, fontFamily: fonts.medium, fontSize: 12, marginTop: 2 },
  chevron: { color: colors.faint, fontSize: 22, lineHeight: 24 },
  empty: { color: colors.faint, fontFamily: fonts.medium, fontSize: 13, marginBottom: 4 },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  sourceOff: { opacity: 0.55 },
  sourceError: { color: colors.danger, fontFamily: fonts.medium, fontSize: 12, marginTop: 4 },
  switch: { marginLeft: 8 },
  pressed: { opacity: 0.86 },
});
