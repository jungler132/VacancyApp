import { useCallback, useMemo, useRef, useState } from 'react';
import { Appearance, Linking, Pressable, View } from 'react-native';
import { Switch } from 'react-native-paper';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';

import { AccountCard } from '@/components/AccountCard';
import { AppHeader } from '@/components/AppHeader';
import { ChoiceBar } from '@/components/ChoiceBar';
import { FormScroll } from '@/components/FormScroll';
import { NavRow } from '@/components/NavRow';
import { Text } from '@/components/AppText';
import { SOURCES, availableSourceIds } from '@/lib/api/aggregator';
import { FONT_SIZE_OPTIONS, type FontSizeId } from '@/lib/fontScale';
import { APP_LOCALES, keyOf, type AppLocale } from '@/lib/i18n';
import { useT } from '@/lib/i18n/useT';
import { useTabBarLayout } from '@/lib/layout';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { selectSourceErrorMap } from '@/lib/store/selectors';
import { setFontSize, setLocale, setTheme } from '@/lib/store/appearanceSlice';
import { showOnboarding } from '@/lib/store/onboardingSlice';
import { grantPremium, revokePremium } from '@/lib/store/premiumSlice';
import { toggleSource } from '@/lib/store/sourcesSlice';
import { PRIVACY_HREF } from '@/lib/privacy';
import { SUPPORT_EMAIL } from '@/lib/support';
import { THEME_OPTIONS, fonts, radius, useThemedStyles, type ThemeColors, type ThemePreference } from '@/lib/theme';

const FEEDBACK_EMAIL = SUPPORT_EMAIL;

