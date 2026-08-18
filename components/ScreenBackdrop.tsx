import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { useColors } from '@/lib/theme';

export const ScreenBackdrop = memo(function ScreenBackdrop() {
  const colors = useColors();
  return <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: colors.bg }]} />;
});
