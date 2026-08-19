import { memo, useCallback } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/AppText';
import { useT } from '@/lib/i18n/useT';
import type { MsgId } from '@/lib/i18n';
import { closePaywall, purchasePremiumStub } from '@/lib/store/premiumSlice';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { fonts, radius, useThemedStyles, type ThemeColors } from '@/lib/theme';

const PERKS: MsgId[] = ['paywall.item1', 'paywall.item2', 'paywall.item3', 'paywall.item4', 'paywall.item5'];

export const PaywallHost = memo(function PaywallHost() {
  const dispatch = useAppDispatch();
  const open = useAppSelector((state) => state.premium.paywallOpen);
  return (
    <PaywallSheet
      open={open}
      onClose={() => dispatch(closePaywall())}
      onPurchase={() => {
        dispatch(purchasePremiumStub());
      }}
    />
  );
});

export const PaywallSheet = memo(function PaywallSheet({
  open,
  purchasing,
  onClose,
  onPurchase,
}: {
  open: boolean;
  purchasing?: boolean;
  onClose: () => void;
  onPurchase: () => void;
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
            style={({ pressed }) => [styles.buy, pressed && !purchasing && styles.pressed]}>
            <Text style={styles.buyText}>{purchasing ? t('paywall.buying') : t('paywall.buy')}</Text>
          </Pressable>
          <Pressable onPress={close} style={styles.later}>
            <Text style={styles.laterText}>{t('paywall.later')}</Text>
          </Pressable>
        </ScrollView>
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
    later: { alignItems: 'center' as const, paddingVertical: 16 },
    laterText: { color: colors.onPrimaryContainer, fontFamily: fonts.semibold, fontSize: 15 },
    pressed: { opacity: 0.86 },
  };
}