export default function SettingsScreen() {
  const t = useT();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const tabBar = useTabBarLayout();
  const disabled = useAppSelector((state) => state.sources.disabledIds);
  const sourceErrors = useAppSelector(selectSourceErrorMap);
  const fontSize = useAppSelector((state) => state.appearance.fontSize);
  const themePref = useAppSelector((state) => state.appearance.theme);
  const locale = useAppSelector((state) => state.appearance.locale);
  const isPremium = useAppSelector((state) => state.premium.isPremium);
  const styles = useThemedStyles(settingsStyles);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const disabledSet = useMemo(() => new Set(disabled), [disabled]);
  const available = useMemo(() => new Set(availableSourceIds()), []);

  const copyEmail = useCallback(async () => {
    try {
      await Clipboard.setStringAsync(FEEDBACK_EMAIL);
    } catch {
      return;
    }
    setCopied(true);
    if (copyTimer.current) clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopied(false), 1600);
  }, []);

  const mail = useCallback(
    (kind: 'idea' | 'report') => {
      const subject = kind === 'idea' ? t('settings.mailIdea') : t('settings.mailReport');
      const body = kind === 'idea' ? t('settings.mailIdeaBody') : t('settings.mailReportBody');
      return Linking.openURL(
        `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
      ).catch(() => copyEmail());
    },
    [copyEmail, t],
  );

  const onFont = useCallback((id: string) => dispatch(setFontSize(id as FontSizeId)), [dispatch]);
  const onLocale = useCallback((id: string) => dispatch(setLocale(id as AppLocale)), [dispatch]);
  const onTheme = useCallback(
    (id: string) => {
      const next = id as ThemePreference;
      dispatch(setTheme(next));
      Appearance.setColorScheme(next === 'system' ? 'unspecified' : next);
    },
    [dispatch],
  );

  const localeOptions = useMemo(
    () => APP_LOCALES.map((id) => ({ id, label: t(keyOf('lang', id)) })),
    [t],
  );
  const themeOptions = useMemo(
    () => THEME_OPTIONS.map((id) => ({ id, label: t(keyOf('theme', id)) })),
    [t],
  );
  const fontOptions = useMemo(
    () => FONT_SIZE_OPTIONS.map((item) => ({ id: item.id, label: t(keyOf('font', item.id)) })),
    [t],
  );

  return (
    <View style={styles.screen}>
      <AppHeader title={t('tab.settings')} />
      <FormScroll contentContainerStyle={[styles.content, { paddingBottom: tabBar.listPaddingBottom }]}>
        <Text style={styles.section}>{t('auth.section')}</Text>
        <AccountCard />

        <Text style={styles.section}>{t('settings.look')}</Text>
        <View style={styles.look}>
          <Text style={styles.lookLabel}>{t('settings.language')}</Text>
          <ChoiceBar value={locale} options={localeOptions} onChange={onLocale} />
          <Text style={styles.lookLabel}>{t('settings.theme')}</Text>
          <ChoiceBar value={themePref} options={themeOptions} onChange={onTheme} />
          <Text style={styles.lookLabel}>{t('settings.font')}</Text>
          <ChoiceBar value={fontSize} options={fontOptions} onChange={onFont} />
        </View>

        <Pressable onPress={() => setSourcesOpen((value) => !value)} style={styles.rowBetween}>
          <Text style={styles.section}>{t('settings.sources')}</Text>
          <Text style={styles.link}>{sourcesOpen ? t('common.hide') : t('common.show')}</Text>
        </Pressable>
        {sourcesOpen ? (
          <>
            <Text style={styles.lead}>{t('settings.sourcesHint')}</Text>
            {SOURCES.map((source) => {
              const canToggle = available.has(source.id);
              const on = canToggle && !disabledSet.has(source.id);
              const status =
                source.status === 'live'
                  ? t('settings.sourceLive')
                  : source.status === 'key'
                    ? t('settings.sourceKey')
                    : t('settings.sourceSoon');
              const error = sourceErrors[source.id];
              return (
                <View key={source.id} style={[styles.sourceRow, !on && canToggle ? styles.sourceOff : null]}>
                  <View style={styles.jobBody}>
                    <Text style={styles.jobTitle}>{source.name}</Text>
                    <Text style={styles.jobMeta}>
                      {source.regionLabel} · {canToggle ? (on ? t('common.on') : t('common.off')) : status}
                    </Text>
                    {error ? <Text style={styles.sourceError}>{t('settings.sourceError', { message: error })}</Text> : null}
                  </View>
                  {canToggle ? (
                    <Switch
                      value={on}
                      onValueChange={() => {
                        dispatch(toggleSource(source.id));
                      }}
                      style={styles.switch}
                    />
                  ) : null}
                </View>
              );
            })}
          </>
        ) : (
          <Text style={styles.empty}>{t('settings.sourcesClosed', { count: SOURCES.length })}</Text>
        )}

        <Text style={styles.section}>{t('settings.feedback')}</Text>
        <Text style={styles.empty}>{t('settings.feedbackHint')}</Text>
        <NavRow title={t('settings.idea')} meta={t('settings.ideaMeta')} onPress={() => mail('idea')} />
        <NavRow title={t('settings.report')} meta={t('settings.reportMeta')} onPress={() => mail('report')} />
        <NavRow title={t('settings.mail')} meta={copied ? t('common.copied') : FEEDBACK_EMAIL} onPress={copyEmail} right={null} />

        <Text style={styles.section}>{t('settings.about')}</Text>
        {typeof __DEV__ !== 'undefined' && __DEV__ ? (
          <NavRow
            title={t('settings.testPremium')}
            meta={isPremium ? t('settings.testPremiumOn') : t('settings.testPremiumOff')}
            premium={isPremium}
            onPress={() => dispatch(isPremium ? revokePremium() : grantPremium())}
          />
        ) : null}
        <NavRow title={t('settings.tour')} meta={t('settings.tourMeta')} onPress={() => dispatch(showOnboarding())} />
        <NavRow title={t('settings.privacy')} onPress={() => router.push(PRIVACY_HREF)} />
      </FormScroll>
    </View>
  );
}

function settingsStyles(colors: ThemeColors) {
  return {
    screen: { flex: 1, backgroundColor: 'transparent' },
    content: { padding: 16, gap: 6 },
    section: {
      color: colors.muted,
      fontFamily: fonts.semibold,
      fontSize: 12,
      letterSpacing: 0.4,
      textTransform: 'uppercase' as const,
      marginTop: 10,
      marginBottom: 2,
    },
    look: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      borderRadius: radius.lg,
      paddingHorizontal: 12,
      paddingTop: 8,
      paddingBottom: 12,
      gap: 8,
    },
    lookLabel: {
      color: colors.faint,
      fontFamily: fonts.medium,
      fontSize: 11,
      marginTop: 4,
    },
    rowBetween: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      marginTop: 8,
    },
    link: { color: colors.accent, fontFamily: fonts.semibold, fontSize: 14 },
    lead: { color: colors.faint, fontFamily: fonts.medium, fontSize: 13, marginBottom: 4 },
    empty: { color: colors.faint, fontFamily: fonts.medium, fontSize: 13, marginBottom: 4 },
    jobBody: { flex: 1, minWidth: 0 },
    jobTitle: { color: colors.text, fontFamily: fonts.semibold, fontSize: 15 },
    jobMeta: { color: colors.faint, fontFamily: fonts.medium, fontSize: 12, marginTop: 2 },
    sourceRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
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
  };
}
