alter table public.ticket_events
  add constraint ticket_events_title_check
  check (nullif(btrim(title), '') is not null)
  not valid;
