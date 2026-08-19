import { memo } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/AppText';
import { useT } from '@/lib/i18n/useT';
import { fonts, radius, useThemedStyles, type ThemeColors } from '@/lib/theme';

export const ConfirmModal = memo(function ConfirmModal({
  open,
  title,
  body,
  confirmLabel,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const t = useT();
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(confirmModalStyles);

  return (
    <Modal visible={open} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.card, { marginBottom: Math.max(insets.bottom, 16) }]}>
          <Text style={styles.title}>{title}</Text>
          <ScrollView style={styles.scroll} bounces={false}>
            <Text style={styles.body}>{body}</Text>
          </ScrollView>
          <Pressable onPress={onConfirm} style={({ pressed }) => [styles.yes, pressed && styles.pressed]}>
            <Text style={styles.yesText}>{confirmLabel ?? t('auth.agree')}</Text>
          </Pressable>
          <Pressable onPress={onClose} style={({ pressed }) => [styles.no, pressed && styles.pressed]}>
            <Text style={styles.noText}>{t('auth.later')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
});

function confirmModalStyles(colors: ThemeColors) {
  return {
    root: {
      flex: 1,
      justifyContent: 'center' as const,
      paddingHorizontal: 20,
      backgroundColor: 'rgba(0,0,0,0.45)',
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      padding: 20,
      gap: 12,
      maxHeight: '78%' as const,
    },
    title: { color: colors.text, fontFamily: fonts.bold, fontSize: 20, lineHeight: 26 },
    scroll: { flexGrow: 0 as const, maxHeight: 280 },
    body: { color: colors.muted, fontFamily: fonts.medium, fontSize: 15, lineHeight: 22 },
    yes: {
      height: 48,
      borderRadius: radius.full,
      backgroundColor: colors.accent,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    yesText: { color: colors.accentText, fontFamily: fonts.bold, fontSize: 16 },
    no: {
      height: 44,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    noText: { color: colors.muted, fontFamily: fonts.semibold, fontSize: 15 },
    pressed: { opacity: 0.85 },
  };
}
