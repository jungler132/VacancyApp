import { memo, useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { SourceError } from '@/lib/types';
import { colors, fonts, radius } from '@/lib/theme';

export const ErrorBanner = memo(function ErrorBanner({
  errors,
  onRetry,
  onDismiss,
}: {
  errors: SourceError[];
  onRetry?: () => void;
  onDismiss?: () => void;
}) {
  const [open, setOpen] = useState(true);
  const toggle = useCallback(() => setOpen((value) => !value), []);
  const safe = errors.filter((error) => error?.sourceName && error?.message);

  if (!safe.length) return null;

  return (
    <View style={styles.box}>
      <View style={styles.top}>
        <Pressable onPress={toggle} style={styles.copy}>
          <Text style={styles.title}>
            {safe.length === 1 ? '1 источник не ответил' : `${safe.length} источника не ответили`}
          </Text>
          <Text style={styles.hint}>{open ? 'Скрыть детали' : 'Подробнее'}</Text>
        </Pressable>
        {onRetry ? (
          <Pressable onPress={onRetry} style={styles.retry}>
            <Text style={styles.retryText}>Повтор</Text>
          </Pressable>
        ) : null}
      </View>
      {open
        ? safe.map((error, index) => (
            <Text key={`${error.sourceId}-${error.message}-${index}`} style={styles.line}>
              {String(error.sourceName)} — {String(error.message)}
            </Text>
          ))
        : null}
      {onDismiss ? (
        <Pressable onPress={onDismiss}>
          <Text style={styles.dismiss}>Скрыть</Text>
        </Pressable>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  box: {
    borderWidth: 1.5,
    borderColor: '#6B4E16',
    backgroundColor: colors.orangeDim,
    borderRadius: radius.md,
    padding: 12,
    gap: 8,
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  copy: { flex: 1 },
  title: { color: colors.orange, fontFamily: fonts.bold, fontSize: 13 },
  hint: { color: '#C9A46A', fontSize: 11, marginTop: 2, fontFamily: fonts.regular },
  retry: {
    borderWidth: 1.5,
    borderColor: colors.orange,
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  retryText: { color: colors.orange, fontFamily: fonts.bold, fontSize: 12 },
  line: { color: '#E8C98A', fontSize: 12, lineHeight: 17, fontFamily: fonts.regular },
  dismiss: { color: '#C9A46A', fontSize: 11, fontFamily: fonts.medium },
});
