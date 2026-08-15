import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';

import { radius } from '@/lib/theme';

export const EmptyState = memo(function EmptyState({
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.box}>
      <Text variant="titleMedium" style={styles.title}>
        {title}
      </Text>
      {subtitle ? (
        <Text variant="bodyMedium" style={styles.sub}>
          {subtitle}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button mode="contained-tonal" compact onPress={onAction} style={styles.action}>
          {actionLabel}
        </Button>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  box: { paddingVertical: 48, alignItems: 'center', gap: 8, paddingHorizontal: 24 },
  title: { textAlign: 'center' },
  sub: { textAlign: 'center', opacity: 0.75 },
  action: { marginTop: 8, borderRadius: radius.md },
});
