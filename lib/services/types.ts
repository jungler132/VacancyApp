export type ServiceKindId =
  | 'cleaning'
  | 'beauty'
  | 'repair'
  | 'tutoring'
  | 'photo'
  | 'delivery'
  | 'pets'
  | 'it_help'
  | 'events'
  | 'other';

export type WeekdayId = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type ServiceHours = {
  open: string;
  close: string;
  days: WeekdayId[];
};

export type ServiceOffer = {
  id: string;
  profileId: string;
  title: string;
  description: string;
  price?: string;
  currency: string;
  images: string[];
  address?: string;
  phone?: string;
  kind: ServiceKindId;
  customKind?: string;
  featured?: boolean;
  updatedAt: string;
};

export type ServiceProfile = {
  id: string;
  displayName: string;
  bio: string;
  avatarUri?: string;
  photos: string[];
  email: string;
  phone: string;
  kinds: ServiceKindId[];
  customKinds: string[];
  address?: string;
  hours: ServiceHours;
  updatedAt: string;
};

export type ServiceMaster = ServiceProfile & {
  offers: ServiceOffer[];
  mine?: boolean;
};
