import type { CategoryId, RegionId } from './types';

export function makeFeedKey(
  query: string,
  region: RegionId,
  category: CategoryId,
  sources: string[] = [],
): string {
  return `v6|${region}|${category}|${query.trim().toLowerCase()}|${[...sources].sort().join(',')}`;
}
