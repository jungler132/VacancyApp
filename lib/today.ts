import { isApplyStatus, type ApplyStatus } from '@/lib/apply';
import { apiCategory, jobMatchesAnyLang, jobMatchesRegion } from '@/lib/catalog';
import { jobMatchesExtra, type ExtraFilters } from '@/lib/filters';
import { compareJobsByDate, publishedMs } from '@/lib/freshness';
import { jobMatchesPrefs, prefsFilled, type SeekPrefs } from '@/lib/prefs';
import type { CategoryId, Job, RegionId } from '@/lib/types';

export const STALE_SOON_DAYS = 14;
export const MAX_TODAY_JOBS = 60;
const DAY_MS = 24 * 60 * 60 * 1000;
const LIVE_STALE: ApplyStatus[] = ['applied', 'review', 'interview', 'test'];

export type TodayAlert = {
  id: string;
  enabled: boolean;
  pendingNew: number;
  pendingNewIds?: string[];
  pendingJobs?: Job[];
  query: string;
  region: RegionId;
  categories: CategoryId[];
  extra: ExtraFilters;
};

export type StaleJob = {
  id: string;
  title: string;
  company: string;
  ageDays: number;
};

export type TodayCard = {
  newCount: number;
  alert: TodayAlert | null;
  alertCount: number;
  pendingNewTotal: number;
  moves: number;
  staleJob: StaleJob | null;
  staleCount: number;
};

export type TodayDigest = TodayCard & {
  newJobs: Job[];
};

export function startOfLocalDay(now: number): number {
  const date = new Date(now);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function ageOf(job: Job, statusAt?: string, now = Date.now()): number | null {
  const published = publishedMs(job.publishedAt);
  if (published != null) return Math.floor((now - published) / DAY_MS);
  if (!statusAt) return null;
  const stamped = Date.parse(statusAt);
  if (!Number.isFinite(stamped) || stamped > now) return null;
  return Math.floor((now - stamped) / DAY_MS);
}

function jobMatchesAlert(job: Job, alert: TodayAlert): boolean {
  const hay = `${job.title} ${job.company} ${job.excerpt} ${job.category ?? ''}`;
  if (!jobMatchesAnyLang(hay, alert.query, apiCategory(alert.categories))) return false;
  if (!jobMatchesExtra(job, alert.extra)) return false;
  return jobMatchesRegion(job.location, alert.region, job.remote);
}

function pushJob(out: Job[], seen: Set<string>, job?: Job) {
  if (!job || seen.has(job.id)) return;
  seen.add(job.id);
  out.push(job);
}

function jobById(id: string, jobsById?: Record<string, Job>, cached?: Map<string, Job>) {
  return jobsById?.[id] ?? cached?.get(id);
}

export function collectNewJobs(input: {
  alerts: TodayAlert[];
  jobsById?: Record<string, Job>;
  cachedJobs?: Job[];
  savedJobs: Job[];
  prefs?: SeekPrefs;
  now?: number;
}): Job[] {
  const now = input.now ?? Date.now();
  const dayStart = startOfLocalDay(now);
  const cachedMap = input.cachedJobs ? new Map(input.cachedJobs.map((job) => [job.id, job])) : undefined;
  const tracked = new Set(input.savedJobs.map((job) => job.id));
  const seen = new Set<string>();
  const out: Job[] = [];
  const enabled = input.alerts.filter((item) => item.enabled);

  for (const alert of enabled) {
    const pendingMap = alert.pendingJobs?.length
      ? new Map(alert.pendingJobs.map((job) => [job.id, job]))
      : undefined;
    for (const id of alert.pendingNewIds ?? []) {
      pushJob(out, seen, jobById(id, input.jobsById, cachedMap) ?? pendingMap?.get(id));
    }
  }

  let scanned: Job[] | undefined;
  const scan = () => {
    scanned ??= input.cachedJobs ?? (input.jobsById ? Object.values(input.jobsById) : []);
    return scanned;
  };

  if (!out.length) {
    for (const alert of enabled.filter((item) => item.pendingNew > 0)) {
      for (const job of scan()) {
        if (tracked.has(job.id)) continue;
        if (!jobMatchesAlert(job, alert)) continue;
        pushJob(out, seen, job);
        if (out.length >= MAX_TODAY_JOBS) break;
      }
    }
  }

  if (!out.length && input.prefs && prefsFilled(input.prefs)) {
    for (const job of scan()) {
      if (tracked.has(job.id)) continue;
      const published = Date.parse(job.publishedAt ?? '');
      if (!Number.isFinite(published) || published < dayStart || published > now) continue;
      if (jobMatchesPrefs(job, input.prefs)) pushJob(out, seen, job);
    }
  }

  return out.sort(compareJobsByDate).slice(0, MAX_TODAY_JOBS);
}

export function todayCard(input: {
  alerts: TodayAlert[];
  savedJobs: Job[];
  statuses: Record<string, ApplyStatus>;
  statusAt: Record<string, string>;
  now?: number;
}): TodayCard {
  const now = input.now ?? Date.now();
  const dayStart = startOfLocalDay(now);
  const enabled = input.alerts.filter((item) => item.enabled);
  const withNew = enabled
    .filter((item) => item.pendingNew > 0 || (item.pendingNewIds?.length ?? 0) > 0)
    .sort((a, b) => b.pendingNew - a.pendingNew);
  const pendingNewTotal = withNew.reduce((sum, item) => sum + item.pendingNew, 0);
  const pendingIdCount = withNew.reduce((sum, item) => sum + (item.pendingNewIds?.length ?? 0), 0);

  let moves = 0;
  for (const stamp of Object.values(input.statusAt)) {
    const time = Date.parse(stamp);
    if (Number.isFinite(time) && time >= dayStart && time <= now) moves += 1;
  }

  let staleJob: StaleJob | null = null;
  let staleCount = 0;
  for (const job of input.savedJobs) {
    const status = input.statuses[job.id];
    if (!isApplyStatus(status) || !LIVE_STALE.includes(status)) continue;
    const ageDays = ageOf(job, input.statusAt[job.id], now);
    if (ageDays == null || ageDays < STALE_SOON_DAYS) continue;
    staleCount += 1;
    if (!staleJob || ageDays > staleJob.ageDays) {
      staleJob = { id: job.id, title: job.title, company: job.company, ageDays };
    }
  }

  return {
    newCount: pendingNewTotal || pendingIdCount,
    alert: withNew[0] ?? null,
    alertCount: withNew.length,
    pendingNewTotal,
    moves,
    staleJob,
    staleCount,
  };
}

export function todayDigest(input: {
  alerts: TodayAlert[];
  jobsById?: Record<string, Job>;
  cachedJobs?: Job[];
  savedJobs: Job[];
  statuses: Record<string, ApplyStatus>;
  statusAt: Record<string, string>;
  prefs?: SeekPrefs;
  now?: number;
}): TodayDigest {
  const card = todayCard(input);
  const newJobs = collectNewJobs(input);
  return { ...card, newJobs, newCount: newJobs.length || card.newCount };
}
