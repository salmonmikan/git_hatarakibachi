import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useReducedMotion } from 'motion/react';
import { motion as Motion } from 'framer-motion';
import { pageVariants, pageTransition } from '@src/assets/_pageVariants.js';
import {
  createTicketReservation,
  fetchPublishedTicketEvent,
  formatTicketDate,
  isTicketEventAccepting,
} from '@src/utils/tickets.js';
import {
  getNextTicketEventBoundary,
  getTicketReservationMaxQuantity,
} from '@src/utils/ticketReservationRules.js';
import './TicketReservation.scss';

const initialForm = {
  customer_name: '',
  customer_email: '',
  quantity: '1',
  note: '',
};

function isWindowStarted(windowItem, now = Date.now()) {
  if (!windowItem.starts_at) return false;
  const startsAt = new Date(windowItem.starts_at).getTime();
  return Number.isFinite(startsAt) && startsAt <= now;
}

function hasWindowCapacity(windowItem) {
  return windowItem.capacity <= 0 || windowItem.remaining_quantity > 0;
}

function isWindowAvailableByClientClock(windowItem) {
  return !isWindowStarted(windowItem) && hasWindowCapacity(windowItem);
}

function findSelectableWindowId(windowItems, preferredId = '') {
  const capacityAvailableWindows = windowItems.filter((item) => !item.deleted_at && hasWindowCapacity(item));
  const preferredWindow = capacityAvailableWindows.find((item) => String(item.id) === String(preferredId));
  const nextByClientClock = capacityAvailableWindows.find((item) => !isWindowStarted(item));
  const nextWindow = preferredWindow ?? nextByClientClock ?? capacityAvailableWindows[0];
  return nextWindow ? String(nextWindow.id) : '';
}

function isDefinitiveReservationFailure(error) {
  return typeof error?.code === 'string' && error.code.trim() !== '';
}

function formFromPendingReservation(pendingReservation) {
  const payload = pendingReservation?.payload;
  if (!payload) return initialForm;
  return {
    customer_name: payload.customer_name ?? '',
    customer_email: payload.customer_email ?? '',
    quantity: String(payload.quantity ?? 1),
    note: payload.note ?? '',
  };
}

