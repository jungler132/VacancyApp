import { useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { useAppSelector } from '@/lib/store/hooks';
import { ThemeContext, palette, resolveScheme } from '@/lib/theme';

export function ThemeBridge({ children }: { children: ReactNode }) {
  const pref = useAppSelector((state) => state.appearance.theme);
  const system = useColorScheme();
  const scheme = resolveScheme(pref, system === 'dark' ? 'dark' : 'light');
  const colors = palette(scheme);
  const value = useMemo(() => ({ scheme, colors }), [scheme, colors]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
