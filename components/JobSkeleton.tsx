import { memo, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { colors, radius } from '@/lib/theme';

function Shimmer({ style }: { style?: object }) {
  const opacity = useSharedValue(0.28);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.85, { duration: 750, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [opacity]);

  const animated = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={[styles.block, style, animated]} />;
}

export const JobSkeleton = memo(function JobSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Shimmer style={styles.logo} />
        <View style={styles.lines}>
          <Shimmer style={{ width: '42%', height: 8 }} />
          <Shimmer style={{ width: '88%', height: 12 }} />
        </View>
      </View>
      <Shimmer style={{ width: '100%', height: 8, marginTop: 12 }} />
      <Shimmer style={{ width: '68%', height: 8, marginTop: 8 }} />
    </View>
  );
});

export function JobSkeletonList() {
  return (
    <View>
      <JobSkeleton />
      <JobSkeleton />
      <JobSkeleton />
      <JobSkeleton />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 12,
  },
  row: { flexDirection: 'row', gap: 10 },
  logo: { width: 44, height: 44, borderRadius: 22 },
  lines: { flex: 1, gap: 8, justifyContent: 'center' },
  block: { height: 8, borderRadius: 3, backgroundColor: '#2A3B55' },
});
