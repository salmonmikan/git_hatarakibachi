import { useEffect, useMemo, useState } from 'react';
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
import { getTicketReservationMaxQuantity } from '@src/utils/ticketReservationRules.js';
import './TicketReservation.scss';

const initialForm = {
  customer_name: '',
  customer_email: '',
  quantity: '1',
  note: '',
};

function isWindowAvailable(windowItem) {
  return windowItem.capacity <= 0 || windowItem.remaining_quantity > 0;
}

function findSelectableWindowId(windowItems, preferredId = '') {
  const availableWindows = windowItems.filter((item) => !item.deleted_at && isWindowAvailable(item));
  const preferredWindow = availableWindows.find((item) => String(item.id) === String(preferredId));
  const nextWindow = preferredWindow ?? availableWindows[0];
  return nextWindow ? String(nextWindow.id) : '';
}

export default function TicketReservation({ onEntered }) {
  const { slug } = useParams();
  const reduce = useReducedMotion();
  const [event, setEvent] = useState(null);
  const [selectedWindowId, setSelectedWindowId] = useState('');
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [reservationCode, setReservationCode] = useState(null);

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      setError(null);
      const res = await fetchPublishedTicketEvent(slug);
      if (!alive) return;
      if (res.error) setError(res.error.message);
      setEvent(res.data);
      setSelectedWindowId(findSelectableWindowId(res.data?.windows ?? []));
      setLoading(false);
    }
    load();
    return () => {
      alive = false;
    };
  }, [slug]);

  const windows = useMemo(() => event?.windows?.filter((item) => !item.deleted_at) ?? [], [event]);
  const accepting = isTicketEventAccepting(event);
  const hasAvailableWindow = windows.some(isWindowAvailable);
  const selectedWindow = windows.find((item) => String(item.id) === String(selectedWindowId));
  const maxQuantity = getTicketReservationMaxQuantity(selectedWindow);
  const quantityNumber = Number(form.quantity);
  const hasValidQuantity = Number.isInteger(quantityNumber)
    && quantityNumber >= 1
    && quantityNumber <= maxQuantity;
  const canReserve = accepting && (!windows.length || (
    hasAvailableWindow && Boolean(selectedWindowId) && Boolean(selectedWindow) && isWindowAvailable(selectedWindow)
  ));

  useEffect(() => {
    if (maxQuantity < 1) return;
    setForm((prev) => {
      const currentQuantity = Number(prev.quantity);
      if (Number.isInteger(currentQuantity) && currentQuantity >= 1 && currentQuantity <= maxQuantity) {
        return prev;
      }
      return { ...prev, quantity: String(maxQuantity) };
    });
  }, [maxQuantity]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!event || !canReserve) return;
    if (!hasValidQuantity) {
      setError(`選択した予約枠の残数以内で、1〜${maxQuantity}枚を指定してください。`);
      return;
    }
    setSaving(true);
    setError(null);

    const payload = {
      event_id: event.id,
      window_id: selectedWindowId ? Number(selectedWindowId) : null,
      customer_name: form.customer_name.trim(),
      customer_email: form.customer_email.trim(),
      quantity: Number(form.quantity),
      note: form.note.trim() || null,
    };

    const res = await createTicketReservation(payload);
    if (res.error) {
      setError(res.error.message);
      setSaving(false);
      return;
    }

    setReservationCode(res.data.reservation_code);
    setForm(initialForm);
    const refreshed = await fetchPublishedTicketEvent(slug);
    if (refreshed.error) {
      setError(`予約は完了しましたが、残数の更新に失敗しました: ${refreshed.error.message}`);
    } else {
      setEvent(refreshed.data);
      setSelectedWindowId(findSelectableWindowId(refreshed.data?.windows ?? [], selectedWindowId));
    }
    setSaving(false);
  };

  if (loading) return <div className="ticket-page__message">読み込み中...</div>;
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
        {windows.length ? (
          <div className="ticket-window-list">
            {windows.map((windowItem) => (
              <label
                key={windowItem.id}
                className="ticket-window-card"
                data-sold-out={windowItem.capacity > 0 && windowItem.remaining_quantity <= 0 ? 'true' : undefined}
              >
                <input
                  type="radio"
                  name="window_id"
                  value={windowItem.id}
                  checked={selectedWindowId === String(windowItem.id)}
                  onChange={(e) => setSelectedWindowId(e.target.value)}
                  disabled={windowItem.capacity > 0 && windowItem.remaining_quantity <= 0}
                />
                <span>
                  <strong>{windowItem.label}</strong>
                  <small>
                    {formatTicketDate(windowItem.starts_at)} / 定員 {windowItem.capacity || '未設定'}
                    {windowItem.capacity > 0 && ` / 残り ${windowItem.remaining_quantity}`}
                  </small>
                </span>
                {windowItem.capacity > 0 && windowItem.remaining_quantity <= 0 && <em>満席</em>}
              </label>
            ))}
          </div>
        ) : (
          <p>自由席として予約を受け付けます。</p>
        )}
        {windows.length > 0 && !hasAvailableWindow && (
          <p className="ticket-page__notice">現在、予約可能な枠がありません。</p>
        )}
      </section>

      <section className="ticket-page__panel" aria-labelledby="ticket-form-title">
        <h2 id="ticket-form-title">予約フォーム</h2>
        {!accepting && <p className="ticket-page__notice">現在、この公演の予約受付期間外です。</p>}
        {reservationCode && (
          <div className="ticket-page__success" role="status">
            予約を受け付けました。予約番号：<strong>{reservationCode}</strong>
          </div>
        )}
        {error && <div className="ticket-page__error" role="alert">{error}</div>}
        <form className="ticket-form" onSubmit={onSubmit}>
          <label>
            お名前
            <input name="customer_name" value={form.customer_name} onChange={onChange} required disabled={saving || !canReserve} />
          </label>
          <label>
            メールアドレス
            <input type="email" name="customer_email" value={form.customer_email} onChange={onChange} required disabled={saving || !canReserve} />
          </label>
          <label>
            枚数
            <input type="number" name="quantity" min="1" max={maxQuantity} value={form.quantity} onChange={onChange} required disabled={saving || !canReserve} />
          </label>
          <label>
            備考
            <textarea name="note" value={form.note} onChange={onChange} rows="4" disabled={saving || !canReserve} />
          </label>
          <button type="submit" disabled={saving || !canReserve || !hasValidQuantity}>{saving ? '送信中...' : '予約する'}</button>
        </form>
      </section>
    </Motion.section>
  );
}
