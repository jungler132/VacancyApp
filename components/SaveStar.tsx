import { memo } from 'react';
import { Pressable } from 'react-native';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';

import { useT } from '@/lib/i18n/useT';
import { useColors } from '@/lib/theme';

export const SaveStar = memo(function SaveStar({
  saved,
  onToggle,
  size = 22,
}: {
  saved: boolean;
  onToggle: () => void;
  size?: number;
}) {
  const t = useT();
  const colors = useColors();
  return (
    <Pressable
      onPress={(event) => {
        event.stopPropagation();
        onToggle();
      }}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={saved ? t('common.unsave') : t('common.save')}>
      <MaterialDesignIcons
        name={saved ? 'star' : 'star-outline'}
        size={size}
        color={saved ? colors.accent : colors.faint}
      />
    </Pressable>
  );
});
