/* ================= v3: úrovně kvízu, profil hráče, materiály ================= */

/* ---------- úrovně kvízu ---------- */
function lvlCount(n){ return Math.ceil(QBY[n].length / 10); }
function lvlBest(n, k){ return ((S.lvlq || {})[n] || {})[k]; }
function lvlNeed(n, k){ return Math.ceil(Math.min(10, QBY[n].length - k*10) * 0.7); }
function lvlOpen(n, k){ return k === 0 || (lvlBest(n, k-1) || 0) >= lvlNeed(n, k-1); }
function lvlSummary(n){ const done = Array.from({length:lvlCount(n)}, (_,k) => (lvlBest(n,k)||0) >= lvlNeed(n,k)).filter(Boolean).length; return 'splněno '+done+'/'+lvlCount(n)+' úrovní'; }
function runQuizLevels(n){
  onKey = null; const t = T[n], L = lvlCount(n);
  let cards = '';
  for(let k = 0; k < L; k++){
    const size = Math.min(10, QBY[n].length - k*10), best = lvlBest(n, k), open = lvlOpen(n, k), need = lvlNeed(n, k);
    const pass = (best||0) >= need, stars = best == null ? 0 : best >= size ? 3 : best >= need ? 2 : best > 0 ? 1 : 0;
    cards += '<button class="lvcard'+(open?'':' locked')+(pass?' pass':'')+'" data-k="'+k+'"'+(open?'':' disabled')+'>'+
      '<span class="lvno">'+(k+1)+'</span><span class="lvtxt"><b>Úroveň '+(k+1)+'</b><span>otázky '+(k*10+1)+'–'+(k*10+size)+(open ? (best != null ? ' · nejlépe '+best+'/'+size : ' · zatím nehráno') : ' · odemkne se za '+lvlNeed(n,k-1)+'/'+Math.min(10, QBY[n].length-(k-1)*10)+' v úrovni '+k)+'</span></span>'+
      '<span class="lvstars" aria-label="'+stars+' ze 3">'+[0,1,2].map(i => '<i class="'+(i<stars?'on':'')+'"></i>').join('')+'</span></button>';
  }
  view.innerHTML = '<div class="bench wide"><button class="back" id="back">← Zpět na téma</button><h1 class="lbh">Kvíz po úrovních · '+n+'. '+esc(t.t)+'</h1>'+
    '<p class="muted" style="max-width:62ch">Každá úroveň má pevných 10 otázek. Na další úroveň potřebuješ aspoň 7 správně. Úrovně tak projdou celé téma, nic se neopakuje dokola.</p>'+
    '<div class="lvgrid">'+cards+'</div>'+
    '<div class="section"><h2>Další varianty</h2><div class="modes">'+
    '<button class="mode" data-v="mix"><b>Chytrý mix</b><span>10 otázek, častěji ty, které ještě neumíš nebo jsi neviděl. 3 pojistky.</span><em>opakování</em></button>'+
    '<button class="mode" data-v="all"><b>Celé téma</b><span>Všech '+QBY[n].length+' otázek tématu v náhodném pořadí, bez pojistek.</span><em>generálka</em></button></div></div></div>';
  $('#back').onclick = () => renderTopic(n);
  $$('.lvcard').forEach(b => b.onclick = () => runLevel(n, +b.dataset.k));
  $$('.mode[data-v]').forEach(b => b.onclick = () => b.dataset.v === 'mix' ? runTopicQuiz(n) : runWholeTopic(n));
  window.scrollTo(0,0);
}
function runLevel(n, k){
  const qs = shuffle(QBY[n].slice(k*10, k*10+10)).map(mcq), need = lvlNeed(n, k);
  runQuiz({title:'Úroveň '+(k+1), total:qs.length, lives:null, record:true, next:i => qs[i],
    onEnd:score => {
      S.lvlq = S.lvlq || {}; const m = S.lvlq[n] || (S.lvlq[n] = {});
      const was = m[k]; if(was == null || score > was) m[k] = score; save();
      if(score >= need && (was == null || was < need) && k+1 < lvlCount(n)) toast('Odemčena úroveň '+(k+2));
    },
    extra:score => '<p class="muted">'+(score >= need ? (k+1 < lvlCount(n) ? 'Úroveň splněna. Můžeš pokračovat na úroveň '+(k+2)+'.' : 'Poslední úroveň splněna, celé téma máš projité.') : 'Na splnění potřebuješ '+need+' správně. Zkus to znovu.')+'</p>'+
      (score >= need && k+1 < lvlCount(n) ? '<button class="btn" id="nextlv" style="margin-top:6px">Úroveň '+(k+2)+'</button>' : ''),
    after:() => { const b = document.getElementById('nextlv'); if(b) b.onclick = () => runLevel(n, k+1); },
    back:() => runQuizLevels(n), again:() => runLevel(n, k)});
}
function runWholeTopic(n){
  const qs = shuffle(QBY[n]).map(mcq);
  runQuiz({title:'Celé téma', total:qs.length, lives:null, record:true, next:i => qs[i], back:() => runQuizLevels(n), again:() => runWholeTopic(n)});
}

