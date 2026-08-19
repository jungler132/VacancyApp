import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { ServiceMaster, ServiceOffer } from '../services/types';
import reducer, {
  parseSavedServices,
  savedServiceImage,
  serviceSaveKey,
  toSavedMaster,
  toSavedOffer,
  toggleSavedService,
} from './savedServicesSlice';

const offer: ServiceOffer = {
  id: 'offer:1',
  profileId: 'user:1',
  title: 'Уборка',
  description: 'Квартира',
  price: '40',
  currency: 'AZN',
  images: ['https://cdn.example/a.jpg', 'https://cdn.example/b.jpg'],
  kind: 'cleaning',
  updatedAt: '2026-08-19T00:00:00.000Z',
};

const master: ServiceMaster = {
  id: 'user:1',
  displayName: 'Айша',
  bio: '',
  photos: [],
  email: '',
  phone: '',
  kinds: ['cleaning'],
  customKinds: [],
  hours: { open: '09:00', close: '18:00', days: [1, 2, 3, 4, 5] },
  updatedAt: '2026-08-19T00:00:00.000Z',
  avatarUri: 'https://cdn.example/ava.jpg',
  offers: [offer],
};

describe('savedServices', () => {
  it('берёт только удалённое превью и режет мусор', () => {
    assert.equal(savedServiceImage('https://cdn.example/a.jpg'), 'https://cdn.example/a.jpg');
    assert.equal(savedServiceImage('file:///tmp/a.jpg'), undefined);
    assert.equal(savedServiceImage(`https://x/${'a'.repeat(600)}`), undefined);
    const parsed = parseSavedServices([
      toSavedOffer(offer, master),
      { kind: 'offer', id: 'offer:1', profileId: 'user:1', title: 'Дубль', masterName: 'Айша' },
      { kind: 'nope', id: 'x', profileId: 'x', title: 'x', masterName: 'x' },
      { kind: 'master', id: '', profileId: 'user:1', title: 'Пусто', masterName: 'Айша' },
    ]);
    assert.equal(parsed.length, 1);
    assert.equal(parsed[0].title, 'Уборка');
    assert.equal(parsed[0].image, 'https://cdn.example/a.jpg');
  });

  it('добавляет и убирает услугу по звезде', () => {
    const item = toSavedOffer(offer, master);
    assert.equal(serviceSaveKey(item), 'offer:user:1:offer:1');
    const added = reducer({ items: [], ready: true }, toggleSavedService(item));
    assert.equal(added.items.length, 1);
    const removed = reducer(added, toggleSavedService(item));
    assert.equal(removed.items.length, 0);
  });

  it('хранит мастера отдельно от его услуги', () => {
    const offerItem = toSavedOffer(offer, master);
    const masterItem = toSavedMaster(master);
    const withOffer = reducer({ items: [], ready: true }, toggleSavedService(offerItem));
    const withBoth = reducer(withOffer, toggleSavedService(masterItem));
    assert.equal(withBoth.items.length, 2);
    assert.equal(withBoth.items[0].kind, 'master');
  });
});
