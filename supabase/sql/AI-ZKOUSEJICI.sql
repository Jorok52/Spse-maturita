-- Maturitní deska – počítadlo denních limitů pro AI zkoušejícího (spusť jednou v Supabase → SQL Editor → Run)
create table if not exists public.ai_usage (
  day date not null,
  k   text not null,
  n   int  not null default 0,
  primary key (day, k)
);
alter table public.ai_usage enable row level security;   -- bez policies: z hry se do tabulky nikdo nedostane

create or replace function public.ai_take(p_player text, p_ip text, lp int, li int, lg int) returns text
language plpgsql security definer set search_path = public as $$
declare d date := (now() at time zone 'Europe/Prague')::date; ng int; np int; ni int;
begin
  insert into ai_usage values (d, 'all', 1) on conflict (day, k) do update set n = ai_usage.n + 1 returning n into ng;
  insert into ai_usage values (d, 'p:' || left(p_player, 64), 1) on conflict (day, k) do update set n = ai_usage.n + 1 returning n into np;
  insert into ai_usage values (d, 'i:' || left(coalesce(p_ip, '?'), 64), 1) on conflict (day, k) do update set n = ai_usage.n + 1 returning n into ni;
  delete from ai_usage where day < d - 7;
  if ng > lg then return 'all'; end if;
  if np > lp then return 'player'; end if;
  if ni > li then return 'ip'; end if;
  return 'ok';
end $$;

revoke all on function public.ai_take(text, text, int, int, int) from public;
grant execute on function public.ai_take(text, text, int, int, int) to service_role;
notify pgrst, 'reload schema';
