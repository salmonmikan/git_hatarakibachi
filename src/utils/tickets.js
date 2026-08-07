import supabase from '@src/utils/supabase.ts';

export const TICKET_STATUS_LABEL = {
  draft: '下書き',
  published: '公開中',
  closed: '受付終了',
  reserved: '予約済み',
  cancelled: 'キャンセル',
};

export async function fetchPublishedTicketEvent(slug) {
  const eventRes = await supabase
    .from('ticket_events')
    .select('*, windows:ticket_windows(*)')
    .eq('slug', slug)
    .eq('status', 'published')
    .is('deleted_at', null)
    .is('windows.deleted_at', null)
    .order('sort_order', { foreignTable: 'ticket_windows', ascending: true })
    .maybeSingle();

  if (eventRes.error || !eventRes.data) {
    return { data: eventRes.data, error: eventRes.error };
  }

  const [availabilityRes, windowHistoryRes] = await Promise.all([
    supabase.rpc('get_ticket_window_availability', {
      p_event_id: eventRes.data.id,
    }),
    supabase.rpc('get_ticket_event_window_history', {
      p_event_id: eventRes.data.id,
    }),
  ]);
  if (availabilityRes.error) return { data: null, error: availabilityRes.error };
  if (windowHistoryRes.error) return { data: null, error: windowHistoryRes.error };

  const availabilityByWindowId = new Map(
    (availabilityRes.data ?? []).map((item) => [String(item.window_id), item])
  );
  return {
    data: {
      ...eventRes.data,
      has_window_history: windowHistoryRes.data === true,
      windows: (eventRes.data.windows ?? []).map((windowItem) => ({
        ...windowItem,
        ...(availabilityByWindowId.get(String(windowItem.id)) ?? {}),
      })),
    },
    error: null,
  };
}

export async function createTicketReservation(payload) {
  const res = await supabase
    .rpc('create_ticket_reservation', {
      p_event_id: payload.event_id,
      p_window_id: payload.window_id,
      p_customer_name: payload.customer_name,
      p_customer_email: payload.customer_email,
      p_quantity: payload.quantity,
      p_note: payload.note,
      p_request_id: payload.request_id,
    })
    .single();

  if (res.error) return { data: null, error: res.error };
  return { data: res.data, error: null };
}

export async function cancelTicketReservation(reservationId) {
  const res = await supabase.rpc('cancel_ticket_reservation', {
    p_reservation_id: reservationId,
  });

  if (res.error) return { error: res.error };
  return { error: null };
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
