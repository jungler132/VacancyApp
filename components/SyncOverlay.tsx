import { memo, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Text } from '@/components/AppText';
import { fonts } from '@/lib/theme';

type OverlayState = { open: boolean; label: string };

const IDLE: OverlayState = { open: false, label: '' };
const PAINT_MS = 48;
const MIN_VISIBLE_MS = 700;

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
  const [state, setState] = useState(current);
  useEffect(() => {
    listeners.add(setState);
    setState(current);
    return () => {
      listeners.delete(setState);
    };
  }, []);
  if (!state.open) return null;
  return (
    <View style={styles.root} pointerEvents="auto">
      <ActivityIndicator size="large" color="#ffffff" />
      <Text style={styles.label}>{state.label}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 32,
    gap: 16,
    zIndex: 100,
    elevation: 100,
  },
  label: {
    color: '#ffffff',
    fontFamily: fonts.semibold,
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
  },
});
