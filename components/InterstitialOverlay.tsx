import { memo, useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  INTERSTITIAL_SKIP_AFTER_SEC,
  dismissInterstitial,
  subscribeInterstitial,
} from '@/lib/ads';
import { colors, fonts, radius } from '@/lib/theme';

export const InterstitialHost = memo(function InterstitialHost() {
  const [open, setOpen] = useState(false);

  useEffect(() => subscribeInterstitial(setOpen), []);

  if (!open) return null;
  return <InterstitialOverlay />;
});

const InterstitialOverlay = memo(function InterstitialOverlay() {
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
        <Text style={styles.kicker}>Реклама</Text>
        <View style={styles.card}>
          <Text style={styles.soon}>Скоро</Text>
          <Text style={styles.title}>Здесь будет объявление</Text>
          <Text style={styles.note}>Заглушка. Настоящая реклама подключится позже.</Text>
        </View>
        <Pressable
          onPress={canSkip ? dismissInterstitial : undefined}
          disabled={!canSkip}
          style={({ pressed }) => [styles.skip, !canSkip && styles.skipOff, pressed && canSkip && styles.pressed]}>
          <Text style={[styles.skipLabel, !canSkip && styles.skipLabelOff]}>
            {canSkip ? 'Пропустить' : `Пропустить через ${left} с`}
          </Text>
        </Pressable>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'rgba(7, 9, 15, 0.96)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  kicker: {
    color: colors.faint,
    fontFamily: fonts.semibold,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    minHeight: 220,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 8,
  },
  soon: { color: colors.accent, fontFamily: fonts.semibold, fontSize: 13 },
  title: { color: colors.text, fontFamily: fonts.bold, fontSize: 20, textAlign: 'center' },
  note: { color: colors.muted, fontFamily: fonts.medium, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  skip: {
    marginTop: 28,
    minWidth: 220,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  skipOff: { backgroundColor: colors.chip, borderWidth: 1, borderColor: colors.chipBorder },
  skipLabel: { color: colors.accentText, fontFamily: fonts.semibold, fontSize: 16 },
  skipLabelOff: { color: colors.faint },
  pressed: { opacity: 0.86 },
});
