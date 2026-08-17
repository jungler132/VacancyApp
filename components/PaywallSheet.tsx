import { memo, useCallback, useEffect } from 'react';
import { Dimensions, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { closePaywall, purchasePremiumStub } from '@/lib/store/premiumSlice';
import { Text } from '@/components/AppText';
import { useT } from '@/lib/i18n/useT';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { fonts, radius, useThemedStyles, type ColorSchemeName, type ThemeColors } from '@/lib/theme';

const SHEET_TRAVEL = Dimensions.get('window').height;
const OPEN_CFG = { duration: 220, easing: Easing.out(Easing.cubic) };
const CLOSE_CFG = { duration: 180, easing: Easing.in(Easing.cubic) };

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
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(open ? 1 : 0, open ? OPEN_CFG : CLOSE_CFG);
  }, [open, progress]);

  const close = useCallback(() => {
    if (open) onClose();
  }, [onClose, open]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - progress.value) * SHEET_TRAVEL }],
  }));

  return (
    <Modal visible={open} transparent animationType="fade" statusBarTranslucent onRequestClose={close}>
      <View pointerEvents={open ? 'auto' : 'none'} style={styles.root}>
      <Pressable style={StyleSheet.absoluteFill} onPress={close}>
        <Animated.View style={[styles.backdrop, backdropStyle]} />
      </Pressable>
      <Animated.View style={[styles.sheet, sheetStyle, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.handle} />
        <Text style={styles.kicker}>{t('paywall.kicker')}</Text>
        <Text style={styles.title}>{t('paywall.title')}</Text>
        <Text style={styles.note}>{t('paywall.note')}</Text>
        <View style={styles.list}>
          <Text style={styles.item}>{t('paywall.item1')}</Text>
          <Text style={styles.item}>{t('paywall.item2')}</Text>
          <Text style={styles.item}>{t('paywall.item3')}</Text>
        </View>
        <Pressable
          onPress={purchasing ? undefined : onPurchase}
          disabled={purchasing}
          style={({ pressed }) => [styles.buy, pressed && !purchasing && styles.pressed]}>
          <Text style={styles.buyText}>{purchasing ? t('paywall.buying') : t('paywall.buy')}</Text>
        </Pressable>
        <Pressable onPress={close} style={styles.later}>
          <Text style={styles.laterText}>{t('paywall.later')}</Text>
        </Pressable>
      </Animated.View>
    </View>
    </Modal>
  );
});

function paywallSheetStyles(colors: ThemeColors, _scheme: ColorSchemeName) {
  return {
    root: {
      flex: 1,
      justifyContent: 'flex-end' as const,
    },
    backdrop: {
      position: 'absolute' as const,
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    sheet: {
      backgroundColor: colors.card,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      paddingHorizontal: 20,
      paddingTop: 8,
    },
    handle: {
      alignSelf: 'center' as const,
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.cardBorder,
      marginBottom: 12,
    },
    kicker: {
      color: colors.accent,
      fontFamily: fonts.semibold,
      fontSize: 12,
      letterSpacing: 0.8,
      textTransform: 'uppercase' as const,
    },
    title: { color: colors.text, fontSize: 22, fontFamily: fonts.bold, marginTop: 8 },
    note: { color: colors.muted, fontFamily: fonts.medium, fontSize: 14, lineHeight: 20, marginTop: 10 },
    list: { marginTop: 16, gap: 8 },
    item: { color: colors.text, fontFamily: fonts.medium, fontSize: 14 },
    buy: {
      marginTop: 22,
      backgroundColor: colors.accent,
      borderRadius: radius.full,
      paddingVertical: 14,
      alignItems: 'center' as const,
    },
    buyText: { color: colors.accentText, fontFamily: fonts.bold, fontSize: 16 },
    later: { marginTop: 12, alignItems: 'center' as const, paddingVertical: 8 },
    laterText: { color: colors.muted, fontFamily: fonts.semibold, fontSize: 14 },
    pressed: { opacity: 0.86 },
  };
}
