import { memo, useCallback } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/AppText';
import { useT } from '@/lib/i18n/useT';
import type { MsgId } from '@/lib/i18n';
import { closePaywall } from '@/lib/store/premiumSlice';
import { useBilling } from '@/lib/billingContext';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { fonts, radius, useThemedStyles, type ThemeColors } from '@/lib/theme';

const PERKS: MsgId[] = ['paywall.item1', 'paywall.item2', 'paywall.item3', 'paywall.item4', 'paywall.item5'];

export const PaywallHost = memo(function PaywallHost() {
  const dispatch = useAppDispatch();
  const open = useAppSelector((state) => state.premium.paywallOpen);
  const billing = useBilling();
  return (
    <PaywallSheet
      open={open}
      purchasing={billing.purchasing}
      priceLabel={billing.priceLabel}
      storeBlocked={billing.storeBlocked}
      onClose={() => {
        billing.dismissStoreBlocked();
        dispatch(closePaywall());
      }}
      onPurchase={billing.buy}
      onRestore={billing.restore}
      onDismissNotice={billing.dismissStoreBlocked}
      onTryTest={billing.tryTest}
    />
  );
});

export const PaywallSheet = memo(function PaywallSheet({
  open,
  purchasing,
  priceLabel,
  storeBlocked,
  onClose,
  onPurchase,
  onRestore,
  onDismissNotice,
  onTryTest,
}: {
  open: boolean;
  purchasing: boolean;
  priceLabel: string | null;
  storeBlocked?: boolean;
  onClose: () => void;
  onPurchase: () => void;
  onRestore: () => void;
  onDismissNotice?: () => void;
  onTryTest?: () => void;
}) {
  const t = useT();
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(paywallSheetStyles);

  const close = useCallback(() => {
    if (open) onClose();
  }, [onClose, open]);

  return (
    <Modal visible={open} animationType="fade" presentationStyle="fullScreen" onRequestClose={close}>
      {open ? <StatusBar style="light" /> : null}
      <View style={[styles.root, { paddingTop: Math.max(insets.top, 12) }]}>
        <View style={styles.hero}>
          <Text style={styles.kicker}>{t('paywall.kicker')}</Text>
          <Text style={styles.title}>{t('paywall.title')}</Text>
          <Text style={styles.note}>{t('paywall.note')}</Text>
        </View>
        <ScrollView
          contentContainerStyle={[styles.body, { paddingBottom: Math.max(insets.bottom, 16) + 20 }]}
          bounces={false}>
          {PERKS.map((id) => (
            <View key={id} style={styles.perk}>
              <View style={styles.dot} />
              <Text style={styles.item}>{t(id)}</Text>
            </View>
          ))}
          <Pressable
            onPress={purchasing ? undefined : onPurchase}
            disabled={purchasing}
            style={({ pressed }) => [styles.buy, pressed && !purchasing && styles.pressed, purchasing && styles.buyOff]}>
            <Text style={styles.buyText}>
              {purchasing ? t('paywall.buying') : priceLabel ? t('paywall.buyPrice', { price: priceLabel }) : t('paywall.buy')}
            </Text>
          </Pressable>
          {onTryTest ? (
            <Pressable onPress={onTryTest} style={({ pressed }) => [styles.test, pressed && styles.pressed]}>
              <Text style={styles.testText}>{t('paywall.tryTest')}</Text>
              <Text style={styles.testHint}>{t('paywall.tryTestHint')}</Text>
            </Pressable>
          ) : null}
          <Pressable onPress={onRestore} style={styles.later}>
            <Text style={styles.laterText}>{t('paywall.restore')}</Text>
          </Pressable>
          <Pressable onPress={close} style={styles.later}>
            <Text style={styles.laterText}>{t('paywall.later')}</Text>
          </Pressable>
        </ScrollView>
        {storeBlocked ? (
          <View style={styles.noticeRoot} pointerEvents="box-none">
            <Pressable style={styles.noticeDim} onPress={onDismissNotice} />
            <View style={[styles.noticeCard, { marginBottom: Math.max(insets.bottom, 16) }]}>
              <Text style={styles.noticeTitle}>{t('paywall.needStoreTitle')}</Text>
              <Text style={styles.noticeBody}>{t('paywall.needStore')}</Text>
              {onTryTest ? (
                <Pressable onPress={onTryTest} style={({ pressed }) => [styles.noticeBuy, pressed && styles.pressed]}>
                  <Text style={styles.buyText}>{t('paywall.tryTest')}</Text>
                </Pressable>
              ) : null}
              <Pressable onPress={onDismissNotice} style={styles.later}>
                <Text style={styles.noticeOk}>{t('common.ok')}</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </View>
    </Modal>
  );
});

function paywallSheetStyles(colors: ThemeColors) {
  return {
    root: { flex: 1, backgroundColor: colors.primaryContainer },
    hero: {
      paddingHorizontal: 24,
      paddingTop: 20,
      paddingBottom: 20,
    },
    kicker: {
      color: colors.onPrimaryContainer,
      fontFamily: fonts.semibold,
      fontSize: 12,
      letterSpacing: 1.4,
      textTransform: 'uppercase' as const,
    },
    title: { color: '#ffffff', fontSize: 32, fontFamily: fonts.bold, marginTop: 10, lineHeight: 38 },
    note: { color: colors.onPrimaryContainer, fontFamily: fonts.medium, fontSize: 15, lineHeight: 22, marginTop: 12 },
    body: { paddingHorizontal: 20, paddingTop: 8, gap: 10 },
    perk: {
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
      gap: 12,
      backgroundColor: colors.orangeDim,
      borderRadius: radius.lg,
      paddingHorizontal: 14,
      paddingVertical: 14,
    },
    dot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.orange,
      marginTop: 6,
    },
    item: { flex: 1, color: colors.text, fontFamily: fonts.medium, fontSize: 15, lineHeight: 22 },
    buy: {
      marginTop: 18,
      backgroundColor: colors.orange,
      borderRadius: radius.full,
      paddingVertical: 16,
      alignItems: 'center' as const,
    },
    buyText: { color: '#ffffff', fontFamily: fonts.bold, fontSize: 16 },
    buyOff: { opacity: 0.55 },
    later: { alignItems: 'center' as const, paddingVertical: 16 },
    laterText: { color: colors.onPrimaryContainer, fontFamily: fonts.semibold, fontSize: 15 },
    test: {
      marginTop: 4,
      borderWidth: 1,
      borderColor: colors.orange,
      borderRadius: radius.lg,
      paddingHorizontal: 14,
      paddingVertical: 12,
      alignItems: 'center' as const,
      gap: 4,
    },
    testText: { color: '#ffffff', fontFamily: fonts.bold, fontSize: 15 },
    testHint: { color: colors.onPrimaryContainer, fontFamily: fonts.medium, fontSize: 12, textAlign: 'center' as const },
    noticeRoot: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 4,
      justifyContent: 'center' as const,
      paddingHorizontal: 20,
    },
    noticeDim: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.55)',
    },
    noticeCard: {
      backgroundColor: colors.card,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: colors.orange,
      padding: 20,
      gap: 12,
    },
    noticeTitle: { color: colors.text, fontFamily: fonts.bold, fontSize: 20, lineHeight: 26 },
    noticeBody: { color: colors.muted, fontFamily: fonts.medium, fontSize: 15, lineHeight: 22 },
    noticeOk: { color: colors.muted, fontFamily: fonts.semibold, fontSize: 15 },
    noticeBuy: {
      backgroundColor: colors.orange,
      borderRadius: radius.full,
      paddingVertical: 16,
      alignItems: 'center' as const,
    },
    pressed: { opacity: 0.86 },
  };
}
