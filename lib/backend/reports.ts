import { getSupabase } from '@/lib/backend/supabase';
import {
  REPORT_MAX,
  isReportCooldownError,
  reportUnlockAt,
  type ServiceReportTarget,
} from '@/lib/support';

export type ReportSubmitStatus = 'ok' | 'cooldown' | 'failed';

let lastReport: { userId: string; at: number } | null = null;

function rememberLast(userId: string, at: number) {
  lastReport = { userId, at };
}

export function peekReportUnlockAt(userId: string | null | undefined, now = Date.now()): number | null {
  if (!userId || lastReport?.userId !== userId) return null;
  return reportUnlockAt(lastReport.at, now);
}

export async function fetchReportUnlockAt(now = Date.now()): Promise<number | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;
  if (!userId) return null;
  const { data, error } = await supabase
    .from('service_reports')
    .select('created_at')
    .eq('reporter_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    console.warn('workly report last', error.message);
    return peekReportUnlockAt(userId, now);
  }
  if (!data?.created_at) {
    if (lastReport?.userId === userId) lastReport = null;
    return null;
  }
  const lastAt = Date.parse(data.created_at);
  if (!Number.isFinite(lastAt)) return peekReportUnlockAt(userId, now);
  rememberLast(userId, lastAt);
  return reportUnlockAt(lastAt, now);
}

export async function submitServiceReport(
  target: ServiceReportTarget,
  message: string,
  reporterEmail?: string | null,
): Promise<ReportSubmitStatus> {
  const text = message.trim().slice(0, REPORT_MAX);
  if (!text) return 'failed';
  const supabase = getSupabase();
  if (!supabase) return 'failed';
  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user.id;
  if (!userId) return 'failed';
  if (peekReportUnlockAt(userId)) return 'cooldown';
  const { error } = await supabase.from('service_reports').insert({
    reporter_id: userId,
    reporter_email: reporterEmail?.trim() || data.session?.user.email || '',
    target_kind: target.kind,
    target_id: target.id,
    target_title: target.title.slice(0, 120),
    message: text,
  });
  if (error) {
    if (isReportCooldownError(error.message)) {
      await fetchReportUnlockAt();
      return 'cooldown';
    }
    console.warn('workly report', error.message);
    return 'failed';
  }
  rememberLast(userId, Date.now());
  return 'ok';
}
