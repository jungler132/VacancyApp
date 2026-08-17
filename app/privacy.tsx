import { Linking, ScrollView, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

import { NavRow } from '@/components/NavRow';
import { Text } from '@/components/AppText';
import { useLocale, useT } from '@/lib/i18n/useT';
import { PRIVACY_EMAIL, PRIVACY_URL, privacyDoc } from '@/lib/privacy';
import { fonts, useThemedStyles, type ThemeColors } from '@/lib/theme';

export default function PrivacyScreen() {
  const t = useT();
  const locale = useLocale();
  const styles = useThemedStyles(privacyStyles);
  const doc = privacyDoc(locale);

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.lead}>{doc.updated}</Text>
        {doc.blocks.map((block, index) => (
          <View key={`${block.heading}-${index}`} style={styles.block}>
            {block.heading ? <Text style={styles.heading}>{block.heading}</Text> : null}
            {block.paragraphs.map((paragraph, paragraphIndex) => (
              <Text key={`${index}-${paragraphIndex}`} style={styles.body}>
                {paragraph}
              </Text>
            ))}
            {block.items?.map((item) => (
              <View key={item} style={styles.item}>
                <Text style={styles.dot}>•</Text>
                <Text style={styles.body}>{item}</Text>
              </View>
            ))}
          </View>
        ))}
        <NavRow
          title={t('privacy.mail')}
          meta={PRIVACY_EMAIL}
          onPress={() => Linking.openURL(`mailto:${PRIVACY_EMAIL}`).catch(() => undefined)}
        />
        <NavRow title={t('privacy.web')} onPress={() => WebBrowser.openBrowserAsync(PRIVACY_URL)} />
      </ScrollView>
    </View>
  );
}

function privacyStyles(colors: ThemeColors) {
  return {
    screen: { flex: 1, backgroundColor: 'transparent' },
    content: { padding: 20, paddingBottom: 48, gap: 8 },
    lead: { color: colors.faint, fontFamily: fonts.medium, fontSize: 13, lineHeight: 18, marginBottom: 8 },
    block: { gap: 8, marginBottom: 8 },
    heading: { color: colors.text, fontFamily: fonts.semibold, fontSize: 16, lineHeight: 22, marginTop: 8 },
    body: { color: colors.text, fontFamily: fonts.regular, fontSize: 15, lineHeight: 24, flex: 1 },
    item: { flexDirection: 'row' as const, alignItems: 'flex-start' as const, gap: 8 },
    dot: { color: colors.accent, fontFamily: fonts.bold, fontSize: 15, lineHeight: 24 },
  };
}
