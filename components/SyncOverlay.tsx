import { memo, useEffect, useState } from 'react';
import { ActivityIndicator, Modal, View, useWindowDimensions } from 'react-native';

import { Text } from '@/components/AppText';
import { fonts, radius, useAppTheme, useThemedStyles, type ThemeColors } from '@/lib/theme';

type OverlayState = { open: boolean; label: string };

const IDLE: OverlayState = { open: false, label: '' };
const PAINT_MS = 32;
const MIN_VISIBLE_MS = 280;

let current = IDLE;
const listeners = new Set<(state: OverlayState) => void>();

function emit(next: OverlayState) {
  current = next;
  for (const listener of listeners) listener(next);
}

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function runWithOverlay<T>(label: string, work: () => Promise<T>): Promise<T> {
  emit({ open: true, label });
  await wait(PAINT_MS);
  const started = Date.now();
  try {
    return await work();
  } finally {
    const left = MIN_VISIBLE_MS - (Date.now() - started);
    if (left > 0) await wait(left);
    emit(IDLE);
  }
}

export const SyncOverlayHost = memo(function SyncOverlayHost() {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(overlayStyles);
  const { width, height } = useWindowDimensions();
  const [state, setState] = useState(current);
  useEffect(() => {
    listeners.add(setState);
    setState(current);
    return () => {
      listeners.delete(setState);
    };
  }, []);
  return (
    <Modal visible={state.open} transparent animationType="fade" statusBarTranslucent>
      <View
        collapsable={false}
        pointerEvents="auto"
        style={[styles.root, { width, height, minHeight: height }]}>
        <View style={styles.card}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.label}>{state.label}</Text>
        </View>
      </View>
    </Modal>
  );
});

function overlayStyles(colors: ThemeColors) {
  return {
    root: {
      flex: 1,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor: 'rgba(7, 9, 15, 0.55)',
      paddingHorizontal: 28,
    },
    card: {
      minWidth: 220,
      maxWidth: 320,
      backgroundColor: colors.card,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      paddingHorizontal: 24,
      paddingVertical: 22,
      alignItems: 'center' as const,
      gap: 14,
    },
    label: {
      color: colors.text,
      fontFamily: fonts.semibold,
      fontSize: 16,
      lineHeight: 22,
      textAlign: 'center' as const,
    },
  };
}
