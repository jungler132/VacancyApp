import { memo, useEffect, useState } from 'react';
import { Image, View } from 'react-native';

import { normalizeLogoUrl } from '@/lib/logo';
import { useThemedStyles, type ThemeColors } from '@/lib/theme';

const APP_ICON = require('../assets/images/icon.png');

export const CompanyLogo = memo(function CompanyLogo({
  uri,
  name,
  size = 56,
}: {
  uri?: string;
  name: string;
  size?: number;
}) {
  const styles = useThemedStyles(companyLogoStyles);
  const src = normalizeLogoUrl(uri);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  const box = { width: size, height: size, borderRadius: Math.max(8, Math.round(size * 0.22)) };
  const showCompany = Boolean(src) && !failed;

  return (
    <View
      style={[styles.wrap, box, showCompany ? styles.company : styles.app]}
      accessibilityRole="image"
      accessibilityLabel={name}>
      {showCompany ? (
        <Image
          source={{ uri: src }}
          style={styles.image}
          resizeMode="contain"
          onError={() => setFailed(true)}
          accessibilityIgnoresInvertColors
        />
      ) : (
        <Image source={APP_ICON} style={styles.image} resizeMode="cover" accessibilityIgnoresInvertColors />
      )}
    </View>
  );
});

function companyLogoStyles(colors: ThemeColors) {
  return {
    wrap: {
      borderWidth: 1,
      borderColor: colors.cardBorder,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      overflow: 'hidden' as const,
    },
    company: { backgroundColor: '#ffffff' },
    app: { backgroundColor: colors.accent, borderColor: colors.accent },
    image: { width: '100%' as const, height: '100%' as const },
  };
}
