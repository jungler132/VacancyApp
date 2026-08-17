import { useCallback } from 'react';

import { useAppSelector } from '@/lib/store/hooks';

import { t, type MsgId, type TVars } from './index';

export function useT() {
  const locale = useAppSelector((state) => state.appearance.locale);
  return useCallback((id: MsgId, vars?: TVars) => t(locale, id, vars), [locale]);
}

export function useLocale() {
  return useAppSelector((state) => state.appearance.locale);
}