export default function TicketReservation({
  onEntered,
  pendingReservation,
  onPendingReservationChange,
}) {
  const { slug } = useParams();
  const reduce = useReducedMotion();
  const initialPendingReservationRef = useRef(
    pendingReservation?.slug === slug ? pendingReservation : null
  );
  const [event, setEvent] = useState(null);
  const [selectedWindowId, setSelectedWindowId] = useState('');
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [error, setError] = useState(null);
  const [reservationCode, setReservationCode] = useState(null);
  const [reservationRequestId, setReservationRequestId] = useState(null);
  const [availabilityStale, setAvailabilityStale] = useState(false);
  const [clockTick, setClockTick] = useState(0);

  const matchingPendingReservation = pendingReservation?.slug === slug ? pendingReservation : null;
  const hasOtherPendingReservation = Boolean(pendingReservation && pendingReservation.slug !== slug);

  useEffect(() => {
    const restoredPending = initialPendingReservationRef.current;
    setEvent(null);
    setSelectedWindowId(restoredPending?.payload?.window_id != null
      ? String(restoredPending.payload.window_id)
      : '');
    setForm(formFromPendingReservation(restoredPending));
    setSaving(false);
    setLoadError(null);
    setError(null);
    setReservationCode(null);
    setReservationRequestId(restoredPending?.payload?.request_id ?? null);
    setAvailabilityStale(false);
    setClockTick(0);
    let alive = true;
    async function load() {
      setLoading(true);
      setLoadError(null);
      setError(null);
      const res = await fetchPublishedTicketEvent(slug);
      if (!alive) return;
      if (res.error) {
        setLoadError(res.error.message);
        setEvent(null);
        if (!restoredPending) setSelectedWindowId('');
      } else {
        setEvent(res.data);
        if (restoredPending) {
          setSelectedWindowId(restoredPending.payload.window_id != null
            ? String(restoredPending.payload.window_id)
            : '');
          setForm(formFromPendingReservation(restoredPending));
          setReservationRequestId(restoredPending.payload.request_id);
        } else {
          setSelectedWindowId(findSelectableWindowId(res.data?.windows ?? []));
        }
        setAvailabilityStale(false);
      }
      setLoading(false);
    }
    load();
    return () => {
      alive = false;
    };
  }, [slug]);

  useEffect(() => {
    const nextWindowStart = (event?.windows ?? [])
      .map((windowItem) => windowItem.starts_at ? new Date(windowItem.starts_at).getTime() : null)
      .filter((value) => Number.isFinite(value) && value > Date.now())
      .sort((left, right) => left - right)[0];
    if (!nextWindowStart) return undefined;
    const delay = Math.min(Math.max(nextWindowStart - Date.now() + 50, 0), 2147483647);
    const timer = setTimeout(() => setClockTick((tick) => tick + 1), delay);
    return () => clearTimeout(timer);
  }, [event, clockTick]);

  useEffect(() => {
    const nextBoundary = getNextTicketEventBoundary(event);
    if (nextBoundary === null) return undefined;
    const delay = Math.min(Math.max(nextBoundary - Date.now() + 50, 0), 2147483647);
    const timer = setTimeout(() => setClockTick((tick) => tick + 1), delay);
    return () => clearTimeout(timer);
  }, [event, clockTick]);

  const windows = event?.windows?.filter((item) => !item.deleted_at) ?? [];
  const acceptingByClientClock = isTicketEventAccepting(event);
  const eventIsPublished = event?.status === 'published';
  const isWindowedEvent = windows.length > 0 || Boolean(event?.has_window_history);
  const hasAvailableWindowByClientClock = windows.some(isWindowAvailableByClientClock);
  const hasWindowWithCapacity = windows.some(hasWindowCapacity);
  const selectedWindow = windows.find((item) => String(item.id) === String(selectedWindowId));
  const maxQuantity = getTicketReservationMaxQuantity(selectedWindow);
  const quantityNumber = Number(form.quantity);
  const hasValidQuantity = Number.isInteger(quantityNumber)
    && quantityNumber >= 1
    && quantityNumber <= maxQuantity;
  const canAttemptReservation = !hasOtherPendingReservation
    && !availabilityStale
    && eventIsPublished
    && (!isWindowedEvent || (
      hasWindowWithCapacity && Boolean(selectedWindowId) && Boolean(selectedWindow) && hasWindowCapacity(selectedWindow)
    ));
  const retryLocked = Boolean(reservationRequestId);
  const canRetryReservation = retryLocked;
  const canSubmitReservation = canAttemptReservation || canRetryReservation;

  useEffect(() => {
    if (maxQuantity < 1 || retryLocked) return;
    setForm((prev) => {
      const currentQuantity = Number(prev.quantity);
      if (Number.isInteger(currentQuantity) && currentQuantity >= 1 && currentQuantity <= maxQuantity) {
        return prev;
      }
      return { ...prev, quantity: String(maxQuantity) };
    });
  }, [maxQuantity, retryLocked]);

  const onChange = (e) => {
    if (reservationRequestId) return;
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setReservationCode(null);
    setError(null);
  };

  const refreshAvailability = async () => {
    if (saving || reservationRequestId) return;
    setLoading(true);
    setError(null);
    const refreshed = await fetchPublishedTicketEvent(slug);
    if (refreshed.error || !refreshed.data) {
      setAvailabilityStale(true);
      setError(refreshed.error?.message ?? '予約ページの最新状態を取得できませんでした。');
    } else {
      setEvent(refreshed.data);
      setSelectedWindowId(findSelectableWindowId(refreshed.data.windows ?? [], selectedWindowId));
      setAvailabilityStale(false);
    }
    setLoading(false);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!event || !canSubmitReservation) return;
    const retryingRequest = Boolean(reservationRequestId);
    if (!retryingRequest && !hasValidQuantity) {
      setError(`選択した予約枠の残数以内で、1〜${maxQuantity}枚を指定してください。`);
      return;
    }
    const requestId = reservationRequestId ?? globalThis.crypto?.randomUUID?.();
    if (!requestId) {
      setError('予約処理に必要なリクエストIDを生成できませんでした。');
      return;
    }

    const payload = retryingRequest
      && matchingPendingReservation?.payload?.request_id === requestId
      ? matchingPendingReservation.payload
      : {
          event_id: event.id,
          window_id: selectedWindowId ? Number(selectedWindowId) : null,
          customer_name: form.customer_name.trim(),
          customer_email: form.customer_email.trim(),
          quantity: Number(form.quantity),
          note: form.note.trim() || null,
          request_id: requestId,
        };

    setSaving(true);
    setError(null);
    if (!retryingRequest) setReservationCode(null);
    setReservationRequestId(requestId);
    if (typeof onPendingReservationChange === 'function') {
      onPendingReservationChange({ slug, payload });
    }

    const res = await createTicketReservation(payload);
    if (res.error) {
      setError(res.error.message);
      if (isDefinitiveReservationFailure(res.error)) {
        setReservationRequestId(null);
        if (typeof onPendingReservationChange === 'function') {
          onPendingReservationChange(null);
        }
        const refreshed = await fetchPublishedTicketEvent(slug);
        if (refreshed.error || !refreshed.data) {
          setAvailabilityStale(true);
          setError(`${res.error.message} 最新の空席状況を取得できませんでした。空席状況を更新してください。`);
        } else {
          setEvent(refreshed.data);
          setSelectedWindowId(findSelectableWindowId(refreshed.data.windows ?? [], selectedWindowId));
          setAvailabilityStale(false);
        }
      }
      setSaving(false);
      return;
    }

    setReservationCode(res.data.reservation_code);
    setReservationRequestId(null);
    if (typeof onPendingReservationChange === 'function') {
      onPendingReservationChange(null);
    }
    setForm(initialForm);
    const refreshed = await fetchPublishedTicketEvent(slug);
    if (refreshed.error || !refreshed.data) {
      const refreshMessage = refreshed.error?.message ?? '公開中の予約情報を再取得できませんでした。';
      setAvailabilityStale(true);
      setError(`予約は完了しましたが、残数の更新に失敗しました: ${refreshMessage}`);
    } else {
      setEvent(refreshed.data);
      setSelectedWindowId(findSelectableWindowId(refreshed.data.windows ?? [], selectedWindowId));
      setAvailabilityStale(false);
    }
    setSaving(false);
  };

  if (loading) return <div className="ticket-page__message">読み込み中...</div>;
  if (loadError) return <div className="ticket-page__message" role="alert">予約ページの読み込みに失敗しました：{loadError}</div>;
  if (!event) return <div className="ticket-page__message">予約ページが見つかりませんでした。</div>;

  return (
    <Motion.section
      className="page ticket-page"
      initial={reduce ? false : 'initial'}
      animate="enter"
      exit="exit"
      variants={pageVariants}
      transition={reduce ? { duration: 0 } : pageTransition}
      onAnimationComplete={() => {
        if (typeof onEntered === 'function') onEntered();
      }}
    >
      <Link to="/stage" className="ticket-page__back">← Stageへ戻る</Link>
      <header className="ticket-page__header">
        <p className="ticket-page__eyebrow">Ticket Reservation</p>
        <h1>{event.title}</h1>
        {event.venue && <p className="ticket-page__venue">会場：{event.venue}</p>}
        {event.description && <p className="ticket-page__description">{event.description}</p>}
      </header>

      <section className="ticket-page__panel" aria-labelledby="ticket-window-title">
        <h2 id="ticket-window-title">予約枠</h2>
        <button type="button" onClick={refreshAvailability} disabled={saving || retryLocked}>空席状況を更新</button>
        {availabilityStale && (
          <p className="ticket-page__notice">空席状況を確認できていません。更新が完了するまで新しい予約はできません。</p>
        )}
        {hasOtherPendingReservation && (
          <p className="ticket-page__notice">
            別の予約結果を確認中です。先にその予約を確認してください。{' '}
            <Link to={`/tickets/${encodeURIComponent(pendingReservation.slug)}`}>確認中の予約ページへ戻る</Link>
          </p>
        )}
        {windows.length ? (
          <div className="ticket-window-list">
            {windows.map((windowItem) => (
              <label
                key={windowItem.id}
                className="ticket-window-card"
                data-sold-out={windowItem.capacity > 0 && windowItem.remaining_quantity <= 0 ? 'true' : undefined}
                data-started={isWindowStarted(windowItem) ? 'true' : undefined}
              >
                <input
                  type="radio"
                  name="window_id"
                  value={windowItem.id}
                  checked={selectedWindowId === String(windowItem.id)}
                  onChange={(e) => {
                    if (reservationRequestId) return;
                    setSelectedWindowId(e.target.value);
                    setReservationCode(null);
                    setError(null);
                  }}
                  disabled={saving || retryLocked || hasOtherPendingReservation || availabilityStale || !eventIsPublished || !hasWindowCapacity(windowItem)}
                />
                <span>
                  <strong>{windowItem.label}</strong>
                  <small>
                    {formatTicketDate(windowItem.starts_at)} / 定員 {windowItem.capacity || '未設定'}
                    {windowItem.capacity > 0 && ` / 残り ${windowItem.remaining_quantity}`}
                  </small>
                </span>
                {isWindowStarted(windowItem)
                  ? <em>開始時刻経過</em>
                  : windowItem.capacity > 0 && windowItem.remaining_quantity <= 0 && <em>満席</em>}
              </label>
            ))}
          </div>
        ) : event.has_window_history ? (
          <p>現在、予約可能な枠がありません。</p>
        ) : event.status === 'closed' ? (
          <p>予約受付は終了しました。</p>
        ) : (
          <p>自由席として予約を受け付けます。</p>
        )}
        {windows.length > 0 && !hasAvailableWindowByClientClock && (
          <p className="ticket-page__notice">端末時刻上は予約可能な枠がありません。最終的な受付可否は送信時に確認します。</p>
        )}
      </section>

      <section className="ticket-page__panel" aria-labelledby="ticket-form-title">
        <h2 id="ticket-form-title">予約フォーム</h2>
        {!acceptingByClientClock && eventIsPublished && <p className="ticket-page__notice">端末時刻上は予約受付期間外です。最終的な受付可否は送信時に確認します。</p>}
        {reservationCode && (
          <div className="ticket-page__success" role="status">
            予約を受け付けました。予約番号：<strong>{reservationCode}</strong>
          </div>
        )}
        {error && <div className="ticket-page__error" role="alert">{error}</div>}
        <form className="ticket-form" onSubmit={onSubmit}>
          <label>
            お名前
            <input name="customer_name" value={form.customer_name} onChange={onChange} maxLength="200" required disabled={saving || retryLocked || !canAttemptReservation} />
          </label>
          <label>
            メールアドレス
            <input type="email" name="customer_email" value={form.customer_email} onChange={onChange} maxLength="320" required disabled={saving || retryLocked || !canAttemptReservation} />
          </label>
          <label>
            枚数
            <input type="number" name="quantity" min="1" max={maxQuantity} value={form.quantity} onChange={onChange} required disabled={saving || retryLocked || !canAttemptReservation} />
          </label>
          <label>
            備考
            <textarea name="note" value={form.note} onChange={onChange} maxLength="2000" rows="4" disabled={saving || retryLocked || !canAttemptReservation} />
          </label>
          <button type="submit" disabled={saving || !canSubmitReservation || (!retryLocked && !hasValidQuantity)}>{saving ? '送信中...' : retryLocked ? '予約結果を再確認' : '予約する'}</button>
        </form>
      </section>
    </Motion.section>
  );
}