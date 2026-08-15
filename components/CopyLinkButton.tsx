import { memo, useCallback, useRef, useState } from 'react';
import { Button } from 'react-native-paper';
import * as Clipboard from 'expo-clipboard';

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
    <Button
      mode={compact ? 'text' : 'outlined'}
      compact={compact}
      icon={copied ? 'check' : 'content-copy'}
      onPress={copy}
      style={compact ? undefined : { marginTop: 10 }}>
      {copied ? 'Скопировано' : compact ? 'Ссылка' : 'Скопировать ссылку'}
    </Button>
  );
});
