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

export type ServiceHours = {
  open: string;
  close: string;
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
  updatedAt: string;
};

export type ServiceProfile = {
  id: string;
  displayName: string;
  bio: string;
  avatarUri?: string;
  email: string;
  phone: string;
  kinds: ServiceKindId[];
  address?: string;
  hours: ServiceHours;
  updatedAt: string;
};

export type ServiceMaster = ServiceProfile & {
  offers: ServiceOffer[];
  mine?: boolean;
};
