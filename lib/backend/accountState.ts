import { DEFAULT_FONT_SIZE, parseFontSize, type FontSizeId } from '@/lib/fontScale';
import { DEFAULT_LOCALE, parseLocale, type AppLocale } from '@/lib/i18n/locale';
import { MAX_ALERTS, type SavedSearch } from '@/lib/alerts';
import { MAX_PIPELINE } from '@/lib/limits';
import { DEFAULT_THEME_PREF, parseThemePref, type ThemePreference } from '@/lib/theme';
import { parsePersistedFilters, type PersistedFilters } from '@/lib/store/filtersSlice';
import { parseSavedCatalog, type SavedCatalogItem } from '@/lib/store/savedCatalogSlice';
import { MAX_SAVED_SERVICES, parseSavedServices, type SavedServiceItem } from '@/lib/store/savedServicesSlice';
import { parseSavedPersist, type SavedPersist } from '@/lib/store/savedSlice';
import { parseVisits, VISITS_LIMIT, type SiteVisit } from '@/lib/store/visitsSlice';

export type AccountStateBlob = {
  appearance: { fontSize: FontSizeId; locale: AppLocale; theme: ThemePreference };
  saved: SavedPersist;
  savedCatalog: SavedCatalogItem[];
  savedServices: SavedServiceItem[];
  filters: PersistedFilters;
  alerts: SavedSearch[];
  sources: string[];
  visits: SiteVisit[];
};

export type AccountStateInput = {
  appearance: { fontSize: FontSizeId; locale: AppLocale; theme: ThemePreference };
  saved: SavedPersist;
  savedCatalog: SavedCatalogItem[];
  savedServices: SavedServiceItem[];
  filters: PersistedFilters;
  alerts: SavedSearch[];
  sources: { disabledIds: string[] };
  visits: { items: SiteVisit[] };
};

export function emptyAccountState(): AccountStateBlob {
  return {
    appearance: { fontSize: DEFAULT_FONT_SIZE, locale: DEFAULT_LOCALE, theme: DEFAULT_THEME_PREF },
    saved: { items: [], statuses: {}, statusAt: {} },
    savedCatalog: [],
    savedServices: [],
    filters: parsePersistedFilters(null),
    alerts: [],
    sources: [],
    visits: [],
  };
}

export function collectAccountState(state: AccountStateInput): AccountStateBlob {
  const saved = parseSavedPersist(state.saved);
  const items = saved.items.slice(0, MAX_PIPELINE);
  const ids = new Set(items.map((item) => item.id));
  return {
    appearance: {
      fontSize: parseFontSize(state.appearance.fontSize),
      locale: parseLocale(state.appearance.locale) ?? DEFAULT_LOCALE,
      theme: parseThemePref(state.appearance.theme),
    },
    saved: {
      items,
      statuses: Object.fromEntries(Object.entries(saved.statuses).filter(([id]) => ids.has(id))),
      statusAt: Object.fromEntries(Object.entries(saved.statusAt).filter(([id]) => ids.has(id))),
    },
    savedCatalog: parseSavedCatalog(state.savedCatalog).slice(0, 80),
    savedServices: parseSavedServices(state.savedServices).slice(0, MAX_SAVED_SERVICES),
    filters: parsePersistedFilters(state.filters),
    alerts: (Array.isArray(state.alerts) ? state.alerts : []).slice(0, MAX_ALERTS),
    sources: state.sources.disabledIds.filter((id) => typeof id === 'string' && id).slice(0, 80),
    visits: parseVisits(state.visits.items).slice(0, VISITS_LIMIT),
  };
}

export function parseAccountState(raw: unknown): AccountStateBlob {
  const empty = emptyAccountState();
  if (!raw || typeof raw !== 'object') return empty;
  const row = raw as Partial<AccountStateBlob>;
  const saved = parseSavedPersist(row.saved);
  return {
    appearance: {
      fontSize: parseFontSize(row.appearance?.fontSize),
      locale: parseLocale(row.appearance?.locale) ?? empty.appearance.locale,
      theme: parseThemePref(row.appearance?.theme),
    },
    saved,
    savedCatalog: parseSavedCatalog(row.savedCatalog),
    savedServices: parseSavedServices(row.savedServices),
    filters: parsePersistedFilters(row.filters),
    alerts: Array.isArray(row.alerts) ? row.alerts.slice(0, MAX_ALERTS) : [],
    sources: Array.isArray(row.sources) ? row.sources.filter((id): id is string => typeof id === 'string') : [],
    visits: parseVisits(row.visits),
  };
}
