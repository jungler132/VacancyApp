import { memo, useCallback, useEffect, type ReactNode } from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';

import { ChipWrap } from '@/components/ChipWrap';
import { Text } from '@/components/AppText';
import { fonts, radius, shadowsFor, useColors, useThemedStyles, type ColorSchemeName, type ThemeColors } from '@/lib/theme';

const SHEET_TRAVEL = Dimensions.get('window').height;
const OPEN_CFG = { duration: 220, easing: Easing.out(Easing.cubic) };
const CLOSE_CFG = { duration: 180, easing: Easing.in(Easing.cubic) };

export const FilterSheetFrame = memo(function FilterSheetFrame({
  open,
  dirty,
  title,
  resetLabel,
  doneLabel,
  onClose,
  onReset,
  footer,
  children,
}: {
  open: boolean;
  dirty: boolean;
  title: string;
  resetLabel: string;
  doneLabel: string;
  onClose: () => void;
  onReset: () => void;
  footer?: ReactNode;
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const styles = useThemedStyles(filterSheetFrameStyles);
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
    <View pointerEvents={open ? 'auto' : 'none'} style={styles.root}>
      <Pressable style={StyleSheet.absoluteFill} onPress={close}>
        <Animated.View style={[styles.backdrop, backdropStyle]} />
      </Pressable>
      <Animated.View style={[styles.sheet, sheetStyle, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.handle} />
        <View style={styles.head}>
          <Pressable onPress={close} hitSlop={8} style={styles.headLeft} accessibilityRole="button">
            <MaterialDesignIcons name="close" size={22} color={colors.text} />
          </Pressable>
          <Text style={styles.title}>{title}</Text>
          <Pressable onPress={onReset} hitSlop={8} disabled={!dirty} style={styles.headRight}>
            <Text style={[styles.reset, !dirty && styles.resetOff]}>{resetLabel}</Text>
          </Pressable>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
        {footer}
        <Pressable onPress={close} style={({ pressed }) => [styles.done, pressed && styles.pressed]}>
          <Text style={styles.doneText}>{doneLabel}</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
});

export const FilterSheetSection = memo(function FilterSheetSection({
  title,
  children,
  chips = true,
}: {
  title: string;
  children: ReactNode;
  chips?: boolean;
}) {
  const styles = useThemedStyles(filterSheetFrameStyles);
  return (
    <>
      <Text style={styles.section}>{title}</Text>
      {chips ? <ChipWrap>{children}</ChipWrap> : children}
    </>
  );
});

function filterSheetFrameStyles(colors: ThemeColors, scheme: ColorSchemeName) {
  return {
    root: {
      position: 'absolute' as const,
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      justifyContent: 'flex-end' as const,
      zIndex: 50,
      elevation: 50,
    },
    backdrop: {
      ...StyleSheet.absoluteFill,
      backgroundColor: 'rgba(25, 28, 30, 0.4)',
    },
    sheet: {
      backgroundColor: colors.card,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      paddingHorizontal: 20,
      paddingTop: 8,
      maxHeight: '82%' as const,
      ...shadowsFor(scheme).tabBar,
    },
    handle: {
      alignSelf: 'center' as const,
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.cardBorder,
      marginBottom: 12,
    },
    head: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      marginBottom: 8,
      minHeight: 40,
    },
    headLeft: { minWidth: 64, alignItems: 'flex-start' as const },
    headRight: { minWidth: 64, alignItems: 'flex-end' as const },
    title: { color: colors.text, fontSize: 18, fontFamily: fonts.semibold, flex: 1, textAlign: 'center' as const },
    reset: { color: colors.accent, fontFamily: fonts.semibold, fontSize: 14 },
    resetOff: { color: colors.faint },
    section: {
      color: colors.muted,
      fontFamily: fonts.semibold,
      fontSize: 12,
      letterSpacing: 0.6,
      textTransform: 'uppercase' as const,
      marginTop: 12,
      marginBottom: 10,
    },
    done: {
      marginTop: 16,
      backgroundColor: colors.accent,
      borderRadius: radius.full,
      paddingVertical: 16,
      alignItems: 'center' as const,
    },
    doneText: { color: colors.accentText, fontFamily: fonts.bold, fontSize: 16 },
    pressed: { opacity: 0.9 },
  };
}
