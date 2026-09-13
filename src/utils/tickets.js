import supabase from '@src/utils/supabase.ts';
import {
  requestTicketReservationChallenge,
  resetTicketReservationChallenge,
} from '@src/utils/turnstile.js';

export const TICKET_STATUS_LABEL = {
  draft: '下書き',
  published: '公開中',
  closed: '受付終了',
  reserved: '予約済み',
  cancelled: 'キャンセル',
};

export async function fetchPublishedTicketEvent(slug) {
  const res = await supabase.rpc('get_public_ticket_event', {
    p_slug: slug,
  });

  if (res.error) return { data: null, error: res.error };
  return { data: res.data ?? null, error: null };
}

export async function createTicketReservation(payload) {
  let challengeToken;
  try {
    challengeToken = await requestTicketReservationChallenge();
  } catch (error) {
    await resetTicketReservationChallenge();
    return {
      data: null,
      error: {
        message: error instanceof Error ? error.message : 'セキュリティ確認に失敗しました。',
        code: typeof error?.code === 'string' ? error.code : 'TURNSTILE_FAILED',
      },
    };
  }

  try {
    const response = await fetch('/api/tickets/reservations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        ...payload,
        turnstile_token: challengeToken,
      }),
    });

    let body = null;
    try {
      body = await response.json();
    } catch {
      body = null;
    }

    if (!response.ok) {
      const serverCode = typeof body?.code === 'string' ? body.code.trim() : '';
      const definitiveCode = serverCode
        || (response.status >= 400 && response.status < 500 ? `HTTP_${response.status}` : '');
      const fallbackMessage = response.status === 429
        ? '短時間に予約操作が集中しています。少し時間を置いてから再度お試しください。'
        : '予約を受け付けられませんでした。';
      return {
        data: null,
        error: {
          message: body?.error || fallbackMessage,
          code: definitiveCode,
        },
      };
    }

    if (!body?.reservation_code) {
      return {
        data: null,
        error: {
          message: '予約結果を確認できませんでした。再確認してください。',
          code: '',
        },
      };
    }

    return { data: body, error: null };
  } catch {
    return {
      data: null,
      error: {
        message: '予約結果を確認できませんでした。通信状態を確認して再度お試しください。',
        code: '',
      },
    };
  } finally {
    await resetTicketReservationChallenge();
  }
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
