import supabase from '@src/utils/supabase.ts';

export const TICKET_STATUS_LABEL = {
  draft: '下書き',
  published: '公開中',
  closed: '受付終了',
  reserved: '予約済み',
  cancelled: 'キャンセル',
};

export async function fetchPublishedTicketEvent(slug) {
  const res = await supabase
    .from('ticket_events')
    .select('*, windows:ticket_windows(*)')
    .eq('slug', slug)
    .eq('status', 'published')
    .is('deleted_at', null)
    .is('windows.deleted_at', null)
    .order('sort_order', { foreignTable: 'ticket_windows', ascending: true })
    .maybeSingle();

  if (res.error) return { data: null, error: res.error };
  return { data: res.data, error: null };
}

export async function createTicketReservation(payload) {
  const res = await supabase
    .from('ticket_reservations')
    .insert(payload)
    .select('reservation_code')
    .single();

  if (res.error) return { data: null, error: res.error };
  return { data: res.data, error: null };
}

export function isTicketEventAccepting(event) {
  if (!event || event.status !== 'published') return false;
  const now = Date.now();
  const opensAt = event.opens_at ? new Date(event.opens_at).getTime() : null;
  const closesAt = event.closes_at ? new Date(event.closes_at).getTime() : null;
  if (Number.isFinite(opensAt) && now < opensAt) return false;
  if (Number.isFinite(closesAt) && now > closesAt) return false;
  return true;
}

export function formatTicketDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}
