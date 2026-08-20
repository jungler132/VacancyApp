import type { CategoryId, RegionId } from './types';

export function makeFeedKey(
  query: string,
  region: RegionId,
  category: CategoryId,
  sources: string[] = [],
  placeId = '',
): string {
  return `v7|${region}|${category}|${query.trim().toLowerCase()}|${[...sources].sort().join(',')}|${placeId}`;
}

export function feedKeyOf(args: {
  query: string;
  region: RegionId;
  category: CategoryId;
  enabledSources?: string[];
  placeId?: string;
}): string {
  return makeFeedKey(args.query, args.region, args.category, args.enabledSources, args.placeId);
}
