export const LIMITS = {
  free: {
    offers: 10,
    offerPhotos: 10,
    profilePhotos: 1,
    jobs: 25,
    pipeline: 50,
  },
  premium: {
    offers: 50,
    offerPhotos: 25,
    profilePhotos: 1,
    jobs: 100,
    pipeline: 250,
  },
} as const;

export type AppLimits = (typeof LIMITS)['free'];

export function appLimits(premium: boolean): AppLimits {
  return premium ? LIMITS.premium : LIMITS.free;
}

export const MAX_OFFERS = LIMITS.premium.offers;
export const MAX_OFFER_PHOTOS = LIMITS.premium.offerPhotos;
export const MAX_PROFILE_PHOTOS = LIMITS.premium.profilePhotos;
export const MAX_JOBS = LIMITS.premium.jobs;
export const MAX_PIPELINE = LIMITS.premium.pipeline;
