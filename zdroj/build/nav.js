/* ================= NAVIGACE: nastavení, spodní lišta, systémové Zpět, hledání ================= */

/* ---- panel Nastavení: zvuky, hudba, efekty pozadí, instalace aplikace ---- */
const MD_SET = window.MD_SET = (function(){
  const btn = document.getElementById('nav-set'), panel = document.getElementById('setpanel');
  const muteB = document.getElementById('mute'), bgB = document.getElementById('fx-bg'), inst = document.getElementById('pwa-inst'), hint = document.getElementById('sethint');
  const RMQ = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : {matches: false};
  function refresh(){
    muteB.setAttribute('aria-pressed', String(!S.mute));
    bgB.setAttribute('aria-pressed', String(!!(window.FX && FX.bgOn && FX.bgOn())));
    bgB.disabled = !!RMQ.matches;
    inst.hidden = !(window.PWA_PROMPT);
    hint.textContent = RMQ.matches ? 'Systém má zapnuté „omezit pohyb“, proto jsou efekty vypnuté.' : '';
  }
  function open(v){ if(panel.hidden === !v) return; panel.hidden = !v; btn.setAttribute('aria-expanded', String(!!v)); if(v) refresh(); }
  btn.addEventListener('click', e => { e.stopPropagation(); open(panel.hidden); });
  document.addEventListener('click', e => { if(!panel.hidden && !panel.contains(e.target) && !btn.contains(e.target)) open(false); });
  document.addEventListener('keydown', e => { if(e.key === 'Escape' && !panel.hidden){ e.stopPropagation(); e.preventDefault(); open(false); btn.focus(); } }, true);
  muteB.addEventListener('click', () => { S.mute = !S.mute; save(); refresh(); FX.refresh(); if(!S.mute) beep('ok'); });
  bgB.addEventListener('click', () => { FX.setBg(!FX.bgOn()); refresh(); });
  inst.addEventListener('click', async () => {
    const p = window.PWA_PROMPT; if(!p) return;
    p.prompt(); try{ await p.userChoice; }catch(e){}
    window.PWA_PROMPT = null; refresh(); open(false);
  });
  return {refresh, open};
})();

/* ---- obrazovky: deska a téma jsou „základ“ (mají adresu #tN), ostatní jsou obrazovky nad nimi ---- */
function scrOf(){ const r = view.firstElementChild; return (r && r.dataset && r.dataset.scr) || ''; }
function isSub(){ const r = view.firstElementChild; if(!r || scrOf() === 'topic') return false; return scrOf() === 'search' || !!view.querySelector('#back, #bk'); }

