import { memo, useCallback, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import * as Clipboard from 'expo-clipboard';

import { colors, fonts, radius } from '@/lib/theme';

export const CopyLinkButton = memo(function CopyLinkButton({
  url,
  compact = false,
}: {
  url?: string;
  compact?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const copy = useCallback(async () => {
    if (!url) return;
    await Clipboard.setStringAsync(url);
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1600);
  }, [url]);

  if (!url) return null;

  return (
    <Pressable
      onPress={(event) => {
        event.stopPropagation();
        copy();
      }}
      hitSlop={8}
      style={({ pressed }) => [compact ? styles.compact : styles.full, pressed && styles.pressed]}>
      <Text style={compact ? styles.compactText : styles.fullText}>
        {copied ? 'Скопировано' : compact ? 'Ссылка' : 'Скопировать ссылку'}
      </Text>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  pressed: { opacity: 0.72 },
  compact: {
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  compactText: {
    color: colors.muted,
    fontSize: 11,
    fontFamily: fonts.semibold,
  },
  full: {
    marginTop: 10,
    borderColor: colors.cardBorder,
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  fullText: {
    color: colors.text,
    fontFamily: fonts.semibold,
    fontSize: 15,
  },
});
