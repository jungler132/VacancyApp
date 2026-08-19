import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FormField, useFormStyles } from '@/components/FormField';
import { Text } from '@/components/AppText';
import { fetchReportUnlockAt, peekReportUnlockAt, submitServiceReport } from '@/lib/backend/reports';
import { useT } from '@/lib/i18n/useT';
import { useAppSelector } from '@/lib/store/hooks';
import { REPORT_COOLDOWN_MS, REPORT_MAX, reportWaitLabel, type ServiceReportTarget } from '@/lib/support';
import { fonts, radius, useThemedStyles, type ThemeColors } from '@/lib/theme';

export const ReportSheet = memo(function ReportSheet({
  open,
  target,
  onClose,
}: {
  open: boolean;
  target: ServiceReportTarget | null;
  onClose: () => void;
}) {
  const t = useT();
  const insets = useSafeAreaInsets();
  const formStyles = useFormStyles();
  const styles = useThemedStyles(reportSheetStyles);
  const email = useAppSelector((state) => state.auth.email);
  const userId = useAppSelector((state) => state.auth.userId);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [unlockAt, setUnlockAt] = useState<number | null>(null);
  const [nowTick, setNowTick] = useState(Date.now());
  const used = message.trim().length;
  const remaining = unlockAt ? unlockAt - nowTick : 0;
  const locked = remaining > 0;
  const wait = useMemo(
    () =>
      locked
        ? reportWaitLabel(
            remaining,
            (count) => t('date.hour', { count }),
            (count) => t('date.min', { count }),
          )
        : '',
    [locked, remaining, t],
  );

  useEffect(() => {
    if (!open) return;
    setUnlockAt(peekReportUnlockAt(userId));
    setNowTick(Date.now());
    let live = true;
    fetchReportUnlockAt().then((at) => {
      if (live) setUnlockAt(at);
    });
    return () => {
      live = false;
    };
  }, [open, userId]);

  useEffect(() => {
    if (!open || !locked) return;
    const id = setInterval(() => setNowTick(Date.now()), 30_000);
    return () => clearInterval(id);
  }, [locked, open]);

  const close = useCallback(() => {
    if (busy) return;
    setMessage('');
    setError('');
    setSent(false);
    onClose();
  }, [busy, onClose]);

  const send = useCallback(async () => {
    const text = message.trim();
    if (!target || !text) {
      setError(t('report.needText'));
      return;
    }
    if (busy || locked) return;
    setBusy(true);
    setError('');
    try {
      const status = await submitServiceReport(target, text, email);
      if (status === 'ok') {
        setSent(true);
        setUnlockAt(Date.now() + REPORT_COOLDOWN_MS);
        return;
      }
      if (status === 'cooldown') {
        const at = peekReportUnlockAt(userId) ?? (await fetchReportUnlockAt());
        setUnlockAt(at);
        setNowTick(Date.now());
        return;
      }
      setError(t('report.failed'));
    } finally {
      setBusy(false);
    }
  }, [busy, email, locked, message, t, target, userId]);

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
      <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.dismiss} onPress={close} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 12 }]}>
          {sent ? (
            <>
              <Text style={styles.title}>{t('report.sent')}</Text>
              <Text style={formStyles.lead}>{t('report.leadDone')}</Text>
              <Pressable onPress={close} style={({ pressed }) => [formStyles.primary, pressed && formStyles.pressed]}>
                <Text style={formStyles.primaryText}>{t('common.ok')}</Text>
              </Pressable>
            </>
          ) : locked ? (
            <>
              <Text style={styles.title}>{t('report.title')}</Text>
              <Text style={formStyles.lead}>{t('report.cooldown', { wait })}</Text>
              <Pressable onPress={close} style={({ pressed }) => [formStyles.primary, pressed && formStyles.pressed]}>
                <Text style={formStyles.primaryText}>{t('common.ok')}</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.title}>{t('report.title')}</Text>
              <Text style={formStyles.lead}>{t('report.lead')}</Text>
              <Text style={formStyles.hint}>{t('report.rule')}</Text>
              <FormField
                label={t('report.reason')}
                value={message}
                onChangeText={(value) => {
                  setMessage(value);
                  if (error) setError('');
                }}
                placeholder={t('report.placeholder')}
                multiline
                maxLength={REPORT_MAX}
              />
              <Text style={formStyles.hint}>{t('report.count', { used, limit: REPORT_MAX })}</Text>
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <Pressable
                onPress={send}
                disabled={!used || busy}
                style={({ pressed }) => [formStyles.primary, (pressed || !used || busy) && formStyles.pressed]}>
                <Text style={formStyles.primaryText}>{t('report.send')}</Text>
              </Pressable>
              <Pressable
                onPress={close}
                disabled={busy}
                style={({ pressed }) => [formStyles.secondary, pressed && formStyles.pressed]}>
                <Text style={formStyles.secondaryText}>{t('common.cancel')}</Text>
              </Pressable>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
});

function reportSheetStyles(colors: ThemeColors) {
  return {
    backdrop: {
      flex: 1,
      justifyContent: 'flex-end' as const,
      backgroundColor: 'rgba(0,0,0,0.45)',
    },
    dismiss: { flex: 1 },
    sheet: {
      backgroundColor: colors.bg,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 16,
      gap: 12,
    },
    title: { color: colors.text, fontFamily: fonts.semibold, fontSize: 18, lineHeight: 24 },
    error: { color: colors.danger, fontFamily: fonts.medium, fontSize: 13, lineHeight: 18 },
  };
}
