import type { ErrorBoundaryProps } from 'expo-router';
import { Appearance, Pressable, Text, View } from 'react-native';

import { t } from '@/lib/i18n';
import { detectLocale } from '@/lib/i18n/locale';

export function RouteErrorBoundary({ retry }: ErrorBoundaryProps) {
  const locale = detectLocale();
  const dark = Appearance.getColorScheme() === 'dark';
  const bg = dark ? '#0b0d12' : '#f4f6fb';
  const text = dark ? '#f2f4f8' : '#111827';
  const muted = dark ? '#9aa3b2' : '#5b6573';
  const accent = '#3b6cff';

  return (
    <View style={{ flex: 1, backgroundColor: bg, justifyContent: 'center', padding: 28 }}>
      <Text style={{ color: text, fontSize: 22, fontWeight: '700', marginBottom: 10 }}>
        {t(locale, 'crash.title')}
      </Text>
      <Text style={{ color: muted, fontSize: 15, lineHeight: 22, marginBottom: 24 }}>
        {t(locale, 'crash.body')}
      </Text>
      <Pressable
        onPress={() => void retry()}
        style={({ pressed }) => ({
          alignSelf: 'flex-start',
          backgroundColor: accent,
          borderRadius: 12,
          paddingHorizontal: 18,
          paddingVertical: 12,
          opacity: pressed ? 0.85 : 1,
        })}>
        <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>{t(locale, 'crash.retry')}</Text>
      </Pressable>
    </View>
  );
}