/* ---- navigační tlačítka v hlavičce a spodní lišta na mobilu ---- */
function navOpen(where){
  MD_SET.open(false);
  if(where === 'home') go('');
  else if(where === 'search') runSearch();
  else if(where === 'mat') runMaterials();
  else if(where === 'prof') runProfile();
}
document.getElementById('nav-search').onclick = () => navOpen('search');
document.getElementById('nav-mat').onclick = () => navOpen('mat');
document.getElementById('nav-prof').onclick = () => navOpen('prof');
document.querySelectorAll('#bnav [data-go]').forEach(b => b.onclick = () => navOpen(b.dataset.go));
function navMark(){
  const s = scrOf(), sec = s === 'prof' ? 'prof' : (s === 'mat' || s === 'read') ? 'mat' : s === 'search' ? 'search' : (!isSub() ? 'home' : '');
  const set = (b, on) => on ? b.setAttribute('aria-current', 'page') : b.removeAttribute('aria-current');
  document.querySelectorAll('#bnav [data-go]').forEach(b => set(b, b.dataset.go === sec));
  [['nav-search', 'search'], ['nav-mat', 'mat'], ['nav-prof', 'prof']].forEach(([id, k]) => set(document.getElementById(id), k === sec));
}
/* klávesa / otevře hledání (mimo psaní do políček) */
document.addEventListener('keydown', e => {
  if(e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
  const tg = e.target; if(tg && (tg.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(tg.tagName))) return;
  if(scrOf() === 'search') return;
  e.preventDefault(); e.stopPropagation(); navOpen('search');
}, true);

/* ---- tlačítko / gesto Zpět v prohlížeči a na telefonu ----
   Témata mají vlastní adresu (#t5). Když je otevřená obrazovka nad nimi (kvíz, laboratoř, ústní, profil…),
   drží v historii jeden „strážní“ záznam. Systémové Zpět ho spotřebuje a udělá totéž, co tlačítko ← na obrazovce
   (hra se ukončí a uloží, čtečka se vrátí do materiálů); profil, materiály a hledání se vrátí na desku nebo téma.
   Zavře-li se obrazovka tlačítkem v aplikaci, strážní záznam se odebere, takže Zpět nikdy „nic neudělá“. */
const NAVH = {live: 0, skip: 0, idx: 0, hash: location.hash};
function navSync(){
  const st = history.state, onLive = !!(st && st.md === 'sub' && st.id === NAVH.live);
  if(isSub()){
    if(!onLive){ const id = Date.now(); NAVH.live = id; NAVH.idx = id; history.pushState({md: 'sub', id, idx: id}, ''); }
  } else if(onLive){ NAVH.live = 0; NAVH.skip++; history.back(); }
  else NAVH.live = 0;
  navMark();
}
function navStamp(){   // základní záznam (deska / téma) dostane pořadí, podle kterého se pozná směr Zpět × Vpřed
  const st = history.state;
  if(!st || !st.md || (st.md === 'sub' && st.id !== NAVH.live && !NAVH.skip)){ const idx = Date.now(); history.replaceState({md: 'base', idx}, ''); NAVH.idx = idx; }
  else NAVH.idx = st.idx || NAVH.idx;
}
new MutationObserver(navSync).observe(view, {childList: true});
addEventListener('popstate', e => {
  if(NAVH.skip > 0){ NAVH.skip--; return; }
  const st = e.state || {}, idx = st.idx || 0, back = !idx || idx <= NAVH.idx;
  if(idx) NAVH.idx = idx;
  const hashMoved = location.hash !== NAVH.hash; NAVH.hash = location.hash;
  if(st.md === 'sub' && st.id !== NAVH.live){ NAVH.skip++; if(back) history.back(); else history.forward(); return; }   // záznam už zavřené obrazovky – přeskočit
  if(NAVH.live && st.id !== NAVH.live){
    NAVH.live = 0;
    if(hashMoved || !isSub()) return;          // jiná adresa → route() vykreslí cíl sám
    const s = scrOf(), root = view.firstElementChild;
    if(s === 'prof' || s === 'mat' || s === 'search'){ route(); return; }
    const b = view.querySelector('#back, #bk'); if(b) b.click();
    if(view.firstElementChild === root && isSub()) navSync();   // obrazovka zůstala (zrušené potvrzení) → vrátit strážní záznam
  }
});
addEventListener('hashchange', () => { NAVH.hash = location.hash; navStamp(); });
navStamp();

/* ================= HLEDÁNÍ v otázkách, pojmech, ústních bodech, osnovách a textech PDF ================= */
let SIDX = null;
const normS = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
function searchIndex(){
  if(SIDX) return SIDX;
  const it = [];
  NUMS.forEach(n => {
    const t = T[n];
    if(RAW[n]){ let head = ''; rawParas(RAW[n]).forEach((p, pi) => { if(p.h){ head = p.t; it.push({n, k: 'pdf', a: p.t, pi, head: ''}); } else it.push({n, k: 'pdf', a: p.t, pi, head}); }); }
    (t.open || []).forEach((o, i) => it.push({n, k: 'oral', a: o.q, pts: o.k || [], i}));
    (t.terms || []).forEach(x => it.push({n, k: 'term', a: x[0], b: x[1]}));
    (t.q || []).forEach(q => it.push({n, k: 'q', a: q[0], b: q[1]}));
    (t.outline || []).forEach(o => it.push({n, k: 'out', a: o}));
  });
  it.forEach((x, i) => { x.id = i; x.s = normS([x.a, x.b || '', (x.pts || []).join(' ')].join(' ')); });
  return SIDX = it;
}
function qTokens(q){
  return [...new Set(normS(q).split(/\s+/).map(w => w.replace(/^[^\w#]+|[^\w+]+$/g, '')).filter(w => w.length >= 2 || /^\d$/.test(w)))];
}
function hlRanges(text, toks){
  let ns = ''; const map = [];
  for(let i = 0; i < text.length; i++){ const x = normS(text[i]); ns += x; for(let k = 0; k < x.length; k++) map.push(i); }
  const r = [];
  toks.forEach(tk => { let p = 0; while((p = ns.indexOf(tk, p)) !== -1){ r.push([map[p], map[p + tk.length - 1] + 1]); p += tk.length; } });
  r.sort((a, b) => a[0] - b[0]);
  const m = []; r.forEach(x => { if(m.length && x[0] <= m[m.length - 1][1]) m[m.length - 1][1] = Math.max(m[m.length - 1][1], x[1]); else m.push(x.slice()); });
  return m;
}
function hlHTML(text, toks, from, to){
  text = String(text); from = from || 0; to = to == null ? text.length : to;
  let out = '', pos = from;
  hlRanges(text, toks).forEach(([a, b]) => { if(b <= from || a >= to) return; a = Math.max(a, from); b = Math.min(b, to); out += esc(text.slice(pos, a)) + '<mark>' + esc(text.slice(a, b)) + '</mark>'; pos = b; });
  return out + esc(text.slice(pos, to));
}
function snip(text, toks, len){
  text = String(text); len = len || 200;
  if(text.length <= len) return hlHTML(text, toks);
  const R = hlRanges(text, toks), first = R.length ? R[0][0] : 0;
  let a = Math.max(0, first - 70); if(a > 0){ const sp = text.indexOf(' ', a); if(sp >= 0 && sp < first) a = sp + 1; }
  let b = Math.min(text.length, a + len); if(b < text.length){ const sp = text.lastIndexOf(' ', b); if(sp > a + len / 2) b = sp; }
  return (a > 0 ? '… ' : '') + hlHTML(text, toks, a, b) + (b < text.length ? ' …' : '');
}
function markText(root, q){   // zvýraznění v hotovém HTML (čtečka podkladů)
  const toks = qTokens(q); if(!toks.length) return;
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), nodes = [];
  while(w.nextNode()) nodes.push(w.currentNode);
  nodes.forEach(nd => {
    const s = nd.nodeValue, R = hlRanges(s, toks); if(!R.length) return;
    const f = document.createDocumentFragment(); let pos = 0;
    R.forEach(([a, b]) => { if(a > pos) f.appendChild(document.createTextNode(s.slice(pos, a))); const m = document.createElement('mark'); m.textContent = s.slice(a, b); f.appendChild(m); pos = b; });
    if(pos < s.length) f.appendChild(document.createTextNode(s.slice(pos)));
    nd.parentNode.replaceChild(f, nd);
  });
}
const SR_GROUPS = [['pdf', 'V podkladech (PDF)'], ['oral', 'Ústní body'], ['term', 'Pojmy'], ['q', 'Kvízové otázky'], ['out', 'Osnova maturity']];
function srItem(x, toks){
  let body;
  if(x.k === 'pdf') body = (x.head ? '<b>' + hlHTML(x.head, toks) + '</b>' : '') + '<span>' + snip(x.a, toks, 230) + '</span>';
  else if(x.k === 'oral'){
    const pts = x.pts.filter(p => toks.some(tk => normS(p).includes(tk))).slice(0, 2);
    body = '<b>' + hlHTML(x.a, toks) + '</b>' + pts.map(p => '<span>• ' + snip(p, toks, 170) + '</span>').join('');
  }
  else if(x.k === 'term') body = '<b>' + hlHTML(x.a, toks) + '</b><span>' + hlHTML(x.b, toks) + '</span>';
  else if(x.k === 'q') body = '<b>' + hlHTML(x.a, toks) + '</b><span class="sra">→ ' + hlHTML(x.b, toks) + '</span>';
  else body = '<b>' + hlHTML(x.a, toks) + '</b>';
  return '<button class="sr" data-i="' + x.id + '"><span class="ref">' + ref(x.n) + '</span><span class="srb">' + body + '</span><span class="srgo" aria-hidden="true">' + (x.k === 'pdf' ? 'číst ›' : 'téma ›') + '</span></button>';
}
function runSearch(q0){
  onKey = null;
  view.innerHTML = '<div class="bench wide srch" data-scr="search"><button class="back" id="back">← Zpět</button>' +
    '<h1 class="lbh">Hledat</h1><p class="muted small srhelp">Prohledá texty tvých PDF, ústní body, pojmy, kvízové otázky i osnovy. Diakritiku psát nemusíš.</p>' +
    '<div class="srbox"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg>' +
    '<input id="sq" type="search" autocomplete="off" spellcheck="false" enterkeyhint="search" placeholder="Co hledáš? Třeba MFT, mutex, cluster…" aria-label="Hledaný výraz"></div>' +
    '<div id="sres" aria-live="polite"></div></div>';
  const inp = document.getElementById('sq'), out = document.getElementById('sres'), more = {}; let tmr = 0;
  document.getElementById('back').onclick = () => route();
  inp.value = q0 || '';
  function draw(){
    const q = inp.value.trim(), toks = qTokens(q);
    if(!toks.length){
      out.innerHTML = '<div class="srtips"><span>Zkus třeba:</span>' + ['MFT', 'mutex', 'cluster', 'NVMe', 'maska', 'DMA', 'linker', 'Turbo Boost'].map(x => '<button class="srtip" data-q="' + x + '">' + x + '</button>').join('') + '</div>';
      out.querySelectorAll('.srtip').forEach(b => b.onclick = () => { inp.value = b.dataset.q; draw(); });
      return;
    }
    const hits = searchIndex().filter(x => toks.every(tk => x.s.includes(tk)));
    if(!hits.length){ out.innerHTML = '<p class="muted srnone">Pro „' + esc(q) + '“ nic nenalezeno. Zkus kratší nebo jiné slovo.</p>'; return; }
    let h = '<p class="srcount">' + hits.length + ' ' + plural(hits.length, 'výsledek', 'výsledky', 'výsledků') + '</p>';
    SR_GROUPS.forEach(([k, label]) => {
      const g = hits.filter(x => x.k === k); if(!g.length) return;
      const lim = more[k] ? g.length : 6;
      h += '<section class="srg"><h2>' + label + ' <span class="h3n">' + g.length + '</span></h2><div class="srl">' + g.slice(0, lim).map(x => srItem(x, toks)).join('') + '</div>' +
        (g.length > lim ? '<button class="btn ghost srmore" data-k="' + k + '">Zobrazit všech ' + g.length + '</button>' : '') + '</section>';
    });
    out.innerHTML = h;
    out.querySelectorAll('.srmore').forEach(b => b.onclick = () => { more[b.dataset.k] = true; draw(); });
    out.querySelectorAll('.sr').forEach(b => b.onclick = () => {
      const x = SIDX[+b.dataset.i];
      if(x.k === 'pdf') runReader(x.n, false, {q, para: x.pi, back: () => runSearch(q)});
      else go('t' + x.n);
    });
  }
  inp.oninput = () => { clearTimeout(tmr); tmr = setTimeout(draw, 120); };
  inp.onkeydown = e => {
    if(e.key === 'Escape'){ e.preventDefault(); e.stopPropagation(); if(inp.value){ inp.value = ''; draw(); } else route(); }
    else if(e.key === 'Enter'){ e.preventDefault(); clearTimeout(tmr); draw(); if(TOUCH) inp.blur(); }
  };
  draw();
  window.scrollTo(0, 0);
  if(!(TOUCH && q0)) inp.focus();
}
