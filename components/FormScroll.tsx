import { useCallback, useEffect, useRef, type ReactNode } from 'react';
import {
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { registerKeyboardReveal, useKeyboardInset } from '@/lib/keyboardInset';

const ABOVE_KEYBOARD = 24;
const ROOM_BELOW = 168;

export function FormScroll({
  children,
  contentContainerStyle,
  style,
  active = true,
  padForKeyboard = true,
  onScroll,
  ...rest
}: ScrollViewProps & { children: ReactNode; active?: boolean; padForKeyboard?: boolean }) {
  const ref = useRef<ScrollView>(null);
  const offsetY = useRef(0);
  const inset = useKeyboardInset();

  const reveal = useCallback((keyboardTop?: number) => {
    const top = keyboardTop ?? Keyboard.metrics()?.screenY;
    if (top == null) return;
    const node = TextInput.State.currentlyFocusedInput?.();
    if (!node || typeof node.measureInWindow !== 'function') return;
    node.measureInWindow((_x, y, _w, h) => {
      const covered = y + h + ABOVE_KEYBOARD - top;
      const extra = Math.max(0, ROOM_BELOW - (top - (y + h)));
      const delta = Math.max(covered, extra);
      if (delta > 8) {
        ref.current?.scrollTo({ y: Math.max(0, offsetY.current + delta), animated: true });
      }
    });
  }, []);

  useEffect(() => {
    if (!active) return;
    return registerKeyboardReveal(reveal);
  }, [active, reveal]);

  const onMove = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      offsetY.current = event.nativeEvent.contentOffset.y;
      onScroll?.(event);
    },
    [onScroll],
  );

  const flat = StyleSheet.flatten(contentContainerStyle) as ViewStyle | undefined;
  const basePad = typeof flat?.paddingBottom === 'number' ? flat.paddingBottom : typeof flat?.padding === 'number' ? flat.padding : 0;
  const keyboardPad = Platform.OS === 'ios' || !padForKeyboard ? 0 : inset;

  return (
    <ScrollView
      ref={ref}
      {...rest}
      style={[{ flex: 1 }, style]}
      keyboardShouldPersistTaps="always"
      keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
      nestedScrollEnabled
      scrollEventThrottle={16}
      onScroll={onMove}
      contentContainerStyle={[contentContainerStyle, { paddingBottom: basePad + keyboardPad }] as StyleProp<ViewStyle>}>
      {children}
    </ScrollView>
  );
}
