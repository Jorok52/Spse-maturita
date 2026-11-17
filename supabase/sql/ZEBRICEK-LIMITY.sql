-- Maturitní deska – ochrana žebříčku proti podvádění (spusť jednou v Supabase → SQL Editor → New query → Run)
-- Navazuje na ZEBRICEK-OPRAVA.sql (ta už musí být spuštěná). Mění jen funkci md_push, data ani práva nemaže.
--  * XP může růst nejvýš o 5 XP za sekundu od posledního uložení – poctivý hráč to nikdy nepozná
--    (hra posílá stav každých 20 s a co se nevejde, dorovná se při dalším uložení),
--    ale zápis „milion XP“ přes konzoli prohlížeče už neprojde.
--  * první zápis nového hráče max. 50 000 XP; XP na serveru nikdy neklesne
--  * úroveň se počítá ze XP na serveru (stejný vzorec jako ve hře), přezdívka max. 24 znaků, třída max. 12

create or replace function public.md_push(p jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare
  pid    text := p->>'player_id';
  nk     text := left(regexp_replace(btrim(coalesce(p->>'nick', '')), '[[:cntrl:]]', '', 'g'), 24);
  tr     text := nullif(left(regexp_replace(btrim(coalesce(p->>'trida', '')), '[[:cntrl:]]', '', 'g'), 12), '');
  want   bigint := greatest(0, coalesce((p->>'xp')::bigint, 0));
  old_xp int;
  old_at timestamptz;
  new_xp int;
  lv     int;
begin
  if length(coalesce(pid, '')) < 8 then raise exception 'bad player id'; end if;
  if octet_length(p::text) > 300000 then raise exception 'payload too large'; end if;
  if nk = '' then raise exception 'bad nick'; end if;

  select s.xp, s.updated_at into old_xp, old_at from scores s where s.player_id = pid;
  if found then
    new_xp := greatest(coalesce(old_xp, 0),
                       least(want, coalesce(old_xp, 0) + 5 * greatest(0, floor(extract(epoch from (now() - coalesce(old_at, now())))))::bigint))::int;
  else
    new_xp := least(want, 50000)::int;
  end if;

  -- úroveň jako levelOf() ve hře: nejvyšší L, pro které 50·(L−1)·L ≤ XP
  lv := floor((1 + sqrt(1 + 0.08 * new_xp)) / 2)::int;
  if 50 * lv * (lv + 1) <= new_xp then lv := lv + 1; end if;
  if lv > 1 and 50 * (lv - 1) * lv > new_xp then lv := lv - 1; end if;

  insert into scores (player_id, nick, trida, xp, lvl, mastered, survival, state, updated_at)
  values (pid, nk, tr, new_xp, lv,
          least(greatest(coalesce((p->>'mastered')::int, 0), 0), 2000),
          least(greatest(coalesce((p->>'survival')::int, 0), 0), 10000),
          p->'state', now())
  on conflict (player_id) do update set
    nick = excluded.nick, trida = excluded.trida, xp = excluded.xp, lvl = excluded.lvl,
    mastered = excluded.mastered, survival = excluded.survival,
    state = coalesce(excluded.state, scores.state), updated_at = now();
end $$;

revoke all on function public.md_push(jsonb) from public;
grant execute on function public.md_push(jsonb) to anon, authenticated;
