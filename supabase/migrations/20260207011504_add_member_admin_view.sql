create or replace view public.members_admin_view as
select
  m.*,
  a.label as affiliation_label,
  a.is_active as affiliation_is_active
from public.members m
left join public.member_affiliations a
  on a.code = m.affiliation_code;
