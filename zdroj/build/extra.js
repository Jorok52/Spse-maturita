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
    const l = L.t, next = (lines[i+1] || {}).t || '';
    const isHead = l.length <= 60 && !/[.,;:)–-]$/.test(l) && /^[A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ0-9]/.test(l) && /^[A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ]/.test(next) && !para;
    if(isHead && l.split(' ').length <= 8){ flush(); out.push({h:true, t:l, pg:L.pg}); return; }
    if(para && /^[a-záčďéěíňóřšťúůýž(]/.test(l)) para += ' ' + l;
    else { flush(); para = l; ppg = L.pg; }
    if(/[.:]$/.test(l)) flush();
  });
  flush(); return out;
}
function rawToHTML(txt){ return parasToHTML(rawParas(txt)); }
function parasToHTML(paras){ return paras.map((p, i) => p.h ? '<h3 data-pi="'+i+'">'+esc(p.t)+'</h3>' : '<p data-pi="'+i+'">'+esc(p.t)+'</p>').join(''); }
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
  const n = cur.n, t = T[n], f = findAnswer(n, cur), page = f && f.page, prevKey = onKey;
  const note = !RAW[n] ? 'K této otázce nemáš PDF podklady – je sestavená podle oficiální osnovy.'
    : cur.x ? 'Tahle otázka je doplněná mimo tvoje PDF, takže přesnou odpověď v podkladech nenajdeš. Níž je nejbližší místo.'
    : !f || f.score < 3 ? 'Přesné místo jsem v podkladech nenašel, ukazuju nejbližší.' : '';
  if(document.querySelector('.pdfov')) return;
  const ov = document.createElement('div'); ov.className = 'pdfov'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'Odpověď v podkladech');
  ov.innerHTML = '<div class="pdfpan"><div class="pdfhd"><span class="dsref">'+ref(n)+'</span><div><b>Odpověď v podkladech</b><span>'+esc(t.t)+(page ? ' · strana '+page : '')+'</span></div><button class="pdfx" aria-label="Zavřít">✕</button></div>'+
    '<div class="pdfq"><span>'+esc(cur.text)+'</span><b>✓ '+esc(cur.ans)+'</b></div>'+(note ? '<p class="pdfnote">'+note+'</p>' : '')+
    '<div class="row pdfacts">'+(IN_ARTIFACT || !RAW[n] ? '' : '<a class="btn" href="'+pdfName(n)+(page ? '#page='+page : '')+'" target="_blank" rel="noopener">Otevřít PDF'+(page ? ' na straně '+page : '')+'</a>')+'<button class="btn ghost pdfclose">Zpět ke kvízu<span class="kbd">Esc</span></button></div>'+
    (f ? '<div class="dstext pdfbody">'+parasToHTML(f.paras)+'</div>' : '')+'</div>';
  document.body.appendChild(ov);
  const focusables = () => [...ov.querySelectorAll('a[href], button')];
  const keys = e => {
    if(e.key === 'Escape'){ e.preventDefault(); e.stopPropagation(); close(); return; }
    if(e.key === 'Tab'){ const F = focusables(), k = F.indexOf(document.activeElement); e.preventDefault(); (F[(k + (e.shiftKey ? -1 : 1) + F.length) % F.length] || F[0]).focus(); return; }   // fokus zůstane v okně
    if(!ov.contains(e.target) || !/^(Enter| )$/.test(e.key)) e.stopPropagation();   // klávesy neovládají kvíz pod oknem
  };
  const shut = () => close();
  const close = () => { ov.remove(); view.inert = false; document.removeEventListener('keydown', keys, true); window.removeEventListener('popstate', shut); window.removeEventListener('hashchange', shut);
    if(host && host.isConnected) onKey = prevKey; };   // klávesy kvízu vrátit, jen když je kvíz pořád na obrazovce
  onKey = null; view.inert = true; document.addEventListener('keydown', keys, true); window.addEventListener('popstate', shut); window.addEventListener('hashchange', shut);
  ov.querySelector('.pdfx').onclick = close; ov.querySelector('.pdfclose').onclick = close; ov.onclick = e => { if(e.target === ov) close(); };
  const body = ov.querySelector('.pdfbody');
  if(body && f && f.para >= 0){ const els = Array.from({length:f.len}, (_, k) => body.querySelector('[data-pi="'+(f.para + k)+'"]')).filter(Boolean);
    els.forEach(el => { el.classList.add('srhit'); markText(el, f.words); });   // zvýraznit slova jen v nalezeném úseku
    if(els[0]) setTimeout(() => els[0].scrollIntoView({block:'center'}), 40); }
  ov.querySelector('.pdfclose').focus({preventScroll:true});
}
function runReader(n, vid, opt){
  onKey = null; const t = T[n]; opt = opt || {};
  view.innerHTML = '<div class="bench wide dsread" data-scr="read"><button class="back" id="back">'+(opt.back ? '← Hledání' : '← Materiály')+'</button>'+
    '<div class="dshead"><span class="dsref">'+ref(n)+'</span><div><h1>'+esc(t.t)+'</h1><span class="muted small">Datasheet · maturitní otázka '+n+'</span></div>'+
    (IN_ARTIFACT ? '' : '<a class="btn ghost" href="'+pdfName(n)+'" target="_blank" rel="noopener">Otevřít PDF</a>')+'</div>'+
    videoHTML(n, true)+
    '<div class="section"><h2>Osnova</h2><ol class="outline">'+t.outline.map(o => '<li>'+esc(o)+'</li>').join('')+'</ol></div>'+
    galleryHTML(n, 'Obrázky')+
    '<div class="section"><h2>Text podkladů</h2><div class="dstext">'+rawToHTML(RAW[n]||'')+'</div></div>'+
    '<div class="row" style="margin-top:20px"><button class="btn" id="toq">Procvičit tohle téma</button></div></div>';
  $('#back').onclick = () => opt.back ? opt.back() : runMaterials();
  $('#toq').onclick = () => go('t'+n);
  bindGallery(); window.scrollTo(0,0);
  if(vid){ const v = view.querySelector('.vfold'); if(v) v.scrollIntoView({block:'start'}); }
  if(opt.q){   // z hledání: zvýraznit hledaná slova a skočit na nalezený odstavec
    const box = view.querySelector('.dstext');
    if(box) markText(box, opt.q);
    const el = box && (box.querySelector('[data-pi="'+opt.para+'"]') || box.querySelector('mark'));
    if(el){ el.classList.add('srhit'); setTimeout(() => el.scrollIntoView({block:'center'}), 30); }
  }
}