/* ---------- profil hráče ---------- */
function topicStats(n){
  let r = 0, w = 0; QBY[n].forEach(q => { const a = (S.ans||{})[q.id]; if(a){ r += a[0]; w += a[1]; } });
  const o = T[n].open.length ? T[n].open.reduce((s,_,i) => s + (S.oral[n+'-'+i]||0), 0) / T[n].open.length : 0;
  const seen = QBY[n].filter(q => S.seen[q.id]).length;
  return {m: topicMastery(n), acc: r+w ? r/(r+w) : null, r, w, o, seen, tot: QBY[n].length};
}
function runProfile(){
  onKey = null;
  const L = levelOf(S.xp), lo = 50*(L-1)*L, hi = 50*L*(L+1), p = (S.xp-lo)/(hi-lo);
  let R = 0, W = 0; Object.values(S.ans||{}).forEach(a => { R += a[0]; W += a[1]; });
  const st = NUMS.map(n => Object.assign({n}, topicStats(n)));
  const played = st.filter(x => x.seen > 0 || x.o > 0);
  const strong = played.length < 2 ? [] : played.slice().sort((a,b) => b.m - a.m).slice(0, Math.min(3, Math.ceil(played.length / 2)));
  const weak = played.slice().sort((a,b) => a.m - b.m).filter(x => !strong.includes(x)).slice(0, 3);
  const untouched = st.filter(x => x.seen === 0 && x.o === 0);
  const miss = ALLQ.filter(q => (S.ans||{})[q.id] && S.ans[q.id][1] > 0).sort((a,b) => (S.ans[b.id][1]-S.ans[b.id][0]) - (S.ans[a.id][1]-S.ans[a.id][0])).slice(0, 8);
  // aktivita posledních 28 dní
  const days = []; const d0 = new Date(); for(let i = 27; i >= 0; i--){ const d = new Date(d0); d.setDate(d.getDate()-i); const k = d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); const v = (S.daily||{})[k]; days.push({k, n: v ? v[0]+v[1] : (S.days.includes(k) ? 1 : 0), d}); }
  const maxD = Math.max(1, ...days.map(x => x.n));
  const nick = (typeof LB !== 'undefined' && LB.me) ? LB.me.nick : null;
  const row = x => '<li><button class="prow" data-n="'+x.n+'"><span class="ref">'+ref(x.n)+'</span><span class="pt">'+esc(T[x.n].t)+'</span><span class="pbar"><i style="width:'+(x.m*100).toFixed(1)+'%"></i></span><span class="pv">'+pct(x.m)+'</span><span class="pv sm">'+(x.acc==null?'—':Math.round(x.acc*100)+' % správně')+'</span></button></li>';
  view.innerHTML = '<div class="bench wide prof" data-scr="prof">'+
    '<button class="back" id="back">← Zpět na desku</button>'+
    '<div class="phead"><div class="pchip"><span class="notch"></span><b>'+esc(nick || 'Ty')+'</b><span>'+esc(rankOf(L))+' · úroveň '+L+'</span><div class="xpbar big"><i style="width:'+(p*100).toFixed(1)+'%"></i></div><em>'+S.xp.toLocaleString('cs-CZ')+' XP · do další úrovně '+(hi-S.xp).toLocaleString('cs-CZ')+'</em></div>'+
    '<div class="result ptiles"><div class="tile"><div class="v">'+masteredCount()+'</div><div class="l">zvládnutých otázek z '+ALLQ.length+'</div></div>'+
    '<div class="tile"><div class="v">'+(R+W ? Math.round(R/(R+W)*100)+' %' : '—')+'</div><div class="l">úspěšnost ('+(R+W)+' '+plural(R+W,'odpověď','odpovědi','odpovědí')+')</div></div>'+
    '<div class="tile"><div class="v">'+streak()+'</div><div class="l">dní v řadě</div></div>'+
    '<div class="tile"><div class="v">'+(S.best.survival||0)+'</div><div class="l">rekord v přežití</div></div></div></div>'+
    (!played.length ? '<p class="muted" style="margin-top:18px">Zatím tu nic není. Zahraj si kvíz nebo ústní zkoušení a profil se začne plnit.</p>' :
    '<div class="pcols"><div><h3>Tohle ti jde</h3><ul class="plist">'+(played.length < 2 ? '' : strong.map(row).join(''))+'</ul>'+(played.length < 2 ? '<p class="muted small">Zahraj si aspoň dvě témata a ukážu ti, co ti jde líp.</p>' : '')+'</div><div><h3>Na tom zapracuj</h3><ul class="plist">'+weak.map(row).join('')+'</ul>'+
      (untouched.length ? '<p class="muted small">Ještě jsi nezačal: '+untouched.map(x => x.n+'.').join(' ')+'</p>' : '')+'</div></div>')+
    '<div class="section"><h2>Aktivita za 4 týdny</h2><div class="act28">'+days.map(x => '<span title="'+x.k+': '+x.n+' '+plural(x.n,'odpověď','odpovědi','odpovědí')+'" style="--a:'+(x.n ? .25 + .75*x.n/maxD : 0)+'"></span>').join('')+'</div></div>'+
    (miss.length ? '<div class="section"><h2>Nejčastější chyby</h2><div class="wronglist">'+miss.map(q => '<div><b>'+esc(q.q)+'</b><span>'+esc(q.a)+'</span> <em class="muted small">('+ref(q.n)+', chyb '+S.ans[q.id][1]+', správně '+S.ans[q.id][0]+')</em></div>').join('')+'</div>'+
      '<div class="row" style="margin-top:12px"><button class="btn" id="fixmiss">Procvičit tyhle chyby</button></div></div>' : '')+
    '<div class="section"><h2>Všechna témata</h2><ul class="plist all">'+st.map(row).join('')+'</ul></div>'+
    '<p class="muted small" style="margin-top:16px">Profil se ukládá v tomhle prohlížeči'+(typeof LB !== 'undefined' && LB.on ? ' a s žebříčkem i online. Na jiném zařízení ho obnovíš kódem hráče v Žebříčku.' : '.')+'</p></div>';
  $('#back').onclick = () => go('');
  $$('.prow').forEach(b => b.onclick = () => go('t'+b.dataset.n));
  const fm = $('#fixmiss'); const runMiss = () => { const qs = shuffle(miss).map(mcq); runQuiz({title:'Moje chyby', total:qs.length, lives:null, record:true, next:i => qs[i], back:() => runProfile(), again:runMiss}); }; if(fm) fm.onclick = runMiss;
  window.scrollTo(0,0);
}

