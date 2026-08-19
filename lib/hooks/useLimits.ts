import { appLimits } from '@/lib/limits';
import { useAppSelector } from '@/lib/store/hooks';

export function useLimits() {
  const premium = useAppSelector((state) => state.premium.isPremium);
  return appLimits(premium);
}
