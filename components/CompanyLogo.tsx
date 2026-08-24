import { memo, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { Image } from 'expo-image';

import { normalizeLogoUrl } from '@/lib/logo';
import { fonts, useThemedStyles, type ThemeColors } from '@/lib/theme';

const APP_ICON = require('../assets/images/icon.png');
const HH_RED = '#D6001C';

function isHhSource(sourceId?: string) {
  return sourceId === 'hh' || sourceId === 'hhaz';
}

export const CompanyLogo = memo(function CompanyLogo({
  uri,
  name,
  size = 56,
  sourceId,
}: {
  uri?: string;
  name: string;
  size?: number;
  sourceId?: string;
}) {
  const styles = useThemedStyles(companyLogoStyles);
  const src = normalizeLogoUrl(uri);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  const box = { width: size, height: size, borderRadius: Math.max(8, Math.round(size * 0.22)) };
  const showCompany = Boolean(src) && !failed;
  const showHhMark = !showCompany && isHhSource(sourceId);

  return (
    <View
      style={[styles.wrap, box, showCompany ? styles.company : showHhMark ? styles.hh : styles.app]}
      accessibilityRole="image"
      accessibilityLabel={name}>
      {showHhMark ? (
        <Text style={[styles.hhMark, { fontSize: Math.round(size * 0.34) }]}>HH</Text>
      ) : (
        <Image
          source={showCompany ? { uri: src } : APP_ICON}
          style={styles.image}
          contentFit={showCompany ? 'contain' : 'cover'}
          cachePolicy="memory-disk"
          recyclingKey={showCompany ? src : 'app-icon'}
          transition={0}
          priority="low"
          onError={() => setFailed(true)}
          accessibilityIgnoresInvertColors
        />
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
    hh: { backgroundColor: '#ffffff', borderColor: HH_RED },
    hhMark: {
      color: HH_RED,
      fontFamily: fonts.bold,
      letterSpacing: -0.6,
    },
    image: { width: '100%' as const, height: '100%' as const },
  };
}
