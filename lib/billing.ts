export const PREMIUM_SKU = process.env.EXPO_PUBLIC_PLAY_PREMIUM_SKU || 'vakano_premium';

export function purchaseHasPremiumSku(ids: Array<string | undefined | null>): boolean {
  return ids.some((id) => id === PREMIUM_SKU);
}
