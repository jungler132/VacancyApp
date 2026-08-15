import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

export const EmptyState = memo(function EmptyState({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
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
    </View>
  );
});

const styles = StyleSheet.create({
  box: { paddingVertical: 48, alignItems: 'center', gap: 8, paddingHorizontal: 24 },
  title: { textAlign: 'center' },
  sub: { textAlign: 'center', opacity: 0.75 },
});
