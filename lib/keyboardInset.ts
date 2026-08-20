import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

type Reveal = (keyboardTop?: number) => void;
type InsetListener = (inset: number) => void;

const reveals: Reveal[] = [];
const insetListeners = new Set<InsetListener>();

let nativeCount = 0;
let showSub: { remove: () => void } | null = null;
let hideSub: { remove: () => void } | null = null;
let currentInset = 0;
let revealTimer: ReturnType<typeof setTimeout> | null = null;

export function registerKeyboardReveal(fn: Reveal) {
  reveals.push(fn);
  return () => {
    const index = reveals.lastIndexOf(fn);
    if (index >= 0) reveals.splice(index, 1);
  };
}

export function requestKeyboardReveal(keyboardTop?: number) {
  reveals[reveals.length - 1]?.(keyboardTop);
}

export function scheduleKeyboardReveal() {
  requestAnimationFrame(() => requestKeyboardReveal());
  if (revealTimer) clearTimeout(revealTimer);
  revealTimer = setTimeout(() => {
    revealTimer = null;
    requestKeyboardReveal();
  }, Platform.OS === 'android' ? 120 : 40);
}

function emitInset(next: number) {
  currentInset = next;
  for (const listener of insetListeners) listener(next);
}

function bindNative() {
  if (nativeCount++) return;
  const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
  const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
  showSub = Keyboard.addListener(showEvent, (event) => {
    emitInset(event.endCoordinates.height);
    const top = event.endCoordinates.screenY;
    requestAnimationFrame(() => requestKeyboardReveal(top));
    if (revealTimer) clearTimeout(revealTimer);
    revealTimer = setTimeout(() => {
      revealTimer = null;
      requestKeyboardReveal(top);
    }, Platform.OS === 'android' ? 90 : 30);
  });
  hideSub = Keyboard.addListener(hideEvent, () => emitInset(0));
}

function unbindNative() {
  if (--nativeCount > 0) return;
  showSub?.remove();
  hideSub?.remove();
  showSub = null;
  hideSub = null;
}

export function useKeyboardInset() {
  const [inset, setInset] = useState(currentInset);
  useEffect(() => {
    insetListeners.add(setInset);
    bindNative();
    setInset(currentInset);
    return () => {
      insetListeners.delete(setInset);
      unbindNative();
    };
  }, []);
  return inset;
}
