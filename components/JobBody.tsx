import { useMemo } from 'react';
import { View } from 'react-native';

import { Text } from '@/components/AppText';
import { parseJobBody } from '@/lib/jobBody';
import { fonts, useThemedStyles, type ThemeColors } from '@/lib/theme';

export function JobBody({ text }: { text: string }) {
  const styles = useThemedStyles(jobBodyStyles);
  const blocks = useMemo(() => parseJobBody(text), [text]);

  if (!blocks.length) return null;

  return (
    <View style={styles.wrap}>
      {blocks.map((block, index) => {
        if (block.type === 'heading') {
          return (
            <Text key={`h-${index}`} style={[styles.heading, index === 0 && styles.first]}>
              {block.text}
            </Text>
          );
        }
        if (block.type === 'list') {
          return (
            <View key={`l-${index}`} style={styles.list}>
              {block.items.map((item, itemIndex) => (
                <View key={itemIndex} style={styles.item}>
                  <View style={styles.bullet} />
                  <Text style={styles.itemText} selectable>
                    {item}
                  </Text>
                </View>
              ))}
            </View>
          );
        }
        return (
          <Text key={`p-${index}`} style={[styles.paragraph, index === 0 && styles.first]} selectable>
            {block.text}
          </Text>
        );
      })}
    </View>
  );
}

function jobBodyStyles(colors: ThemeColors) {
  return {
    wrap: { marginTop: 8, marginBottom: 12, gap: 10 },
    first: { marginTop: 0 },
    heading: {
      marginTop: 8,
      color: colors.text,
      fontFamily: fonts.semibold,
      fontSize: 15,
      lineHeight: 22,
    },
    paragraph: {
      color: colors.text,
      fontFamily: fonts.regular,
      fontSize: 15,
      lineHeight: 24,
    },
    list: { gap: 8 },
    item: { flexDirection: 'row' as const, alignItems: 'flex-start' as const, gap: 10 },
    bullet: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.accent,
      marginTop: 9,
    },
    itemText: {
      flex: 1,
      color: colors.text,
      fontFamily: fonts.regular,
      fontSize: 15,
      lineHeight: 24,
    },
  };
}
