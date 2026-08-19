import { memo, useCallback } from 'react';
import { View } from 'react-native';
import { Switch } from 'react-native-paper';

import { Text } from '@/components/AppText';
import { useT } from '@/lib/i18n/useT';
import { fonts, premiumGlow, premiumSurface, radius, useColors, useThemedStyles, type ColorSchemeName, type ThemeColors } from '@/lib/theme';

export const PlanSwitch = memo(function PlanSwitch({
  premium,
  onBasic,
  onPremium,
}: {
  premium: boolean;
  onBasic: () => void;
  onPremium: () => void;
}) {
  const t = useT();
  const colors = useColors();
  const styles = useThemedStyles(planSwitchStyles);
  const onToggle = useCallback(
    (next: boolean) => {
      if (next) onPremium();
      else onBasic();
    },
    [onBasic, onPremium],
  );

  return (
    <View style={[styles.card, premium && styles.cardOn]}>
      {premium ? <View style={styles.stripe} /> : null}
      <View style={styles.copy}>
        <Text style={styles.title}>{t('profile.plan')}</Text>
        <Text style={styles.meta}>{premium ? t('profile.accountPremium') : t('profile.accountFree')}</Text>
        <Text style={styles.hint}>{premium ? t('profile.premiumOn') : t('profile.premiumHint')}</Text>
      </View>
      <View style={styles.toggle}>
        <Text style={[styles.side, !premium && styles.sideOn]}>{t('common.basic')}</Text>
        <Switch value={premium} onValueChange={onToggle} color={colors.orange} />
        <Text style={[styles.side, styles.sideRight, premium && styles.sidePrem]}>{t('common.premium')}</Text>
      </View>
    </View>
  );
});

function planSwitchStyles(colors: ThemeColors, scheme: ColorSchemeName) {
  return {
    card: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      borderRadius: radius.lg,
      paddingHorizontal: 16,
      paddingVertical: 14,
      gap: 12,
      overflow: 'hidden' as const,
    },
    cardOn: {
      ...premiumSurface(colors),
      ...premiumGlow(scheme),
    },
    stripe: {
      position: 'absolute' as const,
      left: 0,
      top: 0,
      bottom: 0,
      width: 4,
      backgroundColor: colors.orange,
    },
    copy: { paddingLeft: 6, gap: 2 },
    title: { color: colors.text, fontFamily: fonts.semibold, fontSize: 15 },
    meta: { color: colors.faint, fontFamily: fonts.medium, fontSize: 12 },
    hint: { color: colors.muted, fontFamily: fonts.medium, fontSize: 12, lineHeight: 18, marginTop: 4 },
    toggle: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const, gap: 8 },
    side: { color: colors.faint, fontFamily: fonts.semibold, fontSize: 13, flex: 1 },
    sideOn: { color: colors.text },
    sideRight: { textAlign: 'right' as const },
    sidePrem: { color: colors.orange },
  };
}
