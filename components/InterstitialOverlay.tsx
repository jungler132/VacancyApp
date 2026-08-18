import { memo, useEffect, useState } from 'react';
import { Modal, Pressable, View } from 'react-native';

import {
  INTERSTITIAL_SKIP_AFTER_SEC,
  dismissInterstitial,
  subscribeInterstitial,
} from '@/lib/ads';
import { fonts, radius, useThemedStyles, type ColorSchemeName, type ThemeColors } from '@/lib/theme';
import { Text } from '@/components/AppText';
import { useT } from '@/lib/i18n/useT';

export const InterstitialHost = memo(function InterstitialHost() {
  const [open, setOpen] = useState(false);

  useEffect(() => subscribeInterstitial(setOpen), []);

  if (!open) return null;
  return <InterstitialOverlay />;
});

const InterstitialOverlay = memo(function InterstitialOverlay() {
  const t = useT();
  const styles = useThemedStyles(interstitialOverlayStyles);
  const [left, setLeft] = useState(INTERSTITIAL_SKIP_AFTER_SEC);
  const canSkip = left <= 0;

  useEffect(() => {
    const timer = setInterval(() => {
      setLeft((value) => {
        if (value <= 1) {
          clearInterval(timer);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={dismissInterstitial}>
      <View style={styles.root}>
        <Text style={styles.kicker}>{t('ads.kicker')}</Text>
        <View style={styles.card}>
          <Text style={styles.soon}>{t('ads.soon')}</Text>
          <Text style={styles.title}>{t('ads.title')}</Text>
          <Text style={styles.note}>{t('ads.note')}</Text>
        </View>
        <Pressable
          onPress={canSkip ? dismissInterstitial : undefined}
          disabled={!canSkip}
          style={({ pressed }) => [styles.skip, !canSkip && styles.skipOff, pressed && canSkip && styles.pressed]}>
          <Text style={[styles.skipLabel, !canSkip && styles.skipLabelOff]}>
            {canSkip ? t('ads.skip') : t('ads.skipIn', { sec: left })}
          </Text>
        </Pressable>
      </View>
    </Modal>
  );
});

function interstitialOverlayStyles(colors: ThemeColors, _scheme: ColorSchemeName) {
  return {
    root: {
      flex: 1,
      backgroundColor: 'rgba(25, 28, 30, 0.72)',
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      padding: 28,
    },
    kicker: {
      color: colors.faint,
      fontFamily: fonts.semibold,
      fontSize: 12,
      letterSpacing: 1.2,
      textTransform: 'uppercase' as const,
      marginBottom: 16,
    },
    card: {
      width: '100%' as const,
      maxWidth: 360,
      minHeight: 220,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      backgroundColor: colors.card,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      padding: 24,
      gap: 8,
    },
    soon: { color: colors.accent, fontFamily: fonts.semibold, fontSize: 13 },
    title: { color: colors.text, fontFamily: fonts.bold, fontSize: 20, textAlign: 'center' as const },
    note: { color: colors.muted, fontFamily: fonts.medium, fontSize: 14, textAlign: 'center' as const, lineHeight: 20 },
    skip: {
      marginTop: 28,
      minWidth: 220,
      height: 48,
      borderRadius: radius.full,
      backgroundColor: colors.accent,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      paddingHorizontal: 20,
    },
    skipOff: { backgroundColor: colors.chip, borderWidth: 1, borderColor: colors.chipBorder },
    skipLabel: { color: colors.accentText, fontFamily: fonts.semibold, fontSize: 16 },
    skipLabelOff: { color: colors.faint },
    pressed: { opacity: 0.86 },
  };
}
