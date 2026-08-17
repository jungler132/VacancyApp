import { useCallback, useMemo, useRef, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Switch } from 'react-native-paper';
import * as Clipboard from 'expo-clipboard';
import * as WebBrowser from 'expo-web-browser';

import { SelectChip } from '@/components/FilterChips';
import { NavRow } from '@/components/NavRow';
import { Text } from '@/components/AppText';
import { SOURCES, availableSourceIds } from '@/lib/api/aggregator';
import { FONT_SIZE_OPTIONS, type FontSizeId } from '@/lib/fontScale';
import { keyOf } from '@/lib/i18n';
import { useT } from '@/lib/i18n/useT';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { selectSourceErrorMap } from '@/lib/store/selectors';
import { setFontSize } from '@/lib/store/appearanceSlice';
import { toggleSource } from '@/lib/store/sourcesSlice';
import { colors, fonts, radius } from '@/lib/theme';

const PRIVACY_URL = 'https://jungler132.github.io/VacancyApp/';
const FEEDBACK_EMAIL = 'feedback@workly.app';

export default function SettingsScreen() {
  const t = useT();
  const dispatch = useAppDispatch();
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

  const onFont = useCallback((id: string | number) => dispatch(setFontSize(id as FontSizeId)), [dispatch]);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.section}>{t('settings.font')}</Text>
      <View style={styles.wrap}>
        {FONT_SIZE_OPTIONS.map((item) => (
          <SelectChip
            key={item.id}
            id={item.id}
            label={t(keyOf('font', item.id))}
            selected={fontSize === item.id}
            onChange={onFont}
          />
        ))}
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
      <NavRow title={t('settings.privacy')} onPress={openPrivacy} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 48, gap: 8 },
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
  empty: { color: colors.faint, fontFamily: fonts.medium, fontSize: 13, marginBottom: 4 },
  jobBody: { flex: 1, minWidth: 0 },
  jobTitle: { color: colors.text, fontFamily: fonts.semibold, fontSize: 15 },
  jobMeta: { color: colors.faint, fontFamily: fonts.medium, fontSize: 12, marginTop: 2 },
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
});
