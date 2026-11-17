-- Maturitní deska – oprava žebříčku (spusť jednou v Supabase → SQL Editor → New query → Run)
-- 1) přidá ukládání profilu (state)
-- 2) kód hráče už nepůjde přečíst z žebříčku (nikdo se nepřihlásí za jiného)
-- 3) zápis a obnovení profilu jde jen přes bezpečné funkce

alter table public.scores add column if not exists state jsonb;

create or replace function public.md_push(p jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  if length(coalesce(p->>'player_id', '')) < 8 then raise exception 'bad player id'; end if;
  if octet_length(p::text) > 300000 then raise exception 'payload too large'; end if;
  insert into scores (player_id, nick, trida, xp, lvl, mastered, survival, state, updated_at)
  values (p->>'player_id', p->>'nick', nullif(p->>'trida', ''),
          coalesce((p->>'xp')::int, 0), coalesce((p->>'lvl')::int, 1),
          coalesce((p->>'mastered')::int, 0), coalesce((p->>'survival')::int, 0),
          p->'state', now())
  on conflict (player_id) do update set
    nick = excluded.nick, trida = excluded.trida, xp = excluded.xp, lvl = excluded.lvl,
    mastered = excluded.mastered, survival = excluded.survival,
    state = coalesce(excluded.state, scores.state), updated_at = now();
end $$;

create or replace function public.md_restore(code text)
returns table (player_id text, nick text, trida text, xp int, state jsonb)
language sql stable security definer set search_path = public as $$
  select s.player_id, s.nick, s.trida, s.xp, s.state from scores s where s.player_id = code limit 1;
$$;

revoke all on function public.md_push(jsonb) from public;
revoke all on function public.md_restore(text) from public;
grant execute on function public.md_push(jsonb) to anon, authenticated;
grant execute on function public.md_restore(text) to anon, authenticated;

-- veřejně čitelné jen sloupce žebříčku (bez player_id a state)
revoke select, insert, update, delete on public.scores from anon, authenticated;
grant select (nick, trida, xp, lvl, mastered, survival, updated_at) on public.scores to anon, authenticated;

notify pgrst, 'reload schema';
