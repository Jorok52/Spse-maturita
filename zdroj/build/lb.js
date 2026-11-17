/* ================= ŽEBŘÍČEK TŘÍDY (Supabase, bez účtů) ================= */
const LBC = /*LBCONF*/;   // {url, key} – doplní build z leaderboard.json
const LB = {on: !!(LBC && LBC.url && LBC.key), me: lsGet('lb-me', null), last: null, busy: false, remoteXp: lsGet('lb-rxp', 0), noState: false};
function lbId(){
  let id = lsGet('lb-id', null);
  if(!id){ id = (crypto && crypto.randomUUID) ? crypto.randomUUID() : 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2); lsSet('lb-id', id); }
  return id;
}
function lbRow(){ return {player_id: lbId(), nick: LB.me.nick, trida: LB.me.trida || null, xp: Math.max(S.xp, LB.remoteXp || 0), lvl: levelOf(Math.max(S.xp, LB.remoteXp || 0)), mastered: masteredCount(), survival: S.best.survival || 0, updated_at: new Date().toISOString()}; }
function lbRowS(){ const r = lbRow(); if(!LB.noState){ const st = Object.assign({}, S); delete st.mute; r.state = st; } return r; }
function lbHeaders(extra){ const h = {apikey:LBC.key, 'Content-Type':'application/json'}; if(/^eyJ/.test(LBC.key)) h.Authorization = 'Bearer ' + LBC.key; return Object.assign(h, extra || {}); }
async function lbFetch(path, opt){
  const r = await fetch(LBC.url.replace(/\/$/, '') + '/rest/v1/' + path, Object.assign({headers:lbHeaders()}, opt || {}));
  if(!r.ok){ let t = ''; try{ t = await r.text(); }catch(e){} const er = new Error('HTTP ' + r.status); er.status = r.status; er.body = t; throw er; }
  return r.status === 204 ? null : r.json().catch(() => null);
}
function lbSanitize(st){
  const o = def(), num = v => (typeof v === 'number' && isFinite(v)) ? v : 0;
  const map = (src, f) => { const r = {}; if(src && typeof src === 'object' && !Array.isArray(src)) for(const k in src){ if(/^[\w.-]{1,24}$/.test(k)){ const v = f(src[k]); if(v !== undefined) r[k] = v; } } return r; };
  const pair = v => Array.isArray(v) && v.length === 2 ? [num(v[0]), num(v[1])] : undefined;
  o.xp = Math.max(0, Math.floor(num(st.xp)));
  o.box = map(st.box, v => Math.max(0, Math.min(5, Math.floor(num(v)))));
  o.seen = map(st.seen, v => num(v));
  o.oral = map(st.oral, v => Math.max(0, Math.min(1, num(v))));
  o.match = map(st.match, v => num(v));
  o.ans = map(st.ans, pair); o.daily = map(st.daily, pair);
  o.lvlq = map(st.lvlq, v => map(v, x => num(x)));
  o.best = {survival: Math.floor(num(st.best && st.best.survival))};
  o.days = Array.isArray(st.days) ? st.days.filter(d => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)).slice(-400) : [];
  return o;
}
function lbSig(str){ let h = 5381; for(let i = 0; i < str.length; i++) h = (h * 33 + str.charCodeAt(i)) | 0; return h + ':' + str.length; }
LB.rpc = true;  // bezpečné funkce md_push / md_restore (viz ZEBRICEK-OPRAVA.sql); bez nich starý způsob
async function lbPush(final){
  if(!LB.on || !LB.me || LB.busy) return;
  const row = lbRowS(), body = JSON.stringify(row);
  const sig = lbSig(body.replace(/"updated_at":"[^"]*"/, ''));
  if(sig === LB.last) return;
  LB.busy = true;
  const ka = final && body.length < 60000 ? {keepalive: true} : {};
  const send = () => LB.rpc
    ? lbFetch('rpc/md_push', Object.assign({method:'POST', body:JSON.stringify({p: lbRowS()})}, ka))
    : lbFetch('scores?on_conflict=player_id', Object.assign({method:'POST', headers:lbHeaders({Prefer:'resolution=merge-duplicates,return=minimal'}), body:JSON.stringify(lbRowS())}, ka));
  try{ await send(); LB.last = sig; }
  catch(e){
    if(LB.rpc && e.status === 404){ LB.rpc = false; try{ await send(); LB.last = sig; }catch(e2){ if(!LB.noState && /state/.test(e2.body || '')){ LB.noState = true; try{ await send(); LB.last = sig; }catch(e3){} } } }
    else if(!LB.noState && e.status >= 400 && e.status < 500 && /state/.test(e.body || '')){ LB.noState = true; try{ await send(); LB.last = sig; }catch(e2){} }
    /* jinak offline – zkusí se příště */
  }
  LB.busy = false;
}
setInterval(lbPush, 20000);
window.addEventListener('pagehide', () => lbPush(true));
document.addEventListener('visibilitychange', () => { if(document.visibilityState === 'hidden') lbPush(true); });

function askCode(nick){
  view.innerHTML = '<div class="bench wide"><button class="back" id="back">← Zpět</button><h1 class="lbh">Pokračovat kódem hráče</h1>' +
    '<p class="muted" style="max-width:62ch">Kód hráče najdeš v žebříčku na zařízení, kde už hraješ (pod tvým jménem). Vlož ho sem a budeš pokračovat se stejnou přezdívkou, body i profilem.</p>' +
    '<form id="cf" class="lbform"><label for="code">Kód hráče</label><input id="code" class="notes lbin mono" required autocomplete="off" spellcheck="false" placeholder="např. 3c6a3ac2-…"><div id="cmsg"></div><button class="btn" type="submit">Pokračovat</button></form></div>';
  $('#back').onclick = runLeaderboard;
  $('#cf').onsubmit = async e => {
    e.preventDefault(); const code = $('#code').value.trim();
    if(!/^[\w-]{8,64}$/.test(code)){ $('#cmsg').innerHTML = '<p class="er">Tohle nevypadá jako kód hráče. Zkontroluj, že jsi ho zkopíroval celý.</p>'; return; }
    try{
      let rows = null;
      try{ rows = await lbFetch('rpc/md_restore', {method:'POST', body:JSON.stringify({code})}); }
      catch(e0){
        if(e0.status !== 404) throw e0;
        const q = 'scores?player_id=eq.' + encodeURIComponent(code) + '&limit=1&select=player_id,nick,trida,xp';
        try{ rows = await lbFetch(q + ',state'); }catch(e1){ if(e1.status === 400 && /state/.test(e1.body || '')){ LB.noState = true; rows = await lbFetch(q); } else if(e1.status === 400){ rows = []; } else throw e1; }
      }
      if(!$('#cmsg')) return;
      const r = rows && rows[0];
      if(!r){ $('#cmsg').innerHTML = '<p class="er">Takový kód v žebříčku není. Zkontroluj, že jsi ho zkopíroval celý.</p>'; return; }
      lsSet('lb-id', r.player_id); LB.me = {nick:r.nick, trida:r.trida || ''}; lsSet('lb-me', LB.me); LB.remoteXp = r.xp || 0; lsSet('lb-rxp', LB.remoteXp); LB.last = null;
      if(r.state && typeof r.state === 'object' && !Array.isArray(r.state)){ const st = lbSanitize(r.state); if(st.xp >= S.xp){ st.mute = S.mute; S = st; save(); renderStats(); } }
      toast('Vítej zpět, ' + r.nick); runLeaderboard();
    }catch(err){ if($('#cmsg')) $('#cmsg').innerHTML = '<p class="er">Nepodařilo se spojit s žebříčkem. Zkus to znovu.</p>'; }
  };
}
function runLeaderboard(){
  onKey = null;
  const back = () => go('');
  const shell = inner => {
    view.innerHTML = '<div class="bench wide"><button class="back" id="back">← Zpět na desku</button><h1 class="lbh">Žebříček třídy</h1>' + inner + '</div>';
    $('#back').onclick = back;
  };
  if(!LB.on){
    shell('<p class="muted" style="max-width:62ch">Žebříček zatím není připojený k databázi. Kdo hru nahrál, musí do souboru <span class="mono">leaderboard.json</span> doplnit adresu a klíč projektu Supabase a hru znovu sestavit. Hra mezitím funguje normálně, jen se body neposílají.</p>');
    return;
  }
  if(!LB.me){
    shell('<p class="muted" style="max-width:62ch">Zadej přezdívku, pod kterou tě uvidí ostatní. Ostatní uvidí jen přezdívku, XP, úroveň, počet zvládnutých otázek a rekord v přežití. Tvůj postup v otázkách se ukládá k profilu, abys ho mohl obnovit na jiném zařízení. Přezdívku zadáváš jen jednou.</p>' +
      '<form id="lbf" class="lbform"><label for="nick">Přezdívka</label><input id="nick" class="notes lbin" maxlength="24" required autocomplete="nickname" placeholder="např. Jarda">' +
      '<label for="trida">Třída (nepovinné)</label><input id="trida" class="notes lbin" maxlength="12" placeholder="např. 4.A"><div id="lbmsg"></div><button class="btn" type="submit" id="lbgo">Připojit se do žebříčku</button></form>' +
      '<p class="muted small" style="margin-top:18px">Už hraješ na jiném zařízení? <button class="linkbtn" id="havecode">Pokračuj kódem hráče</button></p>');
    $('#havecode').onclick = () => askCode('');
    $('#lbf').onsubmit = async e => {
      e.preventDefault();
      const nick = $('#nick').value.trim().slice(0,24), trida = $('#trida').value.trim().slice(0,12);
      if(nick.length < 2){ toast('Přezdívka musí mít aspoň 2 znaky'); return; }
      if(/[*%_\\,()"]/.test(nick)){ toast('Přezdívka nesmí obsahovat znaky * % _ \\ , ( ) "'); return; }
      $('#lbgo').disabled = true;
      let taken = null;
      try{ const rows = await lbFetch('scores?select=nick&nick=ilike.' + encodeURIComponent(nick) + '&limit=1'); taken = rows && rows[0]; }catch(err){ $('#lbmsg').innerHTML = '<p class="er">Nepodařilo se spojit s žebříčkem. Zkontroluj internet a zkus to znovu.</p>'; $('#lbgo').disabled = false; return; }
      if(!$('#lbmsg')) return;
      if(taken){
        $('#lbmsg').innerHTML = '<p class="er">Přezdívku „' + esc(taken.nick) + '“ už někdo má. Jestli jsi to ty z jiného zařízení, pokračuj kódem hráče. Jinak si vyber jinou.</p><button class="btn ghost" type="button" id="isme">Jsem to já – zadat kód</button>';
        $('#isme').onclick = () => askCode(taken.nick); $('#lbgo').disabled = false; return;
      }
      LB.me = {nick, trida}; lsSet('lb-me', LB.me); LB.last = null; lbPush().then(() => { if($('#lbf')) runLeaderboard(); });
    };
    return;
  }
  let filter = lsGet('lb-filter', 'vse');
  shell('<p class="muted">Hraješ jako <b>' + esc(LB.me.nick) + '</b>' + (LB.me.trida ? ' (' + esc(LB.me.trida) + ')' : '') + '</p>' +
    '<details class="lbcode"><summary>Hraješ i na jiném zařízení? Zobrazit kód hráče</summary><p class="muted small">Na druhém zařízení otevři Žebříček, klikni na „Pokračuj kódem hráče“ a vlož tenhle kód. Nikomu ho nedávej – kdo ho má, může hrát pod tvým jménem.</p><div class="row"><code class="mono" id="mycode">' + esc(lbId()) + '</code><button class="btn ghost" id="cpy">Zkopírovat</button></div></details>' +
    '<div id="lbt" class="lbt"><p class="muted">Načítám žebříček…</p></div>');
  $('#cpy').onclick = () => { try{ navigator.clipboard.writeText(lbId()).then(() => toast('Kód zkopírován'), () => toast('Kód označ a zkopíruj ručně')); }catch(e){ toast('Kód označ a zkopíruj ručně'); } };
  const isMe = r => (r.nick || '').toLowerCase() === LB.me.nick.toLowerCase();
  lbPush().then(() => lbFetch('scores?select=nick,trida,xp,lvl,mastered,survival,updated_at&order=xp.desc&limit=200')).then(rows => {
    if(!$('#lbt')) return;
    rows = rows || [];
    const mine = rows.find(isMe); if(mine && (mine.xp||0) > (LB.remoteXp||0)){ LB.remoteXp = mine.xp; lsSet('lb-rxp', LB.remoteXp); }
    const tridy = [...new Set(rows.map(r => r.trida).filter(Boolean))].sort();
    const draw = () => {
      const list = rows.filter(r => filter === 'vse' || r.trida === filter);
      const myPos = list.findIndex(isMe);
      $('#lbt').innerHTML = (tridy.length ? '<div class="row lbfilter"><button class="btn ' + (filter==='vse'?'':'ghost') + '" data-f="vse">Všichni</button>' + tridy.map(t => '<button class="btn ' + (filter===t?'':'ghost') + '" data-f="' + esc(t) + '">' + esc(t) + '</button>').join('') + '</div>' : '') +
        (myPos >= 0 ? '<p class="lbme">Jsi na <b>' + (myPos+1) + '. místě</b> z ' + list.length + '.</p>' : '') +
        '<ol class="lblist">' + list.map((r,i) => '<li class="' + (isMe(r) ? 'me' : '') + (i < 3 ? ' top' + (i+1) : '') + '"><span class="pos">' + (i+1) + '</span><span class="who"><b>' + esc(r.nick) + '</b>' + (r.trida ? '<em>' + esc(r.trida) + '</em>' : '') + '</span>' +
          '<span class="rk">' + esc(rankOf(r.lvl || 1)) + '</span><span class="num"><b>' + (r.xp||0).toLocaleString('cs-CZ') + '</b> XP</span><span class="num sm">' + (r.mastered||0) + ' zvládnuto</span><span class="num sm">přežití ' + (r.survival||0) + '</span></li>').join('') + '</ol>' +
        (list.length ? '' : '<p class="muted">Zatím tu nikdo není. Zahraj si kvíz a budeš první.</p>');
      $$('.lbfilter .btn').forEach(b => b.onclick = () => { filter = b.dataset.f; lsSet('lb-filter', filter); draw(); });
    };
    draw();
  }).catch(() => { if($('#lbt')) $('#lbt').innerHTML = '<p class="er">Žebříček se nepodařilo načíst. Zkontroluj připojení k internetu a zkus to znovu.</p>'; });
}

