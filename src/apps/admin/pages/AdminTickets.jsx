import { useEffect, useMemo, useState } from 'react';
import supabase from '@src/utils/supabase.ts';
import { fromDatetimeLocal, toDatetimeLocal } from '@src/utils/datetimeLocal.js';
import { cancelTicketReservation, formatTicketDate, TICKET_STATUS_LABEL } from '@src/utils/tickets.js';
import {
  getSanityPerformancePublicUrl,
  getSanityStudioWorkspaceUrl,
  getTicketPerformanceOptions,
} from '@src/utils/sanityFetch.js';
import './admin_view.scss';

const eventDefaults = {
  slug: '',
  title: '',
  description: '',
  venue: '',
  opens_at: '',
  closes_at: '',
  sanity_performance_id: '',
  status: 'draft',
};

const RESERVATIONS_PAGE_SIZE = 200;

export default function AdminTickets() {
  const [events, setEvents] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState(eventDefaults);
  const [windowForm, setWindowForm] = useState({ label: '', starts_at: '', capacity: '0' });
  const [windowForms, setWindowForms] = useState({});
  const [sanityPerformances, setSanityPerformances] = useState([]);
  const [sanityPerformanceLoadError, setSanityPerformanceLoadError] = useState(false);
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
    const [eventRes, reservationRes, reservationTotalsRes] = await Promise.all([
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
      supabase.rpc('get_ticket_window_reservation_totals'),
    ]);
    const sanityPerformanceRes = await getTicketPerformanceOptions();

    if (eventRes.error || reservationRes.error || reservationTotalsRes.error) {
      setError(eventRes.error?.message ?? reservationRes.error?.message ?? reservationTotalsRes.error?.message);
    } else {
      const reservedByWindowId = new Map();
      (reservationTotalsRes.data ?? []).forEach((item) => {
        const windowId = String(item.window_id);
        reservedByWindowId.set(windowId, Number(item.reserved_quantity ?? 0));
      });
      const eventsWithAvailability = (eventRes.data ?? []).map((event) => ({
        ...event,
        windows: (event.windows ?? []).map((windowItem) => {
          const reservedQuantity = reservedByWindowId.get(String(windowItem.id)) ?? 0;
          return {
            ...windowItem,
            reserved_quantity: reservedQuantity,
            remaining_quantity: windowItem.capacity > 0
              ? Math.max(Number(windowItem.capacity) - reservedQuantity, 0)
              : null,
          };
        }),
      }));
      setEvents(eventsWithAvailability);
      setReservations(reservationRes.data ?? []);
      setSanityPerformances(Array.isArray(sanityPerformanceRes) ? sanityPerformanceRes : []);
      setSanityPerformanceLoadError(sanityPerformanceRes === null);
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
      setWindowForms({});
      return;
    }
    setForm({
      slug: selectedEvent.slug ?? '',
      title: selectedEvent.title ?? '',
      description: selectedEvent.description ?? '',
      venue: selectedEvent.venue ?? '',
      opens_at: toDatetimeLocal(selectedEvent.opens_at),
      closes_at: toDatetimeLocal(selectedEvent.closes_at),
      sanity_performance_id: selectedEvent.sanity_performance_id ?? '',
      status: selectedEvent.status ?? 'draft',
    });
    setWindowForms(Object.fromEntries(
      (selectedEvent.windows ?? []).map((item) => [item.id, {
        label: item.label ?? '',
        starts_at: toDatetimeLocal(item.starts_at),
        capacity: String(item.capacity ?? 0),
      }])
    ));
  }, [selectedEvent]);

  const onFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSaveEvent = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      sanity_performance_id: form.sanity_performance_id.trim() || null,
      opens_at: fromDatetimeLocal(form.opens_at, selectedEvent?.opens_at),
      closes_at: fromDatetimeLocal(form.closes_at, selectedEvent?.closes_at),
    };
    if (payload.opens_at && payload.closes_at && new Date(payload.closes_at) < new Date(payload.opens_at)) {
      setError('受付終了日時は受付開始日時以降に設定してください。');
      return;
    }
    if (form.status === 'published' && !payload.sanity_performance_id) {
      setError('公開する販売ページにはSanity公演情報を連携してください。');
      return;
    }
    const res = selectedEvent
      ? await supabase.from('ticket_events').update(payload).eq('id', selectedEvent.id).select('id').single()
      : await supabase.from('ticket_events').insert(payload).select('id').single();

    if (res.error) setError(res.error.message);
    else {
      await load(reservationPage);
      setSelectedId(res.data.id);
    }
  };

  const onAddWindow = async (e) => {
    e.preventDefault();
    if (!selectedEvent) return;
    const label = windowForm.label.trim();
    if (!label) {
      setError('枠名を入力してください。');
      return;
    }
    const capacity = Number(windowForm.capacity);
    if (!Number.isInteger(capacity) || capacity < 0) {
      setError('定員は0以上の整数で入力してください。');
      return;
    }
    const res = await supabase.from('ticket_windows').insert({
      event_id: selectedEvent.id,
      label,
      starts_at: fromDatetimeLocal(windowForm.starts_at),
      capacity,
      sort_order: selectedEvent.windows?.length ?? 0,
    });
    if (res.error) setError(res.error.message);
    else {
      setWindowForm({ label: '', starts_at: '', capacity: '0' });
      await load(reservationPage);
    }
  };

  const onWindowFormChange = (windowId, field, value) => {
    setWindowForms((prev) => ({
      ...prev,
      [windowId]: { ...prev[windowId], [field]: value },
    }));
  };

  const onSaveWindow = async (e, windowId) => {
    e.preventDefault();
    const values = windowForms[windowId];
    const currentWindow = selectedEvent?.windows?.find((item) => item.id === windowId);
    if (!values || !currentWindow) return;
    const label = values.label.trim();
    if (!label) {
      setError('枠名を入力してください。');
      return;
    }
    const capacity = Number(values.capacity);
    const reservedQuantity = Number(currentWindow.reserved_quantity ?? 0);
    if (!Number.isInteger(capacity) || capacity < 0) {
      setError('定員は0以上の整数で入力してください。');
      return;
    }
    if (capacity > 0 && reservedQuantity > capacity) {
      setError('既存予約数を下回る定員には変更できません。');
      return;
    }
    const res = await supabase
      .from('ticket_windows')
      .update({
        label,
        starts_at: fromDatetimeLocal(values.starts_at, currentWindow.starts_at),
        capacity,
      })
      .eq('id', windowId)
      .eq('event_id', selectedEvent.id)
      .is('deleted_at', null)
      .select('id')
      .single();
    if (res.error) setError(res.error.message);
    else await load(reservationPage);
  };

  const onDeleteWindow = async (windowId) => {
    const currentWindow = selectedEvent?.windows?.find((item) => item.id === windowId);
    if (!currentWindow) return;
    const reservedQuantity = Number(currentWindow.reserved_quantity ?? 0);
    const warning = reservedQuantity > 0
      ? `この予約枠には${reservedQuantity}枚の既存予約があります。枠を販売停止し、予約履歴を保持します。続行しますか？`
      : 'この予約枠を販売停止して削除します。続行しますか？';
    if (typeof window !== 'undefined' && !window.confirm(warning)) return;
    const res = await supabase.rpc('delete_ticket_window', { p_window_id: windowId });
    if (res.error) setError(res.error.message);
    else await load(reservationPage);
  };

  const onCancelReservation = async (reservation) => {
    const warning = `予約番号 ${reservation.reservation_code} をキャンセルします。この操作は元に戻せません。続行しますか？`;
    if (typeof window !== 'undefined' && !window.confirm(warning)) return;
    const res = await cancelTicketReservation(reservation.id);
    if (res.error) setError(res.error.message);
    else await load(reservationPage);
  };

  const linkedSanityPerformance = sanityPerformances.find(
    (performance) => performance._id === form.sanity_performance_id
  );

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
                <small>
                  /{`tickets/${event.slug}`} / {TICKET_STATUS_LABEL[event.status] ?? event.status} /{' '}
                  {event.sanity_performance_id ? 'Sanity連携済み' : 'Sanity未連携'}
                </small>
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
            <label>
              Sanity公演情報
              {sanityPerformanceLoadError && <small className="admin-ticket-sanity-warning">Sanity公演情報を取得できません。連携先を確認してから公開してください。</small>}
              <select name="sanity_performance_id" value={form.sanity_performance_id} onChange={onFormChange} required={form.status === 'published'}>
                <option value="">未連携（下書きのみ）</option>
                {sanityPerformances.map((performance) => (
                  <option key={performance._id} value={performance._id}>
                    {performance.title} {performance.slug ? `(/${performance.slug})` : ''}
                  </option>
                ))}
              </select>
            </label>
            <label>状態<select name="status" value={form.status} onChange={onFormChange}><option value="draft">下書き</option><option value="published">公開中</option><option value="closed">受付終了</option></select></label>
            <button className="admin-view__button" type="submit">保存</button>
          </form>

          {linkedSanityPerformance ? (
            <div className="admin-ticket-sanity">
              <strong>連携中のSanity公演</strong>
              <span>{linkedSanityPerformance.title} / {linkedSanityPerformance.performanceDate || '日時未設定'} / {linkedSanityPerformance.venue || '会場未設定'}</span>
              <div>
                {getSanityPerformancePublicUrl(linkedSanityPerformance.slug) && (
                  <a href={getSanityPerformancePublicUrl(linkedSanityPerformance.slug)} target="_blank" rel="noreferrer">公演ページを表示</a>
                )}
                <a href={getSanityStudioWorkspaceUrl()} target="_blank" rel="noreferrer">Sanity Studioで編集</a>
              </div>
            </div>
          ) : form.sanity_performance_id ? (
            <p className="admin-ticket-sanity-warning">連携先のSanity公演が一覧に見つかりません。ID: {form.sanity_performance_id}</p>
          ) : (
            <p className="admin-ticket-sanity-warning">Sanity公演未連携です。公開するには連携先を選択してください。</p>
          )}

          {selectedEvent && (
            <>
              <form className="admin-ticket-form" onSubmit={onAddWindow}>
                <h3>予約枠追加</h3>
                <label>枠名<input value={windowForm.label} onChange={(e) => setWindowForm((prev) => ({ ...prev, label: e.target.value }))} required /></label>
                <label>日時<input type="datetime-local" value={windowForm.starts_at} onChange={(e) => setWindowForm((prev) => ({ ...prev, starts_at: e.target.value }))} /></label>
                <label>定員<input type="number" min="0" value={windowForm.capacity} onChange={(e) => setWindowForm((prev) => ({ ...prev, capacity: e.target.value }))} /></label>
                <button className="admin-view__button" type="submit">予約枠を追加</button>
              </form>
              <div className="admin-ticket-window-list">
                <h3>予約枠一覧</h3>
              <ul>
                {(selectedEvent.windows ?? []).filter((item) => !item.deleted_at).map((item) => {
                  const values = windowForms[item.id] ?? { label: item.label ?? '', starts_at: toDatetimeLocal(item.starts_at), capacity: String(item.capacity ?? 0) };
                  return (
                    <li key={item.id}>
                      <form className="admin-ticket-window" onSubmit={(e) => onSaveWindow(e, item.id)}>
                        <label>枠名<input value={values.label} onChange={(e) => onWindowFormChange(item.id, 'label', e.target.value)} required /></label>
                        <label>日時<input type="datetime-local" value={values.starts_at} onChange={(e) => onWindowFormChange(item.id, 'starts_at', e.target.value)} /></label>
                        <label>定員<input type="number" min="0" value={values.capacity} onChange={(e) => onWindowFormChange(item.id, 'capacity', e.target.value)} /></label>
                        <p className="admin-ticket-window__meta">
                          {item.capacity > 0
                            ? `残数 ${item.remaining_quantity} / ${item.capacity}（予約済み ${item.reserved_quantity}）`
                            : `残数 無制限（予約済み ${item.reserved_quantity}）`}
                        </p>
                        {selectedEvent.status === 'published' && <small>公開中の枠を削除すると販売停止になります。</small>}
                        <div>
                          <button className="admin-view__button" type="submit">予約枠を保存</button>
                          <button className="admin-view__button" type="button" onClick={() => onDeleteWindow(item.id)}>販売停止・削除</button>
                        </div>
                      </form>
                    </li>
                  );
                })}
              </ul>
              {(selectedEvent.windows ?? []).some((item) => item.deleted_at) && (
                <div className="admin-ticket-window__deleted">
                  <strong>削除済み枠（予約履歴保持）</strong>
                  {(selectedEvent.windows ?? []).filter((item) => item.deleted_at).map((item) => (
                    <div key={item.id}>{item.label} / {formatTicketDate(item.starts_at)}</div>
                  ))}
                </div>
              )}
              </div>
            </>
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
              {reservation.note && <small>備考：{reservation.note}</small>}
              {reservation.status !== 'cancelled' && <button type="button" className="admin-view__button" onClick={() => onCancelReservation(reservation)}>キャンセル</button>}
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
