import { useEffect, useMemo, useState } from 'react';
import supabase from '@src/utils/supabase.ts';
import { fromDatetimeLocal, toDatetimeLocal } from '@src/utils/datetimeLocal.js';
import { cancelTicketReservation, formatTicketDate, TICKET_STATUS_LABEL } from '@src/utils/tickets.js';
import './admin_view.scss';

const eventDefaults = {
  slug: '',
  title: '',
  description: '',
  venue: '',
  opens_at: '',
  closes_at: '',
  status: 'draft',
};

const RESERVATIONS_PAGE_SIZE = 200;

export default function AdminTickets() {
  const [events, setEvents] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState(eventDefaults);
  const [windowForm, setWindowForm] = useState({ label: '', starts_at: '', capacity: '0' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reservationPage, setReservationPage] = useState(0);
  const [reservationTotal, setReservationTotal] = useState(0);

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedId) ?? null,
    [events, selectedId]
  );

  const load = async (page = reservationPage) => {
    setLoading(true);
    setError(null);
    const reservationFrom = page * RESERVATIONS_PAGE_SIZE;
    const reservationTo = reservationFrom + RESERVATIONS_PAGE_SIZE - 1;
    const [eventRes, reservationRes] = await Promise.all([
      supabase
        .from('ticket_events')
        .select('*, windows:ticket_windows(*)')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .order('sort_order', { foreignTable: 'ticket_windows', ascending: true }),
      supabase
        .from('ticket_reservations')
        .select('*, event:ticket_events(title), window:ticket_windows(label)', { count: 'exact' })
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .range(reservationFrom, reservationTo),
    ]);

    if (eventRes.error || reservationRes.error) {
      setError(eventRes.error?.message ?? reservationRes.error?.message);
    } else {
      setEvents(eventRes.data ?? []);
      setReservations(reservationRes.data ?? []);
      setReservationPage(page);
      setReservationTotal(reservationRes.count ?? 0);
      if (!selectedId && eventRes.data?.[0]) setSelectedId(eventRes.data[0].id);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedEvent) {
      setForm(eventDefaults);
      return;
    }
    setForm({
      slug: selectedEvent.slug ?? '',
      title: selectedEvent.title ?? '',
      description: selectedEvent.description ?? '',
      venue: selectedEvent.venue ?? '',
      opens_at: toDatetimeLocal(selectedEvent.opens_at),
      closes_at: toDatetimeLocal(selectedEvent.closes_at),
      status: selectedEvent.status ?? 'draft',
    });
  }, [selectedEvent]);

  const onFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSaveEvent = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      opens_at: fromDatetimeLocal(form.opens_at, selectedEvent?.opens_at),
      closes_at: fromDatetimeLocal(form.closes_at, selectedEvent?.closes_at),
    };
    const res = selectedEvent
      ? await supabase.from('ticket_events').update(payload).eq('id', selectedEvent.id).select('id').single()
      : await supabase.from('ticket_events').insert(payload).select('id').single();

    if (res.error) setError(res.error.message);
    else {
      setSelectedId(res.data.id);
      await load(reservationPage);
    }
  };

  const onAddWindow = async (e) => {
    e.preventDefault();
    if (!selectedEvent) return;
    const res = await supabase.from('ticket_windows').insert({
      event_id: selectedEvent.id,
      label: windowForm.label,
      starts_at: fromDatetimeLocal(windowForm.starts_at),
      capacity: Number(windowForm.capacity),
      sort_order: selectedEvent.windows?.length ?? 0,
    });
    if (res.error) setError(res.error.message);
    else {
      setWindowForm({ label: '', starts_at: '', capacity: '0' });
      await load(reservationPage);
    }
  };

  const onCancelReservation = async (id) => {
    const res = await cancelTicketReservation(id);
    if (res.error) setError(res.error.message);
    else await load(reservationPage);
  };

  if (loading) return <div className="admin-view">Loading...</div>;

  return (
    <div className="admin-view">
      <h1 className="admin-view__title">Manage Tickets</h1>
      {error && <div className="adm-alert" data-tone="danger">{error}</div>}

      <div className="admin-ticket-grid">
        <section className="admin-ticket-panel">
          <h2>販売ページ</h2>
          <button type="button" className="admin-view__button" onClick={() => setSelectedId(null)}>新規作成</button>
          <div className="admin-view__list">
            {events.map((event) => (
              <button key={event.id} type="button" className="admin-view__link" onClick={() => setSelectedId(event.id)}>
                <div className="admin-view__name">{event.title}</div>
                <small>/{`tickets/${event.slug}`} / {TICKET_STATUS_LABEL[event.status] ?? event.status}</small>
              </button>
            ))}
          </div>
        </section>

        <section className="admin-ticket-panel">
          <h2>{selectedEvent ? '販売ページ編集' : '販売ページ追加'}</h2>
          <form className="admin-ticket-form" onSubmit={onSaveEvent}>
            <label>URL slug<input name="slug" value={form.slug} onChange={onFormChange} pattern="[A-Za-z0-9_-]+" title="英数字、ハイフン、アンダースコアのみ使用できます" required /></label>
            <label>タイトル<input name="title" value={form.title} onChange={onFormChange} required /></label>
            <label>説明<textarea name="description" value={form.description} onChange={onFormChange} rows="3" /></label>
            <label>会場<input name="venue" value={form.venue} onChange={onFormChange} /></label>
            <label>受付開始<input type="datetime-local" name="opens_at" value={form.opens_at} onChange={onFormChange} /></label>
            <label>受付終了<input type="datetime-local" name="closes_at" value={form.closes_at} onChange={onFormChange} /></label>
            <label>状態<select name="status" value={form.status} onChange={onFormChange}><option value="draft">下書き</option><option value="published">公開中</option><option value="closed">受付終了</option></select></label>
            <button className="admin-view__button" type="submit">保存</button>
          </form>

          {selectedEvent && (
            <form className="admin-ticket-form" onSubmit={onAddWindow}>
              <h3>予約枠追加</h3>
              <label>枠名<input value={windowForm.label} onChange={(e) => setWindowForm((prev) => ({ ...prev, label: e.target.value }))} required /></label>
              <label>日時<input type="datetime-local" value={windowForm.starts_at} onChange={(e) => setWindowForm((prev) => ({ ...prev, starts_at: e.target.value }))} /></label>
              <label>定員<input type="number" min="0" value={windowForm.capacity} onChange={(e) => setWindowForm((prev) => ({ ...prev, capacity: e.target.value }))} /></label>
              <button className="admin-view__button" type="submit">予約枠を追加</button>
              <ul>
                {(selectedEvent.windows ?? []).filter((item) => !item.deleted_at).map((item) => (
                  <li key={item.id}>{item.label} / {formatTicketDate(item.starts_at)} / 定員 {item.capacity}</li>
                ))}
              </ul>
            </form>
          )}
        </section>
      </div>

      <section className="admin-ticket-panel">
        <h2>予約一覧</h2>
        <div className="admin-view__list">
          {reservations.map((reservation) => (
            <article key={reservation.id} className="admin-view__link">
              <div className="admin-view__name">{reservation.customer_name} / {reservation.quantity}枚 / {TICKET_STATUS_LABEL[reservation.status]}</div>
              <small>{reservation.event?.title} - {reservation.window?.label ?? '自由席'} / {reservation.customer_email} / {reservation.reservation_code}</small>
              {reservation.status !== 'cancelled' && <button type="button" className="admin-view__button" onClick={() => onCancelReservation(reservation.id)}>キャンセル</button>}
            </article>
          ))}
        </div>
        {reservationTotal > RESERVATIONS_PAGE_SIZE && (
          <div className="admin-ticket-pagination" aria-label="予約一覧ページング">
            <button
              type="button"
              className="admin-view__button"
              disabled={reservationPage === 0}
              onClick={() => load(reservationPage - 1)}
            >
              前の200件
            </button>
            <span>
              {reservationPage + 1} / {Math.ceil(reservationTotal / RESERVATIONS_PAGE_SIZE)}ページ
            </span>
            <button
              type="button"
              className="admin-view__button"
              disabled={(reservationPage + 1) * RESERVATIONS_PAGE_SIZE >= reservationTotal}
              onClick={() => load(reservationPage + 1)}
            >
              次の200件
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