/* ---------- materiály: datasheety ---------- */
const IN_ARTIFACT = !!(window.claude && window.claude.use);
function pdfName(n){ return 'materialy/' + String(n).padStart(2,'0') + '.pdf'; }
/* ---------- prohlížeč stránek PDF (PDF.js) – podklady v původní grafice ----------
   Text vytažený z PDF se nikdy nepovede úplně (rozsypané tabulky, kód, schémata), proto čtečka umí ukázat i samotné stránky.
   Jen na webu (PDF a knihovna leží vedle index.html); v artefaktu a v souboru otevřeném z disku zůstává textová čtečka. */
const PDF_OK = MD_WEB && /^https?:/.test(location.protocol) && !IN_ARTIFACT && typeof IntersectionObserver === 'function';
const PDFJS = 'pdfjs/4.10.38/';
let pdfLibP = null; const pdfDocs = {}, pdfOrder = [];
function pvLs(k, v){ try { if(v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch(e){ return null; } }
function pdfLib(){
  return pdfLibP || (pdfLibP = import(new URL(PDFJS + 'pdf.min.mjs', document.baseURI).href)
    .then(L => { L.GlobalWorkerOptions.workerSrc = new URL(PDFJS + 'pdf.worker.min.mjs', document.baseURI).href; return L; })
    .catch(e => { pdfLibP = null; throw e; }));
}
function pdfDoc(n){
  const i = pdfOrder.indexOf(n); if(i >= 0) pdfOrder.splice(i, 1); pdfOrder.push(n);
  if(!pdfDocs[n]) pdfDocs[n] = pdfLib().then(L => L.getDocument({url:new URL(pdfName(n), document.baseURI).href, disableRange:true, disableStream:true, isEvalSupported:false}).promise)
    .catch(e => { delete pdfDocs[n]; throw e; });
  while(pdfOrder.length > 2){ const k = pdfOrder.shift(), d = pdfDocs[k]; delete pdfDocs[k]; if(d) d.then(x => x.destroy()).catch(() => {}); }   // v paměti jen poslední dvě PDF
  return pdfDocs[n];
}
function pvKey(s){ return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ''); }
const PV_ZOOM = [.5, .65, .8, 1, 1.25, 1.5, 1.75, 2, 2.5];
// o: {page: číslo strany na začátek, hl: {page, text} zvýraznit text na straně, scroller: rolovací prvek (jinak okno), onFail}
function pdfView(box, n, o){
  o = o || {};
  let zi = PV_ZOOM.indexOf(+pvLs('md3-pvz')); if(zi < 0) zi = 3;
  let night = pvLs('md3-pvnight') === '1', dead = false, doc = null, sizes = [], sheets = [], cur = o.page || 1, hlDone = false;
  box.innerHTML = '<div class="pv'+(night ? ' night' : '')+'" style="--pvz:'+PV_ZOOM[zi]+'"><div class="pvbar" role="toolbar" aria-label="Stránky PDF">'+
    '<button class="pvb" data-a="prev" aria-label="Předchozí strana">‹</button><label class="pvpg"><input class="pvnum" inputmode="numeric" autocomplete="off" value="'+cur+'" aria-label="Číslo strany"><span>/ <b class="pvtot">…</b></span></label><button class="pvb" data-a="next" aria-label="Další strana">›</button>'+
    '<span class="pvgap"></span><button class="pvb" data-a="out" aria-label="Oddálit">−</button><button class="pvzv" data-a="fit" title="Na šířku stránky">'+Math.round(PV_ZOOM[zi] * 100)+' %</button><button class="pvb" data-a="in" aria-label="Přiblížit">+</button>'+
    '<button class="pvb pvnt" data-a="night" aria-pressed="'+night+'" title="Tmavé stránky (šetří oči večer)">◐</button></div>'+
    '<div class="pvpages"><div class="pvload"><i class="pvspin"></i>Načítám stránky PDF…</div></div></div>';
  const pv = box.querySelector('.pv'), bar = pv.querySelector('.pvbar'), pages = pv.querySelector('.pvpages'), num = pv.querySelector('.pvnum');
  const scr = o.scroller || window, rendered = new Map(), visible = new Set();
  let io = null, rsT = 0;
  const stop = () => { dead = true; if(io) io.disconnect(); scr.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onResize); };
  const alive = () => { if(dead) return false; if(!box.isConnected || !box.contains(pv)){ stop(); return false; } return true; };
  const stick = () => { if(o.scroller) return; const t = document.querySelector('.top'); bar.style.setProperty('--pvtop', Math.max(0, t ? t.getBoundingClientRect().bottom : 0) + 'px'); };
  function onScroll(){
    if(!alive()) return; stick(); if(!sheets.length) return;
    const top = o.scroller ? o.scroller.getBoundingClientRect().top : 0, H = o.scroller ? o.scroller.clientHeight : innerHeight, line = top + H * .35;
    let c = 1; for(const s of sheets){ if(s.getBoundingClientRect().top <= line) c = +s.dataset.p; else break; }
    cur = c; if(document.activeElement !== num) num.value = c; upd();
  }
  function onResize(){ clearTimeout(rsT); rsT = setTimeout(() => { if(alive()) visible.forEach(render); }, 150); }
  const upd = () => { bar.querySelector('[data-a=prev]').disabled = cur <= 1; bar.querySelector('[data-a=next]').disabled = !sizes.length || cur >= sizes.length; };
  const goTo = (p, smooth) => { if(!sheets.length) return; p = Math.max(1, Math.min(sheets.length, p | 0)); cur = p; num.value = p; upd(); sheets[p - 1].scrollIntoView({block:'start', behavior:smooth ? 'smooth' : 'auto'}); };
  async function render(p){
    const sh = sheets[p - 1]; if(!sh || !doc) return;
    const W = sh.clientWidth; if(!W) return;
    const target = Math.round(W * Math.min(window.devicePixelRatio || 1, 2.5));
    if(rendered.get(p) === target) return; rendered.set(p, target);
    let page; try { page = await doc.getPage(p); } catch(e){ rendered.delete(p); return; }
    if(!alive() || rendered.get(p) !== target) return;
    const [w0, h0] = sizes[p - 1], sc = Math.min(target / w0, Math.sqrt(14e6 / (w0 * h0)));   // plocha plátna max ~14 Mpx (limit Safari na iOS)
    const vp = page.getViewport({scale:sc}), cv = document.createElement('canvas');
    cv.width = Math.floor(vp.width); cv.height = Math.floor(vp.height);
    try { await page.render({canvasContext:cv.getContext('2d'), viewport:vp}).promise; } catch(e){ if(rendered.get(p) === target) rendered.delete(p); return; }
    if(!alive() || rendered.get(p) !== target || !visible.has(p)){ cv.width = cv.height = 0; return; }
    const old = sh.querySelector('canvas'); if(old){ old.replaceWith(cv); old.width = old.height = 0; } else sh.prepend(cv);
    sh.classList.add('ok');
    if(o.hl && o.hl.page === p && !hlDone){ hlDone = true; highlight(page, sh, p); }
  }
  async function highlight(page, sh, p){
    // zvýraznit řádky stránky, které patří do nalezeného úseku textu: nejdelší souvislý shluk shod (mezera max 2 položky)
    let tc; try { tc = await page.getTextContent(); } catch(e){ return; }
    if(!alive()) return;
    const want = pvKey(o.hl.text), vp1 = page.getViewport({scale:1}), [W, H] = sizes[p - 1];
    const items = tc.items.filter(it => it.str && it.str.trim()), keys = items.map(it => pvKey(it.str)), hit = keys.map(k => k.length >= 4 && want.includes(k));
    let best = null, run = null, gap = 0;
    items.forEach((it, i) => { if(hit[i]){ if(!run || gap > 2) run = {from:i, to:i, len:0}; run.to = i; run.len += keys[i].length; gap = 0; if(!best || run.len > best.len) best = run; } else if(run) gap++; });
    if(!best || best.len < 12) return;
    const ink = sh.querySelector('.pvink'); let first = null;
    for(let i = best.from; i <= best.to; i++){
      if(!hit[i]) continue; const it = items[i], t = it.transform, fh = it.height || Math.hypot(t[2], t[3]);
      const [x1, y1, x2, y2] = vp1.convertToViewportRectangle([t[4] - 1, t[5] - fh * .28, t[4] + it.width + 1, t[5] + fh * .95]);
      const d = document.createElement('i'); d.className = 'pvhl';
      d.style.cssText = 'left:'+(Math.min(x1, x2) / W * 100)+'%;top:'+(Math.min(y1, y2) / H * 100)+'%;width:'+(Math.abs(x2 - x1) / W * 100)+'%;height:'+(Math.abs(y2 - y1) / H * 100)+'%';
      ink.appendChild(d); if(!first) first = d;
    }
    if(first) first.scrollIntoView({block:'center'});
  }
  const setZoom = k => {
    k = Math.max(0, Math.min(PV_ZOOM.length - 1, k)); if(k === zi) return;
    const keep = cur; zi = k; pvLs('md3-pvz', String(PV_ZOOM[zi]));
    pv.style.setProperty('--pvz', PV_ZOOM[zi]); bar.querySelector('.pvzv').textContent = Math.round(PV_ZOOM[zi] * 100) + ' %';
    goTo(keep); requestAnimationFrame(() => visible.forEach(render));
  };
  bar.onclick = e => {
    const b = e.target.closest('button'); if(!b) return; const a = b.dataset.a;
    if(a === 'prev') goTo(cur - 1, true); else if(a === 'next') goTo(cur + 1, true);
    else if(a === 'in') setZoom(zi + 1); else if(a === 'out') setZoom(zi - 1); else if(a === 'fit') setZoom(3);
    else if(a === 'night'){ night = !night; pvLs('md3-pvnight', night ? '1' : '0'); pv.classList.toggle('night', night); b.setAttribute('aria-pressed', night); }
  };
  num.onchange = () => goTo(+num.value);
  num.onkeydown = e => { if(e.key === 'Enter'){ e.preventDefault(); goTo(+num.value); num.blur(); } };
  num.onfocus = () => num.select();
  upd(); stick();
  pdfDoc(n).then(async d => {
    if(!alive()) return; doc = d;
    for(let i = 1; i <= d.numPages; i++){ const v = (await d.getPage(i)).getViewport({scale:1}); sizes.push([v.width, v.height]); if(!alive()) return; }
    pv.querySelector('.pvtot').textContent = sizes.length;
    pages.innerHTML = sizes.map(([w, h], i) => '<figure class="pvsheet" data-p="'+(i + 1)+'" style="aspect-ratio:'+w+'/'+h+'"><div class="pvink"></div><figcaption>'+ref(n)+' · '+String(i + 1).padStart(2, '0')+'/'+String(sizes.length).padStart(2, '0')+'</figcaption></figure>').join('');
    sheets = [...pages.querySelectorAll('.pvsheet')];
    io = new IntersectionObserver(es => es.forEach(e => {
      const p = +e.target.dataset.p;
      if(e.isIntersecting){ visible.add(p); render(p); }
      else { visible.delete(p); rendered.delete(p); const c = e.target.querySelector('canvas'); if(c){ c.width = c.height = 0; c.remove(); } e.target.classList.remove('ok'); }   // vzdálené stránky uvolnit (paměť na mobilu)
    }), {root:o.scroller || null, rootMargin:'1000px 0px'});
    sheets.forEach(s => io.observe(s));
    scr.addEventListener('scroll', onScroll, {passive:true}); window.addEventListener('resize', onResize);
    if(o.page > 1) goTo(o.page); else upd();
  }).catch(() => {
    if(!alive()) return; stop();
    pages.innerHTML = '<div class="pvload pverr">Stránky PDF se nepodařilo načíst – buď jsi offline a toto PDF ještě nemáš uložené, nebo to tenhle prohlížeč neumí (pomůže aktualizace).'+(o.onFail ? ' <button class="btn ghost">Ukázat text</button>' : '')+'</div>';
    const b = pages.querySelector('button'); if(b) b.onclick = o.onFail;
  });
  return {stop, goTo};
}
function runMaterials(){
  onKey = null;
  view.innerHTML = '<div class="bench wide" data-scr="mat"><button class="back" id="back">← Zpět na desku</button><h1 class="lbh">Materiály</h1>'+
    '<p class="muted" style="max-width:64ch">Tvoje podklady jako datasheety součástek na desce. Čti je přímo tady, nebo si otevři původní PDF.'+(IN_ARTIFACT ? ' PDF soubory jsou ve verzi na GitHubu a v aplikaci.' : '')+'</p>'+
    '<ol class="dslist">'+NUMS.map(n => { const t = T[n], has = !!RAW[n];
      return '<li class="ds"><span class="dsref">'+ref(n)+'</span><span class="dst"><b>'+esc(t.t)+'</b><span>'+(has ? t.outline.slice(0,3).map(esc).join(' · ') : 'Bez PDF – sestaveno podle oficiální osnovy')+'</span></span>'+
        '<span class="dsact">'+(VIDEOS[n] ? '<button class="btn ghost vd" data-n="'+n+'">Video</button>' : '')+(has ? '<button class="btn ghost rd" data-n="'+n+'">Číst</button>'+(IN_ARTIFACT ? '' : '<a class="btn ghost" href="'+pdfName(n)+'" target="_blank" rel="noopener">PDF</a>') : '<button class="btn ghost" data-t="'+n+'">Otevřít téma</button>')+'</span></li>'; }).join('')+'</ol></div>';
  $('#back').onclick = () => go('');
  $$('.rd').forEach(b => b.onclick = () => runReader(+b.dataset.n));
  $$('.vd').forEach(b => b.onclick = () => runReader(+b.dataset.n, true));
  $$('[data-t]').forEach(b => b.onclick = () => go('t'+b.dataset.t));
  window.scrollTo(0,0);
}
function rawParas(txt){
  let pg = 1; const lines = [];
  txt.split('\n').forEach(l => { const ff = (l.match(/\f/g) || []).length; pg += ff; const t = l.replace(/\f/g,'').trim(); if(t) lines.push({t, pg}); });   // pg = stránka PDF (pdftotext dává \f na konec stránky)
  const out = []; let para = '', ppg = 1;
  const flush = () => { if(para){ out.push({h:false, t:para, pg:ppg}); para = ''; } };
  lines.forEach((L, i) => {
    const l = L.t, next = (lines[i+1] || {}).t || '', last = out[out.length - 1];
    if(/^\|.*\|$/.test(l)){   // řádek tabulky z PDF („| a | b |“, viz zdroj/build/tabulky.py)
      flush(); const cells = l.slice(1, -1).split('|').map(c => c.trim());
      if(last && last.tab && last.open){ last.tab.push(cells); last.t += ' ' + cells.join(' '); }
      else out.push({h:false, tab:[cells], t:cells.join(' '), pg:L.pg, open:true});
      return;
    }
    if(last && last.open) last.open = false;
    // ukázky kódu (C, registry MCU): řádky zůstanou pod sebou jako blok kódu, uvnitř { } se bere všechno
    const prevCode = last && last.code && last.open2 && !para;
    if(prevCode && (last.depth > 0 || isCodeLine(l))){ last.code.push('  '.repeat(Math.max(0, last.depth - (/^\s*}/.test(l) ? 1 : 0))) + l); last.t += ' ' + l; last.depth += braceDelta(l); return; }
    if(last && last.code) last.open2 = false;
    const cmt = /^\s*\/\//.test(para);   // komentář nad kódem („// matematika.h“) patří do bloku
    const midSentence = /^#/.test(l) && para && !cmt && /[a-záčďéěíňóřšťúůýž,]$/.test(para);   // pokračování věty („…makra a / #if podmíněný překlad.“) není kód
    if(!midSentence && !/\.\s*$/.test(l) && isCodeLine(l) && (/[;{}]\s*(\/\/.*)?$/.test(l) || /^#|^\s*(case\b|default:)/.test(l))){
      const head = cmt ? [para] : []; if(cmt) para = ''; else flush();
      out.push({h:false, code:head.concat(l), t:head.concat(l).join(' '), pg:L.pg, open2:true, depth:Math.max(0, braceDelta(l))}); return; }
    const isHead = l.length <= 60 && !/[.,;:)–-]$/.test(l) && /^[A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ0-9]/.test(l) && /^[A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ|]/.test(next) && !para;
    if(isHead && l.split(' ').length <= 8){ flush(); out.push({h:true, t:l, pg:L.pg}); return; }
    if(para && /^[a-záčďéěíňóřšťúůýž(]/.test(l)) para += ' ' + l;
    else { flush(); para = l; ppg = L.pg; }
    if(/[.:]$/.test(l)) flush();
  });
  flush(); return out;
}
function braceDelta(l){ const s = l.replace(/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\/\/.*$/g, ''); return (s.match(/{/g) || []).length - (s.match(/}/g) || []).length; }
function isCodeLine(l){
  return /^#\s*(include|define|if|ifdef|ifndef|endif|else)\b/.test(l) || /^\s*(case\b[^:]*|default)\s*:/.test(l) || /^\s*[{}]/.test(l) || /[{}]\s*(\/\/.*)?$/.test(l) || /^\s*\/\/\s/.test(l)
    || (/;\s*(\/\/.*)?$/.test(l) && /[=()\[\]]|^\s*(break|continue|return)\b/.test(l));
}
function rawToHTML(txt){ return parasToHTML(rawParas(txt)); }
function parasToHTML(paras){ return paras.map((p, i) => p.tab ? '<div class="tblwrap dstab" data-pi="'+i+'"><table class="tbl"><tr>'+p.tab[0].map(c => '<th>'+esc(c)+'</th>').join('')+'</tr>'+p.tab.slice(1).map(r => '<tr>'+r.map(c => '<td>'+esc(c)+'</td>').join('')+'</tr>').join('')+'</table></div>' : p.code ? '<pre class="dscode" data-pi="'+i+'"><code>'+esc(p.code.join('\n'))+'</code></pre>' : p.h ? '<h3 data-pi="'+i+'">'+esc(p.t)+'</h3>' : '<p data-pi="'+i+'">'+esc(p.t)+'</p>').join(''); }
/* ---------- odpověď v PDF (tlačítko u špatné odpovědi v kvízu) ---------- */
const ANS_STOP = new Set('který která které kterou kterým jaký jaká jaké jakou jakým proč jsou může mohou nebo také jako když pouze tedy tento tato toto jeho jejich mezi podle kolik kde kdy čím čemu této tohoto byla bylo není nejsou pro při bez nad pod před přes jeho její jsme jste jak co kdo'.split(' '));
function ansWords(s){ return [...new Set((String(s).toLowerCase().match(/[a-záčďéěíňóřšťúůýž0-9]{3,}/g) || []).filter(x => !ANS_STOP.has(x)))]; }
function findAnswer(n, cur){
  const raw = RAW[n]; if(!raw) return null;
  const paras = rawParas(raw), stem = x => x.length > 5 ? x.slice(0, x.length - 2) : x;
  const aw = ansWords(cur.ans), qw = ansWords(cur.text), A = aw.map(stem), Q = qw.map(stem), low = paras.map(p => p.t.toLowerCase());
  // souvislý úsek 1–3 odstavců, který pokryje nejvíc různých slov ze správné odpovědi (a otázky)
  let best = null;
  for(let i = 0; i < paras.length; i++) for(let len = 1; len <= 3 && i + len <= paras.length; len++){
    const txt = low.slice(i, i + len).join(' ');
    let sc = 0; A.forEach(x => { if(txt.includes(x)) sc += 3; }); Q.forEach(x => { if(txt.includes(x)) sc += 1; });
    if(paras[i].h && len === 1) sc *= .5;
    sc -= (len - 1) * .5;   // kratší úsek má přednost
    if(sc > 0 && (!best || sc > best.score)) best = {para:i, len, score:sc};
  }
  const paged = (raw.match(/\f/g) || []).length > 1;   // stránky známe jen u textů, kde pdftotext zachoval konce stránek
  return {paras, para:best ? best.para : -1, len:best ? best.len : 0, score:best ? best.score : 0, page:best && paged ? paras[best.para].pg : null, words:aw.concat(qw.filter(x => x.length >= 5)).join(' ')};
}
function pdfAnswerButton(cur, host){
  if(!host || !cur || !cur.n || !T[cur.n]) return;
  const b = document.createElement('button'); b.className = 'btn ghost'; b.textContent = '📄 Odpověď v PDF';
  host.appendChild(b); b.onclick = () => showPdfAnswer(cur, host);
}
function showPdfAnswer(cur, host){
  const n = cur.n, t = T[n], f = findAnswer(n, cur), page = f && f.page, prevKey = onKey, pgOK = PDF_OK && !!RAW[n] && !!page && f.para >= 0;
  const note = !RAW[n] ? 'K této otázce nemáš PDF podklady – je sestavená podle oficiální osnovy.'
    : cur.x ? 'Tahle otázka je doplněná mimo tvoje PDF, takže přesnou odpověď v podkladech nenajdeš. Níž je nejbližší místo.'
    : !f || f.score < 3 ? 'Přesné místo jsem v podkladech nenašel, ukazuju nejbližší.' : '';
  if(document.querySelector('.pdfov')) return;
  const ov = document.createElement('div'); ov.className = 'pdfov'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'Odpověď v podkladech');
  ov.innerHTML = '<div class="pdfpan"><div class="pdfhd"><span class="dsref">'+ref(n)+'</span><div><b>Odpověď v podkladech</b><span>'+esc(t.t)+(page ? ' · strana '+page : '')+'</span></div><button class="pdfx" aria-label="Zavřít">✕</button></div>'+
    '<div class="pdfq"><span>'+esc(cur.text)+'</span><b>✓ '+esc(cur.ans)+'</b></div>'+(note ? '<p class="pdfnote">'+note+'</p>' : '')+
    '<div class="row pdfacts">'+(pgOK ? '<div class="seg ledseg rdseg" role="group" aria-label="Zobrazení"><button data-m="pdf">Stránka PDF</button><button data-m="text">Text</button></div>' : '')+(IN_ARTIFACT || !RAW[n] ? '' : '<a class="btn ghost" href="'+pdfName(n)+(page ? '#page='+page : '')+'" target="_blank" rel="noopener"><span class="pdflong">Otevřít PDF'+(page ? ' na straně '+page : '')+'</span><span class="pdfshort">PDF</span> ↗</a>')+'<button class="btn ghost pdfclose">Zpět ke kvízu<span class="kbd">Esc</span></button></div>'+
    (f ? '<div class="pdfbody"></div>' : '')+'</div>';
  document.body.appendChild(ov);
  const focusables = () => [...ov.querySelectorAll('a[href], button:not(:disabled), input')].filter(el => el.getClientRects().length);   // skryté (na mobilu „Zpět ke kvízu“) vynechat
  const keys = e => {
    if(e.key === 'Escape'){ e.preventDefault(); e.stopPropagation(); close(); return; }
    if(e.key === 'Tab'){ const F = focusables(), k = F.indexOf(document.activeElement); e.preventDefault(); (F[(k + (e.shiftKey ? -1 : 1) + F.length) % F.length] || F[0]).focus(); return; }   // fokus zůstane v okně
    if(!ov.contains(e.target) || !/^(Enter| )$/.test(e.key)) e.stopPropagation();   // klávesy neovládají kvíz pod oknem
  };
  const shut = () => close();
  let pvw = null;
  const close = () => { if(pvw){ pvw.stop(); pvw = null; } ov.remove(); view.inert = false; document.removeEventListener('keydown', keys, true); window.removeEventListener('popstate', shut); window.removeEventListener('hashchange', shut);
    if(host && host.isConnected) onKey = prevKey; };   // klávesy kvízu vrátit, jen když je kvíz pořád na obrazovce
  onKey = null; view.inert = true; document.addEventListener('keydown', keys, true); window.addEventListener('popstate', shut); window.addEventListener('hashchange', shut);
  ov.querySelector('.pdfx').onclick = close; ov.querySelector('.pdfclose').onclick = close; ov.onclick = e => { if(e.target === ov) close(); };
  const body = ov.querySelector('.pdfbody'), seg = ov.querySelector('.rdseg');
  const show = m => {
    if(!body) return;
    if(pvw){ pvw.stop(); pvw = null; }
    if(seg) seg.querySelectorAll('button').forEach(b => { b.classList.toggle('on', b.dataset.m === m); b.setAttribute('aria-pressed', b.dataset.m === m); });
    body.classList.toggle('pdfpg', m === 'pdf'); body.scrollTop = 0;
    if(m === 'pdf'){   // původní stránka s vyznačeným místem odpovědi
      pvw = pdfView(body, n, {page, scroller:body, hl:{page, text:f.paras.slice(f.para, f.para + f.len).map(p => p.t).join(' ')}, onFail:() => { pvLs('md3-ansmode', 'text'); show('text'); }}); return; }
    body.innerHTML = '<div class="dstext">'+parasToHTML(f.paras)+'</div>';
    if(f.para >= 0){ const els = Array.from({length:f.len}, (_, k) => body.querySelector('[data-pi="'+(f.para + k)+'"]')).filter(Boolean);
      els.forEach(el => { el.classList.add('srhit'); markText(el, f.words); });   // zvýraznit slova jen v nalezeném úseku
      if(els[0]) setTimeout(() => els[0].scrollIntoView({block:'center'}), 40); }
  };
  show(pgOK && pvLs('md3-ansmode') !== 'text' ? 'pdf' : 'text');
  if(seg) seg.onclick = e => { const b = e.target.closest('button'); if(!b || b.classList.contains('on')) return; pvLs('md3-ansmode', b.dataset.m); show(b.dataset.m); };
  const pc = ov.querySelector('.pdfclose'); (pc.getClientRects().length ? pc : ov.querySelector('.pdfx')).focus({preventScroll:true});
}
function runReader(n, vid, opt){
  onKey = null; const t = T[n]; opt = opt || {};
  view.innerHTML = '<div class="bench wide dsread" data-scr="read"><button class="back" id="back">'+(opt.back ? '← Hledání' : '← Materiály')+'</button>'+
    '<div class="dshead"><span class="dsref">'+ref(n)+'</span><div><h1>'+esc(t.t)+'</h1><span class="muted small">Datasheet · maturitní otázka '+n+'</span></div>'+
    (IN_ARTIFACT ? '' : '<a class="btn ghost" href="'+pdfName(n)+'" target="_blank" rel="noopener">Otevřít PDF</a>')+'</div>'+
    videoHTML(n, true)+
    '<div class="section"><h2>Osnova</h2><ol class="outline">'+t.outline.map(o => '<li>'+esc(o)+'</li>').join('')+'</ol></div>'+
    galleryHTML(n, 'Obrázky')+
    '<div class="section rdsec"><div class="rdhead"><h2>'+(PDF_OK && RAW[n] ? 'Podklady' : 'Text podkladů')+'</h2>'+(PDF_OK && RAW[n] ? '<div class="seg ledseg rdseg" role="group" aria-label="Zobrazení podkladů"><button data-m="pdf">Stránky PDF</button><button data-m="text">Jen text</button></div>' : '')+'</div><div class="rdbody"></div></div>'+
    '<div class="row" style="margin-top:20px"><button class="btn" id="toq">Procvičit tohle téma</button></div></div>';
  $('#back').onclick = () => opt.back ? opt.back() : runMaterials();
  $('#toq').onclick = () => go('t'+n);
  bindGallery(); window.scrollTo(0,0);
  if(vid){ const v = view.querySelector('.vfold'); if(v) v.scrollIntoView({block:'start'}); }
  // podklady: stránky PDF v původní grafice, nebo vytažený text (ten jde prohledávat; z hledání se otevře vždy text)
  const body = view.querySelector('.rdbody'), seg = view.querySelector('.rdseg'); let pvw = null;
  const show = (m, jump) => {
    if(pvw){ pvw.stop(); pvw = null; }
    if(seg) seg.querySelectorAll('button').forEach(b => { b.classList.toggle('on', b.dataset.m === m); b.setAttribute('aria-pressed', b.dataset.m === m); });
    if(m === 'pdf'){ pvw = pdfView(body, n, {page:opt.page, onFail:() => { pvLs('md3-rdmode', 'text'); show('text'); }}); if(jump) body.scrollIntoView({block:'start'}); return; }
    body.innerHTML = '<div class="dstext">'+rawToHTML(RAW[n]||'')+'</div>';
    if(jump) body.scrollIntoView({block:'start'});
    if(opt.q){   // z hledání: zvýraznit hledaná slova a skočit na nalezený odstavec
      const box = body.querySelector('.dstext'); markText(box, opt.q);
      const el = box.querySelector('[data-pi="'+opt.para+'"]') || box.querySelector('mark');
      if(el){ el.classList.add('srhit'); setTimeout(() => el.scrollIntoView({block:'center'}), 30); }
    }
  };
  show(seg && !opt.q && (opt.page || pvLs('md3-rdmode') !== 'text') ? 'pdf' : 'text');
  if(seg) seg.onclick = e => { const b = e.target.closest('button'); if(!b || b.classList.contains('on')) return; pvLs('md3-rdmode', b.dataset.m); opt.q = null; opt.page = null; show(b.dataset.m, true); };
}
