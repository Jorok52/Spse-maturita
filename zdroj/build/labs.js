/* ================= LABORATOŘ (v2) ================= */
const LABS = {};
let LVBACK = null, LABRUN = 0;   // návrat na výběr úrovní; číslo běhu laboratoře (časovače starého běhu se podle něj zastaví)
function lab(n, name, desc, run){ (LABS[n] = LABS[n] || []).push({name, desc, run:(...a) => { LVBACK = null; LABRUN++; return run(...a); }}); }
function $(s){ return view.querySelector(s); }
function $$(s){ return view.querySelectorAll(s); }
function setKeys(f){ onKey = f; }
function labShell(n, title, inner, hint){
  view.innerHTML = '<div class="bench wide"><div class="lbtop"><button class="back" id="back">← Zpět na téma</button>'+(LVBACK && LVBACK.n === n ? '<button class="back lvbk" id="lvbk">≡ Výběr úrovně</button>' : '')+'</div>'+
    '<div class="eyebrow">Laboratoř · '+ref(n)+' · '+esc(T[n].t)+'</div><h2 class="labh">'+esc(title)+'</h2>'+inner+
    (hint ? '<div class="kbdhint">'+hint+'</div>' : '')+'</div>';
  $('#back').onclick = () => { onKey = null; renderTopic(n); };
  if($('#lvbk')) $('#lvbk').onclick = () => { onKey = null; LVBACK.fn(); };
}
function labDone(n, title, tiles, xp, again, extra){
  onKey = null; addXP(xp);
  view.innerHTML = '<div class="bench"><div class="eyebrow">Laboratoř · '+ref(n)+'</div><h1 style="font-size:28px;margin-top:6px">'+esc(title)+'</h1>'+
    '<div class="result">'+tiles.map(t => '<div class="tile"><div class="v">'+t[0]+'</div><div class="l">'+esc(t[1])+'</div></div>').join('')+
    '<div class="tile"><div class="v">+'+xp+'</div><div class="l">XP</div></div></div>'+(extra||'')+
    '<div class="row" style="margin-top:20px"><button class="btn" id="again">Znovu<span class="kbd">Enter</span></button><button class="btn ghost" id="bk">Zpět na téma</button></div></div>';
  $('#again').onclick = again; $('#bk').onclick = () => renderTopic(n);
  onKey = e => { if(e.key === 'Enter'){ e.preventDefault(); again(); } };
  window.scrollTo(0,0);
}
/* ---------- výběr úrovní ---------- */
function lvStore(n, name){ try{ return JSON.parse(localStorage.getItem('md3-lv-'+n+'-'+name) || '{}') || {}; }catch(e){ return {}; } }
function lvMark(n, name, k){ const d = lvStore(n, name); d[k] = 1; try{ localStorage.setItem('md3-lv-'+n+'-'+name, JSON.stringify(d)); }catch(e){} }
function levelPick(n, name, levels, start, note){
  onKey = null; LVBACK = null;
  const done = lvStore(n, name), cnt = levels.filter((_, k) => done[k]).length;
  labShell(n, name, '<p class="muted" style="max-width:66ch">'+(note || 'Vyber úroveň – začít můžeš kdekoli. Po splnění pokračuješ další úrovní.')+'</p>'+
    '<div class="lvpk"><span>splněno '+cnt+' z '+levels.length+'</span><i style="--p:'+(cnt / levels.length * 100)+'%"></i></div>'+
    '<div class="lvgrid">'+levels.map((l, k) => '<button class="lvcard'+(done[k] ? ' pass' : '')+'" data-k="'+k+'"><span class="lvno">'+(k+1)+'</span><span class="lvtxt"><b>'+esc(l[0] || 'Úroveň '+(k+1))+'</b><span>'+esc(l[1] || '')+'</span></span><span class="lvstars" aria-label="'+(done[k] ? 'splněno' : 'nesplněno')+'"><i class="'+(done[k] ? 'on' : '')+'"></i></span></button>').join('')+'</div>', '');
  // návrat na výběr = nový běh laboratoře s čistým stavem
  $$('.lvcard').forEach(b => b.onclick = () => { beep('tick'); LVBACK = {n, fn:() => { const l = (LABS[n] || []).find(x => x.name === name); if(l) l.run(n); }}; start(+b.dataset.k); window.scrollTo(0, 0); });
  window.scrollTo(0, 0);
}
function flash(el, cls){ if(!el) return; el.classList.add(cls); setTimeout(() => el.classList.remove(cls), 450); }
const fmt = (v, d) => Number(v).toLocaleString('cs-CZ', {maximumFractionDigits: d == null ? 3 : d, minimumFractionDigits: d || 0});

/* ---------- generic: ORDER ---------- */
function flyTo(fromEl, toEl, cls, done){
  try{
    const a = fromEl.getBoundingClientRect(), b = toEl.getBoundingClientRect(), c = fromEl.cloneNode(true);
    c.className = (fromEl.className || '') + ' fly ' + (cls || ''); c.removeAttribute('id');
    Object.assign(c.style, {position:'fixed', left:a.left+'px', top:a.top+'px', width:a.width+'px', height:a.height+'px', margin:0, zIndex:80, pointerEvents:'none', transition:'transform .42s cubic-bezier(.3,.7,.2,1), opacity .42s'});
    document.body.appendChild(c);
    requestAnimationFrame(() => { const dx = b.left + b.width/2 - (a.left + a.width/2), dy = b.top + b.height/2 - (a.top + a.height/2), sc = Math.min(1, Math.max(.25, b.width / a.width));
      c.style.transform = 'translate('+dx+'px,'+dy+'px) scale('+sc+')'; c.style.opacity = '.15'; });
    setTimeout(() => { c.remove(); if(fromEl.isConnected) done && done(); }, 430);
  }catch(e){ if(fromEl && fromEl.isConnected) done && done(); }
}
function orderLab(n, title, prompt, items){
  return () => {
    const pool = shuffle(items.map((t,i) => ({t,i}))); let pos = 0, mistakes = 0, busy = false;
    function render(){
      labShell(n, title, '<p class="muted" style="max-width:66ch">'+esc(prompt)+'</p>'+
        '<div class="ordx"><div class="ordtl"><div class="ordhd"><span>Postup</span><b>'+pos+'/'+items.length+'</b></div><ol class="ordline">'+
          items.map((t,k) => k < pos ? '<li class="done"><i>'+(k+1)+'</i><span>'+esc(t)+'</span></li>' : k === pos ? '<li class="slot" id="ordslot"><i>'+(k+1)+'</i><span>Který krok je další?</span></li>' : '<li class="todo"><i>'+(k+1)+'</i><span></span></li>').join('')+'</ol></div>'+
        '<div class="ordpool"><div class="ordhd"><span>Kroky k zařazení</span><b class="ordmis">chyby: '+mistakes+'</b></div><div class="ordcards">'+pool.filter(p => p.i >= pos).map(p => '<button class="ordcard" data-i="'+p.i+'">'+esc(p.t)+'</button>').join('')+'</div></div></div>',
        'Klikej na kroky ve správném pořadí – správný krok se zařadí na časovou osu.');
      $$('.ordcard').forEach(b => b.onclick = () => {
        if(busy) return;
        if(+b.dataset.i === pos){ busy = true; beep('ok'); b.classList.add('ok'); flyTo(b, $('#ordslot'), 'ok', () => { busy = false; pos++; if(pos === items.length) return finish(); render(); }); b.style.visibility = 'hidden'; }
        else { mistakes++; beep('bad'); flash(b, 'shake'); $('.ordmis').textContent = 'chyby: '+mistakes; }
      });
    }
    function finish(){ labDone(n, mistakes ? 'Seřazeno' : 'Bez chyby', [[mistakes, 'chyby']], Math.max(5, 24 - mistakes*4), orderLab(n, title, prompt, items),
      '<ol class="ordline final">'+items.map((t,k) => '<li class="done"><i>'+(k+1)+'</i><span>'+esc(t)+'</span></li>').join('')+'</ol>'); }
    render();
  };
}
/* ---------- generic: BUCKET (roztřiď) ---------- */
const BKCOL = ['#e0b45f','#61e38c','#7fd3ff','#ff8a7e','#c39bff','#ffb340','#5fe0c8','#f78fc4','#b7d36a'];
function bucketLab(n, title, prompt, cats, items, opt){
  return () => {
    const list = shuffle(items); let i = 0, ok = 0, busy = false; const wrong = [], res = [], inBin = cats.map(() => []);
    const binsHTML = (final) => '<div class="bkbins'+(cats.length > 4 ? ' many' : '')+'">'+cats.map((c,k) => '<button class="bkbin" data-k="'+k+'" style="--bc:'+BKCOL[k % BKCOL.length]+'"'+(final ? ' disabled' : '')+'>'+
      '<span class="bkh">'+(k < 9 && !final ? '<span class="bkk">'+(k+1)+'</span>' : '')+'<b>'+esc(c)+'</b><em>'+inBin[k].length+'</em></span>'+
      '<span class="bkin">'+inBin[k].map(x => '<i class="'+(x[1] ? '' : 'bad')+'">'+esc(x[0])+'</i>').join('')+'</span></button>').join('')+'</div>';
    function render(){
      if(i >= list.length) return labDone(n, 'Roztříděno', [[ok+'/'+list.length, 'správně']], ok*3, bucketLab(n, title, prompt, cats, items, opt),
        '<p class="muted small" style="margin:14px 0 6px">Takhle to patří:</p>'+binsHTML(true)+(wrong.length ? '<div class="wronglist">'+wrong.map(w => '<div><b>'+esc(w[0])+'</b><span>'+esc(cats[w[1]])+'</span></div>').join('')+'</div>' : ''));
      const it = list[i];
      labShell(n, title, '<p class="muted">'+esc(prompt)+'</p>'+
        '<div class="bksegs">'+list.map((_,k) => '<i class="'+(res[k] === true ? 'ok' : res[k] === false ? 'bad' : k === i ? 'cur' : '')+'"></i>').join('')+'</div>'+
        '<div class="bkstage"><div class="bkcard" id="bkcard"><span class="bkn">'+(i+1)+'/'+list.length+'</span>'+(opt && opt.art ? opt.art(it) : '')+esc(it[0])+'</div><div class="fb" id="fb"></div></div>'+binsHTML(false),
        'Klikni na přihrádku, kam pojem patří.<span class="kb"> Klávesy 1–'+Math.min(9,cats.length)+' vyberou přihrádku, Enter pokračuje.</span>');
      let done = false;
      const next = () => { if(busy) return; i++; render(); };
      const pick = k => {
        if(done || busy) return; done = true;
        const good = k === it[1], card = $('#bkcard'), target = $('.bkbin[data-k="'+it[1]+'"]'), chosen = $('.bkbin[data-k="'+k+'"]');
        res[i] = good; if(good){ ok++; beep('ok'); } else { beep('bad'); wrong.push(it); }
        $$('.bkbin').forEach(b => b.disabled = true);
        chosen.classList.add(good ? 'hit' : 'miss'); if(!good) target.classList.add('want');
        const land = () => { if(!card.isConnected) return; inBin[it[1]].push([it[0], good]); busy = false;
          $$('.bkbin').forEach(b => { const kk = +b.dataset.k; b.querySelector('em').textContent = inBin[kk].length; });
          const box = target.querySelector('.bkin'); box.insertAdjacentHTML('beforeend', '<i class="new'+(good ? '' : ' bad')+'">'+esc(it[0])+'</i>');
          $('#fb').innerHTML = '<span class="msg '+(good?'ok':'bad')+'">'+(good?'Správně':'Patří do: '+esc(cats[it[1]]))+'</span><button class="btn" id="nx">Další<span class="kbd">Enter</span></button>';
          $('#nx').onclick = next; };
        busy = true;
        if(good) flyTo(card, target, 'ok', land);
        else { flash(card, 'shake'); setTimeout(() => flyTo(card, target, 'bad', land), 380); }
        setTimeout(() => { card.classList.add('gone'); }, good ? 0 : 380);
        onKey = e => { if(e.key === 'Enter'){ e.preventDefault(); next(); } };
      };
      $$('.bkbin').forEach(b => b.onclick = () => pick(+b.dataset.k));
      onKey = e => { const k = +e.key - 1; if(k >= 0 && k < cats.length && !e.repeat){ e.preventDefault(); pick(k); } };
    }
    render();
  };
}
/* ---------- generic: CALC (generated MCQ) ---------- */
function mcqOf(text, ans, ws, n){ const opts = shuffle([ans, ...ws.filter((w,i,a) => w !== ans && a.indexOf(w) === i).slice(0,3)]); return {id:null, n, text, opts, correct:opts.indexOf(ans), ans}; }
function calcLab(n, title, gen, note){
  return () => runQuiz({title:title, total:8, lives:null, record:false, next:() => gen(),
    extra: note ? () => '<p class="muted small">'+note+'</p>' : null,
    back:() => renderTopic(n), again:() => calcLab(n, title, gen, note)()});
}

/* ================= T1 – jazyk C ================= */
const CODE = [
 ['int a = 5;\na += 3;\nprintf("%d", a * 2);', '16', ['10','13','8']],
 ['for (int i = 0; i < 3; i++)\n    printf("%d", i);', '012', ['123','0123','3']],
 ['printf("%d", 17 % 5);', '2', ['3','3.4','12']],
 ['int i = 0;\ndo { i++; } while (i < 0);\nprintf("%d", i);', '1', ['0','nic se nevypíše','nekonečný cyklus']],
 ['int a[] = {4, 2, 7};\nprintf("%d", a[1]);', '2', ['4','7','chyba']],
 ['int x = 3;\nint *p = &x;\n*p = 8;\nprintf("%d", x);', '8', ['3','adresa x','11']],
 ['printf("%.2f", 7 / 2.0);', '3.50', ['3.00','3','3.5']],
 ['int s = 0;\nfor (int i = 1; i <= 4; i++) s += i;\nprintf("%d", s);', '10', ['4','6','15']],
 ["char c = 'A' + 2;\nprintf(\"%c\", c);", 'C', ['A2','B','67']],
 ['int x = 5;\nswitch (x) {\n  case 5: printf("5");\n  case 6: printf("6"); break;\n  default: printf("D");\n}', '56', ['5','56D','D']],
 ['printf("%d", (int)3.99);', '3', ['4','3.99','0']],
 ['int a = 7, b = 2;\nprintf("%d", a / b);', '3', ['3.5','4','2']],
 ['int n = 0;\nwhile (n < 10) n += 4;\nprintf("%d", n);', '12', ['8','10','16']],
 ['int m[2][2] = {{1, 2}, {3, 4}};\nprintf("%d", m[1][0]);', '3', ['2','1','4']],
 ['int x = 10;\nif (x > 5 && x < 8) printf("A");\nelse printf("B");', 'B', ['A','AB','nic']]
];
lab(1, 'Co vypíše program?', 'Přečti kód v C a urči výstup.', n => {
  const set = shuffle(CODE).slice(0, 8);
  runQuiz({title:'Co vypíše program?', total:set.length, lives:null, record:false, next:i => {
    const c = set[i]; const q = mcqOf('Co vypíše tento kód?', c[1], c[2], 1); q.code = c[0]; return q; },
    back:() => renderTopic(1), again:() => LABS[1][0].run(1)});
});
lab(1, 'Bubble sort krok za krokem', 'Jsi algoritmus: u každé dvojice rozhodni, jestli prohodit.', n => {
  const a = Array.from({length:7}, (_, k) => ({v:ri(5, 99), id:k})); let i = 0, j = 0, mistakes = 0, swaps = 0, last = null;
  const MAXV = 99;
  function render(swapped){
    const before = {}; $$('.bsbar').forEach(b => before[b.dataset.id] = b.getBoundingClientRect().left);
    const code = ['for (i = 0; i < n - 1; i++)', '  for (j = 0; j < n - 1 - i; j++)', '    if (a[j] > a[j + 1]) {', '      tmp = a[j];', '      a[j] = a[j + 1];', '      a[j + 1] = tmp;', '    }'];
    labShell(1, 'Bubble sort krok za krokem', '<p class="muted">Průchod <b>'+(i+1)+'</b> · porovnávám <b>a['+j+']</b> a <b>a['+(j+1)+']</b>. Větší prvek má „probublat“ doprava.</p>'+
      '<div class="bsx"><div class="bsviz"><div class="bsbars">'+a.map((o,k) => {
        const cmp = k === j || k === j+1, srt = k >= a.length - i;
        return '<div class="bsbar'+(cmp ? ' cmp' : '')+(srt ? ' sorted' : '')+'" data-id="'+o.id+'"><b>'+o.v+'</b><i style="height:'+(18 + o.v / MAXV * 150).toFixed(0)+'px"></i><span>'+k+'</span></div>'; }).join('')+'</div>'+
        '<div class="bsptr" style="--j:'+j+';--n:'+a.length+'"><span>j</span><span>j+1</span></div>'+
        (last ? '<p class="bslast '+(last.ok ? 'ok' : 'bad')+'">'+esc(last.t)+'</p>' : '<p class="bslast"></p>')+'</div>'+
      '<div class="bscode"><div class="bsvars"><span>i = <b>'+i+'</b></span><span>j = <b>'+j+'</b></span><span>n = <b>'+a.length+'</b></span></div><pre class="code">'+code.map((l,k) => '<span class="'+(k === 2 ? 'hl' : '')+'">'+esc(l)+'</span>').join('\n')+'</pre></div></div>'+
      '<div class="row"><button class="btn" id="sw">Prohodit<span class="kbd">1</span></button><button class="btn ghost" id="ks">Nechat<span class="kbd">2</span></button></div>'+
      '<p class="mono small muted" style="margin-top:12px">chyby '+mistakes+' · prohození '+swaps+'</p>', 'Seřazené prvky na konci pole zezelenají. Na každý průchod se jeden největší prvek dostane na své místo.');
    $('#sw').onclick = () => step(true); $('#ks').onclick = () => step(false);
    onKey = e => { if(e.key === '1') step(true); else if(e.key === '2') step(false); };
    if(swapped) $$('.bsbar').forEach(b => { const x0 = before[b.dataset.id]; if(x0 == null) return; const dx = x0 - b.getBoundingClientRect().left; if(!dx) return;
      b.style.transition = 'none'; b.style.transform = 'translateX('+dx+'px)'; requestAnimationFrame(() => requestAnimationFrame(() => { b.style.transition = 'transform .38s cubic-bezier(.3,.7,.2,1)'; b.style.transform = ''; })); });
  }
  function step(swap){
    const x = a[j].v, y = a[j+1].v, need = x > y;
    if(swap !== need){ mistakes++; beep('bad'); last = {ok:false, t:need ? x+' > '+y+' → mělo se prohodit' : x+' ≤ '+y+' → mělo se nechat'}; }
    else { beep('ok'); last = {ok:true, t:need ? x+' > '+y+' → prohozeno' : x+' ≤ '+y+' → necháno'}; }
    if(need){ [a[j], a[j+1]] = [a[j+1], a[j]]; swaps++; }
    j++; if(j >= a.length-1-i){ i++; j = 0; }
    if(i >= a.length-1) return labDone(1, 'Seřazeno: '+a.map(o => o.v).join(', '), [[mistakes, 'chyby'], [swaps, 'prohození']], Math.max(6, 30 - mistakes*3), () => LABS[1][1].run(1));
    render(need);
  }
  render();
});
lab(1, 'Postup práce se souborem', 'Seřaď kroky čtení ze souboru v C.', orderLab(1, 'Postup práce se souborem', 'Seřaď kroky, jak v C správně přečteš data ze souboru.',
  ['Deklarace FILE *f;', 'f = fopen("data.txt", "r");', 'Kontrola if (f == NULL)', 'Čtení fscanf / fgets v cyklu', 'fclose(f);']));
lab(1, 'Formátové specifikátory', 'Přiřaď typ ke specifikátoru printf/scanf.', bucketLab(1, 'Formátové specifikátory', 'Který specifikátor patří k typu?', ['%d','%f / %lf','%c','%s'],
  [['int',0],['double',1],['float',1],['char',2],['řetězec (char[])',3],['short (v printf)',0]]));

/* ================= T2 – mikroprocesor (GPIO) ================= */
lab(2, 'Rozsviť LED přes registry', 'Klikáním na bity nastav GPIOD->ODR a MODER na kitu STM32F4 Discovery.', n => {
  const LEDN = {12:'zelená',13:'oranžová',14:'červená',15:'modrá'};
  let round = 0, mistakes = 0; const rounds = 4;
  let task, bits;
  function newTask(){
    bits = 0;
    if(round % 2 === 0){
      let tgt = 0; while(!tgt) tgt = ri(0,15) << 12;
      task = {type:'odr', target:tgt};
    } else {
      const pin = ri(12,15); task = {type:'moder', pin, target: (1 << (pin*2))>>>0};
    }
  }
  function board(){
    const C = {12:['#61e38c','zelená'], 13:['#ffb340','oranžová'], 14:['#ff5146','červená'], 15:['#5aa8ff','modrá']};
    const P = {13:[360,48], 14:[436,112], 15:[360,176], 12:[284,112]}, Y = {12:84, 13:100, 14:116, 15:132};
    const mode = p => task.type === 'moder' ? ['vstup','výstup','AF','analog'][(bits >>> (p*2)) & 3] : null;
    let g = '<defs><radialGradient id="dkGlow"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset=".25" stop-color="currentColor" stop-opacity=".7"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/></radialGradient></defs>';
    g += '<rect x="6" y="6" width="508" height="212" rx="16" fill="#16243d" stroke="#2f4670" stroke-width="2"/>';
    [[22,22],[498,22],[22,202],[498,202]].forEach(h => g += '<circle cx="'+h[0]+'" cy="'+h[1]+'" r="6" fill="#0a0d0e" stroke="#c9a35a" stroke-width="2"/>');
    g += '<rect x="44" y="12" width="40" height="16" rx="3" fill="#b8c0be"/><text x="64" y="40" text-anchor="middle" class="dkt">USB</text>';
    g += '<g transform="translate(72 50)"><rect x="0" y="0" width="120" height="120" rx="6" fill="#1a1e1f" stroke="#3d4648"/>';
    for(let k = 0; k < 12; k++){ const o = 10 + k * 8.6; g += '<rect x="'+o+'" y="-6" width="4" height="6" fill="#b8c0be"/><rect x="'+o+'" y="120" width="4" height="6" fill="#b8c0be"/><rect x="-6" y="'+o+'" width="6" height="4" fill="#b8c0be"/><rect x="120" y="'+o+'" width="6" height="4" fill="#b8c0be"/>'; }
    g += '<circle cx="14" cy="14" r="4" fill="#2b3133"/><text x="60" y="58" text-anchor="middle" class="dkchip">STM32</text><text x="60" y="74" text-anchor="middle" class="dkt">F407VG</text></g>';
    g += '<rect x="340" y="92" width="40" height="40" rx="3" fill="#1a1e1f" stroke="#3d4648"/><text x="360" y="116" text-anchor="middle" class="dkt">MEMS</text>';
    [12,13,14,15].forEach(p => {
      const on = task.type === 'odr' && ((bits >> p) & 1), [x, y] = P[p], col = C[p][0], m = mode(p), out = m === 'výstup';
      const R = {12:'M198 84H246V112H272', 13:'M198 100H256V48H348', 14:'M198 116H232V152H436V119', 15:'M198 132H222V176H348'};
      g += '<path d="'+R[p]+'" fill="none" stroke="'+(on || out ? col : '#3a5a8a')+'" stroke-width="2.4" stroke-linejoin="round"'+(on || out ? ' style="filter:drop-shadow(0 0 3px '+col+')"' : '')+'/>';
      g += '<text x="200" y="'+(Y[p] - 3)+'" class="dkpin">PD'+p+'</text>';
      if(on) g += '<circle cx="'+x+'" cy="'+y+'" r="34" fill="url(#dkGlow)" style="color:'+col+'"/>';
      g += '<rect x="'+(x-12)+'" y="'+(y-7)+'" width="24" height="14" rx="3" fill="'+(on ? col : '#2a3133')+'" stroke="'+col+'" stroke-width="1.6"'+(on ? '' : ' opacity=".75"')+'/>';
      g += '<text x="'+x+'" y="'+(p === 15 ? y + 24 : p === 13 ? y - 13 : y + 22)+'" text-anchor="middle" class="dkled" fill="'+col+'">'+C[p][1]+'</text>';
      if(m) g += '<text x="500" y="'+(40 + (p - 12) * 18)+'" text-anchor="end" class="dkmode'+(out ? ' out' : '')+'">PD'+p+': '+m+'</text>';
    });
    g += '<circle cx="470" cy="190" r="9" fill="#2b6dd6" stroke="#9cc3ff"/><text x="470" y="210" text-anchor="middle" class="dkt">USER</text><circle cx="430" cy="190" r="9" fill="#1a1e1f" stroke="#7f8e8a"/><text x="430" y="210" text-anchor="middle" class="dkt">RESET</text>';
    g += '<text x="72" y="200" class="dkt">STM32F4 Discovery · GPIOD</text>';
    return '<svg class="dksvg" viewBox="0 0 520 224" role="img" aria-label="Kit STM32F4 Discovery">'+g+'</svg>';
  }
  function hex(v, w){ return '0x'+(v>>>0).toString(16).toUpperCase().padStart(w,'0'); }
  function render(){
    let inner;
    if(task.type === 'odr'){
      const want = [12,13,14,15].filter(p => task.target & (1<<p)).map(p => LEDN[p]+' (PD'+p+')').join(', ');
      inner = '<p>Úkol '+(round+1)+'/'+rounds+': rozsviť přesně tyto LED: <b>'+want+'</b>. Ostatní bity registru nech v 0.</p>'+
        board()+
        '<div class="mono" style="margin:10px 0">GPIOD-&gt;ODR = <b>'+hex(bits,4)+'</b></div>'+bitGrid(16, bits, k => 'PD'+k);
    } else {
      inner = '<p>Úkol '+(round+1)+'/'+rounds+': nastav pin <b>PD'+task.pin+'</b> jako <b>výstup</b>. Každý pin má v MODER 2 bity: 00 vstup, 01 výstup, 10 alternativní funkce, 11 analog.</p>'+board()+
        '<div class="mono" style="margin:10px 0">GPIOD-&gt;MODER = <b>'+hex(bits,8)+'</b></div>'+bitGrid(32, bits, k => 'P'+Math.floor(k/2)+(k%2?'↑':'↓'));
    }
    labShell(2, 'Rozsviť LED přes registry', inner+'<div class="row" style="margin-top:14px"><button class="btn" id="chk">Zapsat do registru</button><button class="btn ghost" id="clr">Vynulovat</button></div>'+
      '<p class="mono small muted" style="margin-top:10px">chyby: '+mistakes+'</p>',
      task.type === 'odr' ? 'Bit n v ODR ovládá pin PDn. LED na Discovery: PD12 zelená, PD13 oranžová, PD14 červená, PD15 modrá.' : 'Pin n zabírá bity 2n+1 a 2n. Pro výstup: bit 2n = 1, bit 2n+1 = 0.');
    $$('.bitc').forEach(b => b.onclick = () => { bits = (bits ^ (1 << +b.dataset.k))>>>0; beep('tick'); render(); });
    $('#clr').onclick = () => { bits = 0; render(); };
    $('#chk').onclick = () => {
      if((bits>>>0) === (task.target>>>0)){ beep('ok'); toast('Správně: '+(task.type==='odr'?'ODR = ':'MODER = ')+hex(task.target>>>0, 1)); round++; if(round >= rounds) return labDone(2, 'Registry zvládnuté', [[mistakes, 'chyby']], Math.max(8, 32 - mistakes*4), () => LABS[2][0].run(2)); newTask(); render(); }
      else { mistakes++; beep('bad'); toast('Zatím ne – zkontroluj, které bity mají být 1 a které 0.'); render(); }
    };
  }
  function bitGrid(w, v, lab){
    let s = '<div class="bits" style="--w:'+Math.min(w,16)+'">';
    for(let k = w-1; k >= 0; k--) s += '<button class="bitc'+((v>>>k)&1?' on':'')+'" data-k="'+k+'"><b>'+((v>>>k)&1)+'</b><span>'+k+'</span></button>';
    return s+'</div>';
  }
  newTask(); render();
});
lab(2, 'Obsluha přerušení', 'Seřaď kroky zpracování přerušení.', orderLab(2, 'Obsluha přerušení', 'Periferie potřebuje obsloužit. Seřaď, co se děje.',
  ['Periferie vyšle IRQ','PIC vyhodnotí prioritu','PIC pošle CPU signál INT','CPU pozastaví program a pošle INTA','PIC předá typ (číslo) přerušení','CPU uloží stav a najde ISR ve vektoru přerušení','Provede se ISR','Návrat k přerušenému programu']));
lab(2, 'Přenos přes DMA', 'Seřaď signály DMA přenosu.', orderLab(2, 'Přenos přes DMA', 'Seřaď signály a kroky DMA přenosu podle podkladů.',
  ['Periferie aktivuje DREQ','Řadič DMA požádá CPU signálem HOLD (HRQ)','CPU uvolní sběrnici a odpoví HLDA','DMA vystaví adresu a aktivuje DACK','Přenos dat bez CPU','EOP – konec přenosu','DMA uvolní HOLD, CPU přebírá sběrnici']));
lab(2, 'Zapnutí LED v kódu', 'Seřaď kroky programu pro rozsvícení LED.', orderLab(2, 'Zapnutí LED v kódu', 'Seřaď řádky tak, aby LED na PD12 svítila.',
  ['RCC->AHB1ENR |= (1 << 3);   // hodiny pro GPIOD','GPIOD->MODER |= (1 << 24);  // PD12 výstup','GPIOD->ODR |= (1 << 12);    // LED svítí']));
lab(2, 'CISC, RISC, Von Neumann, Harvard', 'Roztřiď vlastnosti architektur.', bucketLab(2, 'Architektury', 'Ke které architektuře vlastnost patří?', ['CISC','RISC','Von Neumann','Harvard'],
  [['Proměnlivá délka instrukcí',0],['Mikroprogramové řízení',0],['Intel x86',0],['Instrukce stejné délky (32 b)',1],['Snadný pipelining',1],['ARM',1],['Program a data ve společné paměti',2],['Jedna sběrnice – bottleneck',2],['Oddělená paměť programu a dat',3],['DSP a mikrokontroléry',3]]));

/* ================= T3 – 74595 ================= */
lab(3, 'Simulátor 74595', 'Nasouvej bity přes DS, SRCLK a RCLK a zobraz vzor na výstupech.', n => {
  let round = 0, sr, latch, ds, oe, clocks, target, total = 0, act = '';
  function reset(){ sr = Array(8).fill(0); latch = Array(8).fill(0); ds = 0; oe = 1; clocks = 0; target = Array.from({length:8}, () => ri(0,1)); if(!target.includes(1)) target[ri(0,7)] = 1; }
  function chip(){
    const names = ['QA','QB','QC','QD','QE','QF','QG','QH'], X = k => 168 + k * 54;
    const wire = (d, on, cls) => '<path d="'+d+'" class="s5w'+(on ? ' on' : '')+(cls ? ' '+cls : '')+'"/>';
    let g = '<defs><marker id="s5a" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10z" fill="#7f8e8a"/></marker></defs>';
    g += '<rect x="8" y="96" width="64" height="176" rx="6" class="s5mcu"/><text x="40" y="266" text-anchor="middle" class="s5t b">MCU</text>';
    [['DS', 128, ds === 1, ''], ['SRCLK', 168, act === 'sc', 'pulse'], ['RCLK', 214, act === 'rc', 'pulse'], ['OE', 252, oe === 1, 'oe']].forEach(r => {
      g += '<text x="66" y="'+(r[1]-5)+'" text-anchor="end" class="s5t">'+r[0]+(r[0] === 'DS' ? ' = '+ds : r[0] === 'OE' ? ' = '+oe : '')+'</text>';
      g += wire('M72 '+r[1]+'H132', r[2], r[3]);
    });
    g += '<rect x="132" y="70" width="474" height="208" rx="8" class="s5chip"/><path d="M362 70a7 7 0 0 0 14 0" class="s5notch"/><text x="369" y="92" text-anchor="middle" class="s5t b">74HC595</text>';
    g += '<text x="146" y="110" class="s5t s lbl">posuvný registr</text>';
    g += wire('M132 128H'+(X(0)-24), ds === 1) + wire('M132 168H150V152H'+(X(7)+20), act === 'sc', 'pulse') + wire('M132 214H'+(X(7)+20), act === 'rc', 'pulse') + wire('M132 252H'+(X(7)+20), oe === 1, 'oe');
    names.forEach((nm, k) => {
      const x = X(k), lit = oe === 0 && latch[k];
      g += '<rect x="'+(x-22)+'" y="116" width="44" height="26" rx="4" class="s5c'+(sr[k] ? ' one' : '')+(act === 'sc' ? ' flash' : '')+'"/><text x="'+x+'" y="134" text-anchor="middle" class="s5v">'+sr[k]+'</text>';
      if(k < 7) g += '<path d="M'+(x+22)+' 129H'+(x+31)+'" class="s5ar" marker-end="url(#s5a)"/>';
      g += '<path d="M'+(x-6)+' 152l6 -8l6 8" class="s5clk"/><path d="M'+x+' 144V178" class="s5ar" marker-end="url(#s5a)"/>';
      g += '<rect x="'+(x-22)+'" y="180" width="44" height="26" rx="4" class="s5c'+(latch[k] ? ' one' : '')+(act === 'rc' ? ' flash' : '')+'"/><text x="'+x+'" y="198" text-anchor="middle" class="s5v">'+latch[k]+'</text>';
      g += '<path d="M'+(x-6)+' 214l6 -6l6 6" class="s5clk"/>';
      g += '<path d="M'+x+' 214V230" class="s5ar"/><path d="M'+(x-8)+' 230H'+(x+8)+'L'+x+' 244Z" class="s5buf'+(oe ? ' off' : '')+'"/><circle cx="'+(x+9)+'" cy="248" r="2.6" class="s5bub"/>';
      g += wire('M'+x+' 244V300', lit) + '<text x="'+(x-5)+'" y="292" text-anchor="end" class="s5t s">'+(oe ? 'Z' : latch[k])+'</text>';
      g += '<circle cx="'+x+'" cy="312" r="10" class="s5led'+(lit ? ' on' : '')+'"/><text x="'+x+'" y="338" text-anchor="middle" class="s5t">'+nm+'</text>';
      g += '<rect x="'+(x-8)+'" y="346" width="16" height="16" rx="3" class="s5tg'+(target[k] ? ' one' : '')+'"/><text x="'+x+'" y="358" text-anchor="middle" class="s5tv">'+target[k]+'</text>';
    });
    g += '<text x="146" y="175" class="s5t s lbl">záchytný registr</text>';
    g += wire('M'+(X(7)+22)+' 129H626', sr[7] === 1) + '<text x="626" y="122" text-anchor="end" class="s5t">QH′</text>';
    g += '<text x="'+(X(0)-30)+'" y="358" text-anchor="end" class="s5t s">cíl</text>';
    return '<div class="s5wrap"><svg class="s5svg" viewBox="0 0 634 370" role="img" aria-label="Logické schéma 74HC595">'+g+'</svg></div>';
  }
  function render(){
    const names = ['QA','QB','QC','QD','QE','QF','QG','QH'];
    const done = oe === 0 && latch.every((v,k) => v === target[k]);
    labShell(3, 'Simulátor 74595 · kolo '+(round+1)+'/3',
      '<p>Cíl na výstupech QA–QH: <span class="mono">'+target.map((v,k) => names[k]+'='+v).join(' ')+'</span></p>'+
      '<div class="sim595"><div class="ctl">'+
        '<button class="btn ghost" id="ds">DS = '+ds+'<span class="kbd">D</span></button>'+
        '<button class="btn" id="sc">SRCLK ↑<span class="kbd">S</span></button>'+
        '<button class="btn" id="rc">RCLK ↑<span class="kbd">R</span></button>'+
        '<button class="btn ghost" id="oe">OE = '+oe+(oe?' (Hi-Z)':' (aktivní)')+'<span class="kbd">O</span></button></div>'+
      '</div>'+chip()+
      '<p class="mono small muted">SRCLK pulsů: '+clocks+' (minimum 8)'+(done?' · <b style="color:var(--ok)">hotovo!</b>':'')+'</p>',
      'SRCLK posune vše o jedno místo (QA ← DS, QB ← QA …). RCLK přepíše posuvný registr do záchytného. OE = 0 výstupy zapne. Tip: první nasunutý bit skončí na QH.');
    $('#ds').onclick = () => { ds ^= 1; act = 'ds'; render(); };
    $('#sc').onclick = () => { sr = [ds, ...sr.slice(0,7)]; clocks++; total++; act = 'sc'; beep('tick'); render(); };
    $('#rc').onclick = () => { latch = sr.slice(); act = 'rc'; beep('tick'); check(); };
    $('#oe').onclick = () => { oe ^= 1; act = 'oe'; check(); };
    onKey = e => { const k = e.key.toLowerCase(); if(k==='d') $('#ds').click(); else if(k==='s') $('#sc').click(); else if(k==='r') $('#rc').click(); else if(k==='o') $('#oe').click(); };
  }
  function check(){
    if(oe === 0 && latch.every((v,k) => v === target[k])){ beep('ok'); round++; if(round >= 3) return labDone(3, 'Registr ovládnutý', [[total, 'SRCLK pulsů celkem']], Math.max(10, 40 - Math.max(0,total-24)), () => LABS[3][0].run(3)); toast('Výstupy odpovídají!'); reset(); }
    render();
  }
  reset(); render();
});
lab(3, 'Který obvod 74xx?', 'Přiřaď obvod k jeho funkci.', bucketLab(3, 'Obvody řady 74xx', 'Jakou funkci obvod má?', ['Posuvný registr','Záchytný registr (latch)','Budič sběrnice','Komparátor','Čítač'],
  [['74164',0],['74166',0],['74595',0],['74573',1],['74244',2],['74245',2],['74688',3],['74193',4]]));
lab(3, 'PAL, PLA, GAL, CPLD, FPGA', 'Roztřiď vlastnosti programovatelných obvodů.', bucketLab(3, 'Typy PLD', 'Kterému typu vlastnost patří?', ['PAL','PLA','GAL','CPLD','FPGA'],
  [['Programovatelné AND, pevné OR',0],['Rychlejší díky pevnému OR',0],['Programovatelné AND i OR',1],['Mazatelná EEPROM varianta PAL',2],['Stovky makrobuněk v jednom čipu',3],['CoolRunner od Xilinx',3],['Logické bloky CLB s LUT',4],['Konfigurace z externí EEPROM po zapnutí',4],['Block RAM, násobičky, DCM',4]]));
lab(3, 'Metodika návrhu PLD', 'Seřaď fáze návrhu.', orderLab(3, 'Metodika návrhu PLD', 'Seřaď fáze návrhu číslicového systému v PLD.', ['Formální zápis (vstupy a výstupy)','Popis problému (tabulky, rovnice, Karnaughovy mapy)','Simulace','Realizace v obvodu (bitstream .bit / .jed)']));

/* ================= T4 ================= */
lab(4, 'Rámec I²C', 'Seřaď části přenosu po I²C.', orderLab(4, 'Rámec I²C', 'Master zapisuje 1 bajt do slave. Seřaď části přenosu.', ['START (SDA 1→0 při SCL = 1)','7bitová adresa slave','R/W bit (0 = zápis)','ACK od slave','Datový bajt (MSB první)','ACK','STOP (SDA 0→1 při SCL = 1)']));
lab(4, 'Rámec RS-232', 'Seřaď části asynchronního rámce.', orderLab(4, 'Rámec RS-232', 'Seřaď části rámce sériového portu.', ['Klidový stav (log. 1)','Start bit (log. 0)','Datové bity (LSB → MSB)','Paritní bit (volitelný)','Stop bit(y) (log. 1)']));
lab(4, 'RWM nebo ROM?', 'Roztřiď paměti podle závislosti na napájení.', bucketLab(4, 'RWM nebo ROM?', 'Kam paměť patří?', ['RWM (závislá na napájení)','ROM (nezávislá)'],
  [['SRAM',0],['DRAM',0],['FIFO buffer',0],['LIFO zásobník',0],['Mask ROM',1],['PROM',1],['EPROM',1],['EEPROM',1],['Flash',1]]));
lab(4, 'Sériová nebo paralelní?', 'Roztřiď sběrnice.', bucketLab(4, 'Sériová nebo paralelní?', 'Jak sběrnice přenáší data?', ['Sériová','Paralelní'],
  [['USB',0],['SATA',0],['SPI',0],['I²C',0],['RS-232',0],['PCI Express',0],['ISA',1],['PATA',1],['SCSI (původní)',1],['PCI',1],['IEEE 1284 (LPT)',1],['FSB',1]]));
lab(4, 'Organizace paměti – počty', 'Adresní vodiče, kapacita, hloubka.', calcLab(4, 'Organizace paměti', () => {
  const Ns = [[256,'256'],[512,'512'],[1024,'1k'],[2048,'2k'],[4096,'4k'],[8192,'8k'],[16384,'16k'],[65536,'64k']];
  const [N, Nl] = Ns[ri(0, Ns.length-1)]; const w = [1,4,8,16][ri(0,3)]; const p = Math.log2(N);
  if(Math.random() < .5) return mcqOf('Paměť '+Nl+' × '+w+'. Kolik adresních vodičů potřebuje?', String(p), [String(p+1), String(p-1), String(N), String(w)], 4);
  return mcqOf('Paměť '+Nl+' × '+w+'. Jaká je kapacita v bitech?', fmt(N*w,0)+' b', [fmt(N,0)+' b', fmt(N*w/8,0)+' b', fmt(N*w*2,0)+' b'], 4);
}, 'Počet adresních vodičů p = log₂(N) · kapacita = N × n.'));

/* ================= T5 – SAR ================= */
lab(5, 'Převodník s postupnou aproximací', 'Buď SAR registr: nastavuj bity od MSB podle komparátoru.', n => {
  const nb = [4,5,6][ri(0,2)], Uref = 5, steps = 1 << nb, lsb = Uref/steps;
  const Ux = Math.round((Math.random()*(Uref - lsb) + lsb/3)*1000)/1000;
  let code = 0, k = nb-1, mistakes = 0; const hist = [];
  function render(){
    const trial = code | (1 << k), Uda = trial*lsb;
    const W = 560, H = 190, y = v => H - 20 - (v/Uref)*(H-40);
    let bars = hist.map((h,i) => '<rect x="'+(40+i*58)+'" y="'+y(h.u)+'" width="40" height="'+(H-20-y(h.u))+'" fill="'+(h.keep?'var(--ok)':'var(--bad)')+'" opacity=".8"/><text x="'+(60+i*58)+'" y="'+(H-4)+'" text-anchor="middle" fill="var(--silk-dim)" font-size="11">b'+h.k+'</text>').join('');
    if(k >= 0) bars += '<rect x="'+(40+hist.length*58)+'" y="'+y(Uda)+'" width="40" height="'+(H-20-y(Uda))+'" fill="var(--copper)"/><text x="'+(60+hist.length*58)+'" y="'+(H-4)+'" text-anchor="middle" fill="var(--copper)" font-size="11">b'+k+'</text>';
    const svg = '<svg viewBox="0 0 '+W+' '+H+'" class="chart" role="img" aria-label="Průběh aproximace"><line x1="30" x2="'+W+'" y1="'+y(Ux)+'" y2="'+y(Ux)+'" stroke="var(--silk)" stroke-dasharray="5 4"/><text x="'+(W-4)+'" y="'+(y(Ux)-6)+'" text-anchor="end" fill="var(--silk)" font-size="12">Ux = '+fmt(Ux)+' V</text>'+bars+'<line x1="30" x2="30" y1="10" y2="'+(H-20)+'" stroke="var(--copper-dim)"/><text x="26" y="'+y(Uref)+'" text-anchor="end" fill="var(--silk-dim)" font-size="10">'+Uref+' V</text><text x="26" y="'+(H-20)+'" text-anchor="end" fill="var(--silk-dim)" font-size="10">0</text></svg>';
    const reg = Array.from({length:nb}, (_,i) => { const b = nb-1-i; const v = b > k ? (code>>b)&1 : (b === k ? 1 : '·'); return '<span class="cell sm'+(b===k?' cmp':'')+'"><b>'+v+'</b><span>b'+b+'</span></span>'; }).join('');
    labShell(5, 'SAR převodník · '+nb+' bitů · Uref = '+Uref+' V',
      '<p>Měřené napětí <b>Ux = '+fmt(Ux)+' V</b>. LSB = Uref / 2<sup>'+nb+'</sup> = '+fmt(lsb,4)+' V.</p>'+svg+
      '<div class="arr">'+reg+'</div>'+
      '<p>Zkouším bit <b>b'+k+'</b> = 1 → D/A dává <b>Uda = '+fmt(Uda,4)+' V</b>. Co řekne komparátor?</p>'+
      '<div class="row"><button class="btn green" id="keep">Uda ≤ Ux → bit zůstane 1<span class="kbd">1</span></button><button class="btn red" id="zero">Uda &gt; Ux → bit = 0<span class="kbd">2</span></button></div>'+
      '<p class="mono small muted" style="margin-top:10px">chyby: '+mistakes+'</p>', 'Převod trvá vždy n kroků – od MSB po LSB.');
    $('#keep').onclick = () => decide(true); $('#zero').onclick = () => decide(false);
    onKey = e => { if(e.key==='1') decide(true); else if(e.key==='2') decide(false); };
  }
  function decide(keep){
    const trial = code | (1 << k), Uda = trial*lsb, right = Uda <= Ux;
    if(keep !== right){ mistakes++; beep('bad'); toast(right ? 'Uda ≤ Ux – bit měl zůstat 1' : 'Uda > Ux – bit měl být 0'); } else beep('ok');
    if(right) code = trial;
    hist.push({u:Uda, keep:right, k}); k--;
    if(k < 0){
      const bin = code.toString(2).padStart(nb,'0');
      return labDone(5, 'Výsledek: '+bin+' ('+code+')', [[fmt(code*lsb,3)+' V', 'Uda výsledek'], [fmt(Ux - code*lsb,3)+' V', 'kvantizační chyba'], [mistakes, 'chyby']], Math.max(6, 6 + nb*4 - mistakes*4), () => LABS[5][0].run(5));
    }
    render();
  }
  render();
});
lab(5, 'Granularita a komparátory', 'Počítej rozlišení a počty komparátorů.', calcLab(5, 'A/D výpočty', () => {
  const nb = [4,6,8,10,12][ri(0,4)], R = [5,10,3.3][ri(0,2)];
  const t = ri(0,2);
  if(t === 0) return mcqOf('Kolik úrovní rozliší '+nb+'bitový převodník?', fmt(2**nb,0), [fmt(2**nb-1,0), fmt(nb*2,0), fmt(2**(nb+1),0)], 5);
  if(t === 1) return mcqOf('Kolik komparátorů má '+nb+'bitový paralelní (flash) převodník?', fmt(2**nb-1,0), [fmt(2**nb,0), fmt(nb,0), fmt(2**(nb-1),0)], 5);
  const g = R/2**nb; return mcqOf('Granularita '+nb+'bitového převodníku pro rozsah 0–'+fmt(R)+' V?', fmt(g,5)+' V', [fmt(R/nb,5)+' V', fmt(g*2,5)+' V', fmt(R/(2**nb-1)*10,5)+' V'], 5);
}, 'Granularita = rozsah / 2ⁿ · flash ADC má 2ⁿ − 1 komparátorů.'));
lab(5, 'Který převodník?', 'Přiřaď vlastnost k typu převodníku.', bucketLab(5, 'Který převodník?', 'Ke kterému převodníku vlastnost patří?', ['Paralelní (flash)','Přírůstkový','Sledovací','Postupná aproximace','Dvojitá integrace','Sigma-delta'],
  [['Nejrychlejší, převod v ns',0],['Teploměrový kód',0],['Čítač od nuly – „schody“',1],['Vratný čítač nahoru i dolů',2],['Nestíhá rychlé změny signálu',2],['Bity od MSB, vždy n kroků',3],['Napětí převádí na časový interval',4],['Multimetry, odolnost proti brumu',4],['Oversampling a decimace',5],['Rozlišení 24–32 bitů',5]]));
lab(5, 'Kroky převodu A→D', 'Seřaď kroky převodu.', orderLab(5, 'Kroky převodu A→D', 'Seřaď kroky převodu analogového signálu na digitální.', ['Vzorkování – odběr hodnot v pravidelných intervalech','Kvantování – zaokrouhlení na kvantizační úroveň','Kódování – převod na binární číslo']));

/* ================= T6 – plánovač ================= */
lab(6, 'Buď plánovač procesů', 'Vybírej, který proces dostane CPU (FCFS, SJF, SRTF, RR), a sleduj Ganttův diagram.', n => {
  const ALGS = ['FCFS','SJF','SRTF','RR']; let ALG = ALGS[0]; const Q = 2;
  const P = Array.from({length:4}, (_,i) => ({at: i===0 ? 0 : ri(0,6), bt: ri(1,6)})).sort((a,b) => a.at - b.at).map((p,i) => ({...p, name:'P'+(i+1), rem:p.bt, ct:null, enq:false}));
  let t = 0, mistakes = 0; const gantt = []; let queue = []; let cand = []; let runLen = 0;
  function arrive(upTo){ P.forEach(p => { if(!p.enq && p.at <= upTo){ p.enq = true; queue.push(p); } }); }
  function ready(){ return P.filter(p => p.at <= t && p.rem > 0); }
  function decide(){
    arrive(t);
    let r = ready();
    while(!r.length){
      const nx = P.filter(p => p.rem > 0).map(p => p.at).sort((a,b) => a-b)[0];
      if(nx == null) return finish();
      gantt.push({name:'—', from:t, to:nx}); t = nx; arrive(t); r = ready();
    }
    if(ALG === 'FCFS'){ const m = Math.min(...r.map(p => p.at)); cand = r.filter(p => p.at === m); }
    else if(ALG === 'SJF'){ const m = Math.min(...r.map(p => p.bt)); cand = r.filter(p => p.bt === m); }
    else if(ALG === 'SRTF'){ const m = Math.min(...r.map(p => p.rem)); cand = r.filter(p => p.rem === m); }
    else { queue = queue.filter(p => p.rem > 0); cand = [queue[0]]; }
    render();
  }
  function run(p){
    if(ALG === 'FCFS' || ALG === 'SJF') runLen = p.rem;
    else if(ALG === 'SRTF'){ const nxt = P.filter(q => q.at > t && q.rem > 0).map(q => q.at); runLen = Math.min(p.rem, nxt.length ? Math.min(...nxt) - t : p.rem); }
    else runLen = Math.min(Q, p.rem);
    const last = gantt[gantt.length-1];
    if(last && last.name === p.name && last.to === t) last.to = t + runLen; else gantt.push({name:p.name, from:t, to:t+runLen});
    t += runLen; p.rem -= runLen;
    if(ALG === 'RR'){ queue.shift(); arrive(t); if(p.rem > 0) queue.push(p); }
    if(p.rem === 0) p.ct = t;
    if(P.every(q => q.rem === 0)) return finish();
    decide();
  }
  const PC = {P1:'#7fd3ff', P2:'#f3cd7e', P3:'#c39bff', P4:'#ff8a7e'};
  const HZ = Math.max(...P.map(p => p.at)) + P.reduce((s, p) => s + p.bt, 0);
  function ganttHTML(){
    const end = gantt.length ? gantt[gantt.length-1].to : 0, H = Math.max(HZ, end), pc = v => (v / H * 100).toFixed(3) + '%';
    let g = '<div class="gx"><div class="gxh"><span>Ganttův diagram</span><b>t = '+t+'</b></div><div class="gxbar">';
    g += gantt.map(s => '<div class="gxs'+(s.name === '—' ? ' idle' : '')+'" style="left:'+pc(s.from)+';width:'+pc(s.to - s.from)+';--pc:'+(PC[s.name] || '#3a4446')+'"><b>'+(s.name === '—' ? 'idle' : s.name)+'</b></div>').join('');
    if(!gantt.length) g += '<div class="gxempty">zatím nic neběželo</div>';
    g += '<div class="gxnow" style="left:'+pc(t)+'"></div></div><div class="gxax">';
    for(let k = 0; k <= H; k++) g += '<span style="left:'+pc(k)+'"'+(k % (H > 20 ? 2 : 1) ? ' class="m"' : '')+'>'+k+'</span>';
    g += P.map(p => '<i style="left:'+pc(p.at)+';--pc:'+PC[p.name]+'" title="příchod '+p.name+'">▼</i>').join('') + '</div></div>';
    return g;
  }
  function card(p, click){
    const st = p.rem === 0 ? 'done' : p.at > t ? 'wait' : 'ready';
    return '<'+(click ? 'button' : 'div')+' class="pcard '+st+'" data-n="'+p.name+'" style="--pc:'+PC[p.name]+'"><b>'+p.name+'</b><span>AT '+p.at+' · BT '+p.bt+'</span>'+
      '<i class="pbar"><em style="width:'+((p.bt - p.rem) / p.bt * 100)+'%"></em></i><small>'+(st === 'done' ? 'hotovo v t = '+p.ct : st === 'wait' ? 'přijde v t = '+p.at : 'zbývá '+p.rem)+'</small></'+(click ? 'button' : 'div')+'>';
  }
  function table(done){
    return '<div class="tblwrap"><table class="tbl"><tr><th>Proces</th><th>AT</th><th>BT</th>'+(done?'<th>CT</th><th>TAT = CT − AT</th><th>WT = TAT − BT</th>':'<th>zbývá</th>')+'</tr>'+
      P.map(p => '<tr><td>'+p.name+'</td><td>'+p.at+'</td><td>'+p.bt+'</td>'+(done ? '<td>'+p.ct+'</td><td>'+(p.ct-p.at)+'</td><td>'+(p.ct-p.at-p.bt)+'</td>' : '<td>'+p.rem+(p.at>t?' (ještě nepřišel)':'')+'</td>')+'</tr>').join('')+'</table></div>';
  }
  function render(){
    const rd = ALG === 'RR' ? queue.filter(p => p.rem > 0 && p.at <= t) : ready().slice().sort((a,b) => a.at - b.at || a.name.localeCompare(b.name));
    const last = gantt.filter(g => g.name !== '—').slice(-1)[0];
    labShell(6, 'Plánovač · algoritmus '+ALG+(ALG==='RR'?' (kvantum '+Q+')':''),
      '<p>Čas <b>t = '+t+'</b>. Který proces teď dostane procesor podle <b>'+ALG+'</b>? Klikni na jeho kartu ve frontě.</p>'+
      '<div class="schx">'+
        '<div class="schcol"><h4>Ještě nepřišly</h4>'+(P.filter(p => p.at > t && p.rem > 0).map(p => card(p)).join('') || '<p class="schnone">—</p>')+'</div>'+
        '<div class="schcol ready"><h4>'+(ALG === 'RR' ? 'Fronta (pořadí)' : 'Připravené')+'</h4>'+rd.map((p, k) => (ALG === 'RR' ? '<span class="schq">'+(k+1)+'.</span>' : '')+card(p, true)).join('')+'</div>'+
        '<div class="schcpu"><h4>Procesor</h4><div class="cpubox" id="cpubox"><div class="cpupins"></div><b>CPU</b><span>'+(last ? 'naposledy '+last.name+' (t '+last.from+'–'+last.to+')' : 'čeká na první proces')+'</span><em>vyber proces</em></div></div>'+
        '<div class="schcol"><h4>Hotové</h4>'+(P.filter(p => p.rem === 0).map(p => card(p)).join('') || '<p class="schnone">—</p>')+'</div>'+
      '</div>'+ganttHTML()+
      '<p class="mono small muted" style="margin-top:10px">chyby: '+mistakes+'</p>',
      {FCFS:'FCFS: kdo dřív přišel, běží celý (nepreemptivní).', SJF:'SJF: z připravených nejkratší BT, běží celý (nepreemptivní).', SRTF:'SRTF: nejkratší zbývající čas, při příchodu nového procesu se znovu rozhoduje (preemptivní).', RR:'RR: běží první ve frontě max. 2 jednotky, pak jde na konec fronty. Proces, který přijde přesně v okamžiku konce kvanta, se řadí před přerušený proces.'}[ALG]);
    let busy = false;
    $$('.schcol.ready .pcard').forEach(b => b.onclick = () => {
      if(busy) return;
      const p = P.find(q => q.name === b.dataset.n);
      if(cand.includes(p)){ busy = true; beep('ok'); flyTo(b, $('#cpubox'), 'ok', () => run(p)); b.style.visibility = 'hidden'; }
      else { mistakes++; beep('bad'); flash(b, 'shake'); toast('Podle '+ALG+' teď běží '+cand.map(c => c.name).join(' nebo ')); }
    });
  }
  function finish(){
    const avgW = P.reduce((s,p) => s + (p.ct-p.at-p.bt), 0)/P.length, avgT = P.reduce((s,p) => s + (p.ct-p.at), 0)/P.length;
    lvMark(6, 'Buď plánovač procesů', ALGS.indexOf(ALG));
    labDone(6, 'Plánování '+ALG+' hotové', [[mistakes, 'chyby'], [fmt(avgW,2), 'průměrné WT'], [fmt(avgT,2), 'průměrné TAT']], Math.max(8, 30 - mistakes*5), () => LABS[6][0].run(6), table(true)+ganttHTML());
  }
  levelPick(6, 'Buď plánovač procesů', ALGS.map(a => [a, {"FCFS": "kdo dřív přijde, běží celý (nepreemptivní)", "SJF": "nejkratší úloha první (nepreemptivní)", "SRTF": "nejkratší zbývající čas (preemptivní)", "RR": "kvantum 2, fronta dokola"}[a]]), k => { ALG = ALGS[k]; decide(); }, 'Vyber plánovací algoritmus. Procesy a jejich časy se pokaždé vygenerují nové.');
});
lab(6, 'Preemptivní, nebo ne?', 'Roztřiď plánovací algoritmy.', bucketLab(6, 'Preemptivní, nebo ne?', 'Může algoritmus procesu odebrat CPU?', ['Nepreemptivní','Preemptivní'],
  [['FCFS',0],['SJF',0],['SRTF',1],['Round Robin',1],['Priority Scheduling (dle podkladů)',1],['MFQS',1]]));
lab(6, 'Typy jader', 'Přiřaď systém k typu jádra.', bucketLab(6, 'Typy jader', 'Jaké jádro systém má?', ['Monolitické','Mikrojádro','Hybridní','Exokernel'],
  [['MS-DOS',0],['Windows 95/98',0],['Mac OS do 8.6',0],['Minix',1],['Symbian OS',1],['Windows NT / XP / 10 / 11',2],['Mac OS X',2],['Nemesis',3],['AE GIS',3]]));
lab(6, 'Přepnutí kontextu', 'Seřaď kroky přepnutí z P0 na P1.', orderLab(6, 'Přepnutí kontextu', 'Seřaď, co se děje při přepnutí kontextu.', ['P0 běží','Přerušení (časovač) nebo změna plánování','Uložení kontextu P0 do jeho PCB','Dispatcher vybere P1 podle plánovače','Načtení kontextu P1 z PCB','P1 běží']));

/* ================= T7 – semafor ================= */
lab(7, 'Semafor krok za krokem', 'Sleduj value a frontu semaforu při WAIT a SIGNAL.', n => {
  const names = ['A','B','C','D']; const init = ri(1,2);
  let v = init; const inKS = [], queue = [], steps = [];
  for(let s = 0; s < 8; s++){
    const free = names.filter(x => !inKS.includes(x) && !queue.includes(x));
    const doSignal = inKS.length && (Math.random() < .45 || !free.length);
    if(doSignal){
      const P = inKS[ri(0, inKS.length-1)]; const nv = v+1; const q = queue[0];
      const ans = 'value = '+nv+', '+(q ? 'probudí se '+q+' a vstoupí do KS' : 'fronta je prázdná, nikdo se neprobouzí');
      const ws = ['value = '+(v-1)+', '+(q ? 'probudí se '+q : 'nikdo se neprobouzí'), 'value = '+nv+', '+(q ? 'nikdo se neprobouzí' : 'probudí se '+(free[0]||'A')), 'value = '+v+', '+P+' zůstává v KS'];
      steps.push({txt:'Proces '+P+' opouští KS a volá SIGNAL(S).', v, q:queue.slice(), ks:inKS.slice(), ans, ws});
      inKS.splice(inKS.indexOf(P),1); v = nv; if(q){ queue.shift(); inKS.push(q); }
    } else if(free.length){
      const P = free[ri(0, free.length-1)]; const nv = v-1;
      const ans = 'value = '+nv+', '+(nv >= 0 ? P+' vstoupí do kritické sekce' : P+' se zablokuje a čeká ve frontě');
      const ws = ['value = '+nv+', '+(nv >= 0 ? P+' se zablokuje a čeká ve frontě' : P+' vstoupí do kritické sekce'), 'value = '+(v+1)+', '+P+' vstoupí do kritické sekce', 'value = '+v+', '+P+' se zablokuje a čeká ve frontě'];
      steps.push({txt:'Proces '+P+' volá WAIT(S).', v, q:queue.slice(), ks:inKS.slice(), ans, ws});
      v = nv; if(nv >= 0) inKS.push(P); else queue.push(P);
    }
  }
  runQuiz({title:'Semafor · počáteční value = '+init, total:steps.length, lives:null, record:false, next:i => {
    const s = steps[i];
    const q = mcqOf('Stav: value = '+s.v+' · v KS: '+(s.ks.join(', ')||'nikdo')+' · fronta: '+(s.q.join(' → ')||'prázdná')+'. '+s.txt+' Co se stane?', s.ans, s.ws, 7);
    const actor = (s.txt.match(/Proces (\w)/) || [])[1], sig = /SIGNAL/.test(s.txt), out = names.filter(x => !s.ks.includes(x) && !s.q.includes(x));
    const tok = x => '<span class="smp'+(x === actor ? ' isact' : '')+'">'+x+(x === actor ? '<em>'+(sig ? 'SIGNAL' : 'WAIT')+'</em>' : '')+'</span>';
    q.html = '<div class="smx"><div class="smv'+(s.v < 0 ? ' neg' : '')+'"><span>semafor S</span><b>'+s.v+'</b><i>value</i></div>'+
      '<div class="smks"><span>kritická sekce</span><div>'+(s.ks.map(tok).join('') || '<em class="sme">volno</em>')+'</div></div>'+
      '<div class="smq"><span>fronta semaforu</span><div>'+(s.q.map(tok).join('<i>→</i>') || '<em class="sme">prázdná</em>')+'</div></div>'+
      '<div class="smo"><span>ostatní procesy</span><div>'+(out.map(tok).join('') || '<em class="sme">—</em>')+'</div></div></div>';
    return q;
  }, extra:() => '<p class="muted small">WAIT: value−−, při value &lt; 0 se proces zablokuje. SIGNAL: value++, je-li někdo ve frontě, probudí se první.</p>',
    back:() => renderTopic(7), again:() => LABS[7][0].run(7)});
});
lab(7, 'Aktivní, nebo pasivní čekání?', 'Roztřiď řešení kritické sekce.', bucketLab(7, 'Aktivní, nebo pasivní čekání?', 'Jak řešení čeká na vstup do KS?', ['Aktivní čekání','Pasivní čekání (uspání)'],
  [['Zákaz přerušení',0],['Zamykací proměnná',0],['Přesné střídání',0],['Petersonovo řešení',0],['Atomická instrukce (Test-and-Set)',0],['Sleep() a Wakeup()',1],['Semafor (jádro OS)',1],['Mutex s frontou',1]]));
lab(7, 'Problémy synchronizace', 'Přiřaď popis k problému.', bucketLab(7, 'Problémy synchronizace', 'O jaký problém jde?', ['Deadlock','Starvation','Livelock','Inverze priorit','Race condition'],
  [['A čeká na prostředek B a B čeká na prostředek A',0],['Všichni filozofové drží levou vidličku a čekají na pravou',0],['Proces se ke zdroji nikdy nedostane, protože ostatní mají přednost',1],['Písaři čekají věčně, protože stále chodí noví čtenáři',1],['Procesy si neustále uhýbají a nikdo nepostoupí',2],['Proces H čeká na prostředek, který drží proces L',3],['count++ a count-- proběhnou proloženě a hodnota nesedí',4]]));

/* ================= T8 – stránky ================= */
lab(8, 'Výměna stránek', 'Při výpadku stránky vyber rámec, který se vymění (FIFO, LRU, OPT).', n => {
  const ALGS = ['FIFO','LRU','OPT']; let ALG = ALGS[0]; const F = 3;
  const refs = []; while(refs.length < 12){ const p = ri(0,5); if(refs[refs.length-1] !== p) refs.push(p); }
  const fr = Array(F).fill(null), loaded = Array(F).fill(-1), used = Array(F).fill(-1);
  let i = 0, faults = 0, mistakes = 0; const hist = []; let need = null;
  function advance(){
    while(i < refs.length){
      const p = refs[i], at = fr.indexOf(p);
      if(at >= 0){ used[at] = i; hist.push({f:fr.slice(), fault:false}); i++; continue; }
      const free = fr.indexOf(null);
      if(free >= 0){ fr[free] = p; loaded[free] = i; used[free] = i; faults++; hist.push({f:fr.slice(), fault:true}); i++; continue; }
      let ok;
      if(ALG === 'FIFO'){ const m = Math.min(...loaded); ok = [loaded.indexOf(m)]; }
      else if(ALG === 'LRU'){ const m = Math.min(...used); ok = [used.indexOf(m)]; }
      else { const nxt = fr.map(q => { const k = refs.indexOf(q, i+1); return k < 0 ? Infinity : k; }); const m = Math.max(...nxt); ok = nxt.map((x,k) => x === m ? k : -1).filter(k => k >= 0); }
      need = ok; return render();
    }
    lvMark(8, 'Výměna stránek', ALGS.indexOf(ALG));
    labDone(8, ALG+': '+faults+' výpadků stránky', [[faults, 'výpadků'], [mistakes, 'chyby']], Math.max(8, 30 - mistakes*5), () => LABS[8][0].run(8), histHTML());
  }
  function histHTML(){
    let s = '<div class="tblwrap"><table class="tbl pg"><tr><th>ref</th>'+refs.map((r,k) => '<th class="'+(k===i?'cur':'')+'">'+r+'</th>').join('')+'</tr>';
    for(let f = 0; f < F; f++) s += '<tr><td>rámec '+f+'</td>'+refs.map((_,k) => { const h = hist[k], v = h && h.f[f] != null ? h.f[f] : '', nw = h && h.fault && v === refs[k] && (!hist[k-1] || hist[k-1].f[f] !== v); return '<td class="'+(nw ? 'pgnew' : '')+'">'+v+'</td>'; }).join('')+'</tr>';
    return s+'<tr><td>výpadek</td>'+refs.map((_,k) => '<td class="'+(hist[k] ? (hist[k].fault ? 'pgf' : 'pgh') : '')+'">'+(hist[k] ? (hist[k].fault?'F':'✓') : '')+'</td>').join('')+'</tr></table></div>';
  }
  function render(){
    const p = refs[i];
    labShell(8, 'Výměna stránek · '+ALG+' · 3 rámce',
      '<div class="pgref"><span class="pgl">požadavky</span>'+refs.map((r,k) => '<span class="pgt'+(k < i ? (hist[k].fault ? ' f' : ' h') : k === i ? ' cur' : '')+'"><b>'+r+'</b><i>'+(k < i ? (hist[k].fault ? 'F' : '✓') : k === i ? '?' : '')+'</i></span>').join('')+'</div>'+
      '<div class="pgmem"><div class="pgdisk"><span class="pgl">disk (swap)</span><div class="pgcyl"></div><div class="pgin" id="pgin">stránka <b>'+p+'</b></div></div>'+
      '<div class="pgarr">výpadek →</div><div class="pgram"><span class="pgl">RAM · 3 rámce</span><div class="pgframes">'+fr.map((q,k) => '<button class="pgfr pick" data-k="'+k+'"><span>rámec '+k+'</span><b>'+q+'</b><i></i></button>').join('')+'</div></div></div>'+
      '<p>Požadovaná stránka <b>'+p+'</b> není v paměti a všechny rámce jsou plné. Kterou stránku podle <b>'+ALG+'</b> vyhodíš? Klikni na rámec.</p>'+
      histHTML()+
      '<p class="mono small muted" style="margin-top:10px">výpadky: '+faults+' · chyby: '+mistakes+'</p>',
      {FIFO:'FIFO: vyhoď stránku, která je v paměti nejdéle.', LRU:'LRU: vyhoď stránku, která byla nejdéle nepoužitá.', OPT:'OPT: vyhoď stránku, která bude potřeba nejpozději (nebo už vůbec).'}[ALG]);
    let busy = false;
    $$('.pick').forEach(b => b.onclick = () => {
      if(busy) return;
      const k = +b.dataset.k;
      if(need.includes(k)){ busy = true; beep('ok'); b.classList.add('swap'); flyTo($('#pgin'), b, 'ok', () => { fr[k] = p; loaded[k] = i; used[k] = i; faults++; hist.push({f:fr.slice(), fault:true}); i++; need = null; advance(); }); }
      else { mistakes++; beep('bad'); flash(b,'shake'); toast('Podle '+ALG+' to má být rámec '+need.join(' nebo ')); }
    });
  }
  levelPick(8, 'Výměna stránek', ALGS.map(a => [a, {"FIFO": "vyhoď stránku, která je v paměti nejdéle", "LRU": "vyhoď nejdéle nepoužitou stránku", "OPT": "vyhoď stránku potřebnou nejpozději"}[a]]), k => { ALG = ALGS[k]; advance(); }, 'Vyber algoritmus výměny stránek. Posloupnost požadavků se pokaždé vygeneruje nová.');
});
lab(8, 'Logická → fyzická adresa', 'Počítej adresy u souvislé oblasti a stránkování.', calcLab(8, 'Překlad adres', () => {
  if(Math.random() < .5){ const b = ri(1,9)*1000, l = ri(10,900); return mcqOf('Bázový registr = '+b+', logická adresa = '+l+'. Fyzická adresa?', String(b+l), [String(b), String(b-l), String(l)], 8); }
  const a = ri(4096, 40000), pg = Math.floor(a/4096), off = a % 4096;
  return mcqOf('Stránky mají 4096 B. Logická adresa '+fmt(a,0)+' → číslo stránky a offset?', 'stránka '+pg+', offset '+off, ['stránka '+(pg+1)+', offset '+off, 'stránka '+pg+', offset '+(4096-off), 'stránka '+off+', offset '+pg], 8);
}, 'Fyzická = báze + logická · stránka = adresa div 4096, offset = adresa mod 4096.'));
lab(8, 'Strategie přidělování', 'Přiřaď vlastnost ke strategii.', bucketLab(8, 'Strategie přidělování paměti', 'Ke které strategii vlastnost patří?', ['Souvislá oblast','Po blocích','Stránkování','Segmentace'],
  [['Bázový a limitní registr, jen 1 program',0],['MS-DOS, díry, setřásání paměti',1],['First / Best / Worst fit',1],['Stejně velké stránky a rámce, MMU',2],['Vnitřní fragmentace poslední stránky',2],['Části různé délky (kód, zásobník)',3],['Tabulka s bází a limitem každé části, vnější fragmentace',3]]));

/* ================= T9 – disk ================= */
lab(9, 'Plánování přístupu na disk', 'Klikej na požadavky v pořadí, v jakém je obslouží algoritmus.', n => {
  const ALGS = ['FCFS','SSTF','SCAN','C-SCAN','LOOK','C-LOOK']; let ALG = ALGS[0]; const MAX = 199;
  const head0 = ri(30,170); const reqs = []; while(reqs.length < 7){ const r = ri(0, MAX); if(r !== head0 && !reqs.includes(r) && Math.abs(r-head0) > 2) reqs.push(r); }
  let head = head0, pending = reqs.slice(), order = [], mistakes = 0; const path = [head0];
  const ups = reqs.filter(r => r > head0).sort((a,b) => a-b), downs = reqs.filter(r => r < head0);
  const PLANS = {FCFS: reqs.slice(), SCAN: ups.concat(downs.slice().sort((a,b) => b-a)), LOOK: ups.concat(downs.slice().sort((a,b) => b-a)),
    'C-SCAN': ups.concat(downs.slice().sort((a,b) => a-b)), 'C-LOOK': ups.concat(downs.slice().sort((a,b) => a-b))};
  let plan = null;
  function acceptable(){
    if(ALG === 'SSTF'){ const d = Math.min(...pending.map(r => Math.abs(r-head))); return pending.filter(r => Math.abs(r-head) === d); }
    return [plan[order.length]];
  }
  function moveTo(r){
    if(r < head && head >= head0 && downs.length){
      if(ALG === 'SCAN') path.push(MAX);
      if(ALG === 'C-SCAN'){ path.push(MAX); path.push(0); }
    }
    path.push(r); head = r;
  }
  function total(){ let s = 0; for(let k = 1; k < path.length; k++) s += Math.abs(path[k]-path[k-1]); return s; }
  function svg(){
    const W = 600, rowH = 22, H = 40 + (path.length+1)*rowH, x = v => 20 + v/MAX*(W-40);
    let s = '<svg viewBox="0 0 '+W+' '+H+'" class="chart" role="img" aria-label="Pohyb hlavičky"><line x1="20" x2="'+(W-20)+'" y1="20" y2="20" stroke="var(--copper-dim)"/>';
    [0,50,100,150,199].forEach(t => s += '<text x="'+x(t)+'" y="14" text-anchor="middle" font-size="10" fill="var(--silk-dim)">'+t+'</text>');
    reqs.forEach(r => s += '<line x1="'+x(r)+'" x2="'+x(r)+'" y1="20" y2="'+(H-6)+'" stroke="var(--copper-dim)" stroke-dasharray="2 4" opacity=".5"/>');
    s += '<polyline fill="none" stroke="var(--led-on)" stroke-width="2" points="'+path.map((p,k) => x(p)+','+(30+k*rowH)).join(' ')+'"/>';
    path.forEach((p,k) => s += '<circle cx="'+x(p)+'" cy="'+(30+k*rowH)+'" r="4" fill="'+(k===0?'var(--copper)':'var(--led-on)')+'"/><text x="'+(x(p)+7)+'" y="'+(34+k*rowH)+'" font-size="11" fill="var(--silk)">'+p+'</text>');
    return s+'</svg>';
  }
  function render(){
    labShell(9, ALG+' · hlavička na '+head0+(ALG!=='FCFS'&&ALG!=='SSTF'?' · směr nahoru (k 199)':''),
      '<p>Fronta požadavků (v pořadí příchodu): <span class="mono">'+reqs.join(', ')+'</span></p>'+svg()+
      '<p>Hlavička je na <b>'+head+'</b>. Který požadavek se obslouží teď?</p>'+
      '<div class="row">'+pending.map(r => '<button class="btn ghost pick" data-r="'+r+'">'+r+'</button>').join('')+'</div>'+
      '<p class="mono small muted" style="margin-top:10px">obslouženo: '+(order.join(' → ')||'nic')+' · chyby: '+mistakes+'</p>',
      {FCFS:'FCFS: v pořadí příchodu.', SSTF:'SSTF: vždy nejbližší požadavek k hlavičce.', SCAN:'SCAN: jede nahoru až na konec (199), pak zpět dolů.', 'C-SCAN':'C-SCAN: jede jen nahoru, na konci skočí na 0 a pokračuje nahoru.', LOOK:'LOOK: jako SCAN, ale otočí se u posledního požadavku.', 'C-LOOK':'C-LOOK: jako C-SCAN, ale skočí rovnou na nejnižší požadavek.'}[ALG]);
    $$('.pick').forEach(b => b.onclick = () => {
      const r = +b.dataset.r, ok = acceptable();
      if(ok.includes(r)){ beep('ok'); moveTo(r); order.push(r); pending.splice(pending.indexOf(r),1); if(!pending.length){ lvMark(9, 'Plánování přístupu na disk', ALGS.indexOf(ALG)); return labDone(9, ALG+' hotovo', [[total(), 'pohyb hlavičky (stop)'], [mistakes, 'chyby']], Math.max(8, 30 - mistakes*4), () => LABS[9][0].run(9), svg()); } render(); }
      else { mistakes++; beep('bad'); flash(b,'err'); toast('Podle '+ALG+' teď přijde '+ok.join(' nebo ')); }
    });
  }
  levelPick(9, 'Plánování přístupu na disk', ALGS.map(a => [a, {"FCFS": "v pořadí příchodu", "SSTF": "nejbližší požadavek", "SCAN": "výtah – až na kraj a zpět", "C-SCAN": "jedním směrem, skok na začátek", "LOOK": "jako SCAN, otočí se u posledního", "C-LOOK": "jako C-SCAN, skok k nejnižšímu požadavku"}[a]]), k => { ALG = ALGS[k]; plan = PLANS[ALG]; render(); }, 'Vyber plánovací algoritmus. Fronta požadavků a poloha hlavičky se pokaždé vygenerují nové.');
});
lab(9, 'Rotační latence', 'Spočítej průměrnou latenci z otáček.', calcLab(9, 'Rotační latence', () => {
  const rpm = [4200,5400,7200,10000,15000][ri(0,4)], lat = 60000/rpm/2;
  return mcqOf('Disk má '+fmt(rpm,0)+' ot./min. Jaká je průměrná rotační latence?', fmt(lat,2)+' ms', [fmt(lat*2,2)+' ms', fmt(lat/2,2)+' ms', fmt(60/rpm*1000*3,2)+' ms'], 9);
}, 'Jedna otáčka = 60 000 / RPM ms; průměrná latence je polovina otáčky (7200 ot./min → 4,17 ms).'));
lab(9, 'Metody přidělování místa', 'Roztřiď vlastnosti metod alokace.', bucketLab(9, 'Přidělování místa na disku', 'Ke které metodě vlastnost patří?', ['Spojité','Řetězcové (seznam, FAT)','Indexová alokace'],
  [['Soubor v souvislém bloku, zná se začátek a délka',0],['Problém s rostoucími soubory, nutná defragmentace',0],['Bloky propojené ukazateli, konec EOF',1],['FAT12/16/32',1],['Indexový blok se seznamem adres',2],['Položky inicializované na −1',2],['UNIX i-nody',2]]));

/* ================= T10 – sítě ================= */
lab(10, 'Zapouzdření dat', 'Postav rámec od dat po bity.', orderLab(10, 'Zapouzdření dat', 'Odesílatel posílá webovou stránku. Seřaď kroky zapouzdření.', ['Aplikační vrstvy: uživatelská data (HTTP)','Transportní: přidá TCP/UDP hlavičku → segment','Síťová: přidá IP hlavičku → paket','Linková: přidá MAC hlavičku a patičku s CRC → rámec','Fyzická: převede rámec na bity a signál']));
lab(10, 'Vrstvy ISO/OSI', 'Seřaď vrstvy od fyzické po aplikační.', orderLab(10, 'Vrstvy ISO/OSI', 'Seřaď vrstvy ISO/OSI od nejnižší (1) po nejvyšší (7).', ['Fyzická','Linková','Síťová','Transportní','Relační','Prezentační','Aplikační']));
lab(10, 'Na které vrstvě?', 'Přiřaď protokol nebo zařízení k vrstvě OSI.', bucketLab(10, 'Na které vrstvě OSI?', 'Kam věc patří?', ['1 Fyzická','2 Linková','3 Síťová','4 Transportní','5 Relační','6 Prezentační','7 Aplikační'],
  [['Kabel, hub, bity',0],['MAC adresa, switch, rámec',1],['IP adresa, router, paket',2],['TCP a UDP, segment',3],['Navázání a ukončení relace',4],['Šifrování a komprese dat',5],['HTTP, FTP, DNS, DHCP',6]]));
lab(10, 'Způsob komunikace', 'Unicast, broadcast, multicast, anycast.', bucketLab(10, 'Způsob komunikace', 'Jak se data posílají?', ['Unicast','Broadcast','Multicast','Anycast'],
  [['Načtení webové stránky',0],['E-mail, VoIP hovor',0],['DHCP žádost o IP adresu',1],['ARP dotaz',1],['IPTV a online rádio',2],['Videokonference',2],['Dotaz na 8.8.8.8 jde na nejbližší server',3],['CDN',3]]));
lab(10, 'Přímý, nebo křížený kabel?', 'Vyber správný kabel.', bucketLab(10, 'Přímý, nebo křížený kabel?', 'Jaký kabel použiješ?', ['Přímý','Křížený'],
  [['PC – switch',0],['Router – switch',0],['PC – hub',0],['PC – PC',1],['Switch – switch',1],['Router – router',1],['PC – router',1]]));

/* ================= T11 – VLSM ================= */
lab(11, 'Návrh VLSM', 'Rozděl síť /24 pro několik LAN – prefixy a adresy sítí.', n => {
  const X = ri(1,254); let need;
  do { need = shuffle([120,100,60,50,30,28,25,20,14,12,10,6,5])
        .slice(0,4).concat([2]).sort((a,b) => b-a); }
  while(need.reduce((s,h) => s + 2**Math.ceil(Math.log2(h+2)), 0) > 256);
  const names = need.map((h,i) => h === 2 ? 'WAN spoj' : 'LAN '+String.fromCharCode(65+i));
  let addr = 0; const sol = need.map(h => { const sz = 2**Math.ceil(Math.log2(h+2)); const p = 32 - Math.log2(sz); const net = addr; addr += sz; return {p, net, sz}; });
  labShell(11, 'Návrh VLSM · 192.168.'+X+'.0/24',
    '<p>Rozděl síť <b>192.168.'+X+'.0/24</b>. Sítě už jsou seřazené od největší (tak se VLSM navrhuje). Ke každé zvol prefix a poslední oktet adresy sítě.</p>'+
    '<div class="tblwrap"><table class="tbl vlsm"><tr><th>Síť</th><th>Potřebných hostů</th><th>Prefix</th><th>Adresa sítě</th><th>Výsledek</th></tr>'+
    need.map((h,i) => '<tr><td>'+names[i]+'</td><td>'+h+'</td><td><select id="p'+i+'">'+[24,25,26,27,28,29,30].map(p => '<option value="'+p+'">/'+p+'</option>').join('')+'</select></td>'+
      '<td class="mono">192.168.'+X+'.<input id="a'+i+'" type="number" min="0" max="255" inputmode="numeric" class="oct"></td><td id="r'+i+'"></td></tr>').join('')+'</table></div>'+
    '<div class="vlmap"><div class="vlh"><span>Adresní prostor 192.168.'+X+'.0 – .255</span><b id="vlfree"></b></div><div class="vlbar" id="vlbar"></div><div class="vlax">'+[0,32,64,96,128,160,192,224,256].map(v => '<span style="left:'+(v/256*100)+'%">.'+(v === 256 ? 255 : v)+'</span>').join('')+'</div></div>'+
    '<div class="row" style="margin-top:14px"><button class="btn" id="chk">Zkontrolovat</button></div>',
    'Velikost bloku = nejbližší mocnina 2 ≥ hosti + 2. První síť začíná na .0, každá další hned za předchozí.');
  const VC = ['#7fd3ff','#f3cd7e','#c39bff','#ff8a7e','#61e38c','#5fe0c8'];
  let checked = false;
  function drawMap(){
    const blocks = need.map((h,i) => { const pp = +$('#p'+i).value, sz = 2 ** (32 - pp), a = $('#a'+i).value === '' ? null : +$('#a'+i).value; return {i, pp, sz, a, h}; });
    let used = 0;
    $('#vlbar').innerHTML = blocks.filter(b => b.a != null && b.a >= 0 && b.a <= 255).map(b => {
      const over = blocks.some(o => o !== b && o.a != null && o.a < b.a + b.sz && b.a < o.a + o.sz), mis = b.a % b.sz !== 0, out = b.a + b.sz > 256, small = b.sz - 2 < b.h;
      used += b.sz;
      return '<div class="vlb'+(over || out ? ' bad' : '')+(mis ? ' mis' : '')+'" style="left:'+(b.a/256*100)+'%;width:'+(Math.min(b.sz, 256 - b.a)/256*100)+'%;--vc:'+VC[b.i % VC.length]+'" title="'+names[b.i]+'"><b>'+names[b.i].replace('LAN ','').replace(' spoj','')+'</b><span>/'+b.pp+'</span>'+(small ? '<i>málo</i>' : '')+'</div>';
    }).join('');
    const cov = new Set(); blocks.forEach(b => { if(b.a != null && b.a >= 0) for(let k = b.a; k < Math.min(256, b.a + b.sz); k++) cov.add(k); });
    $('#vlfree').textContent = 'obsazeno '+cov.size+' z 256 adres';
    if(!checked) blocks.forEach(b => { $('#r'+b.i).innerHTML = '<span class="mono small '+(b.sz - 2 < b.h ? 'vlbad' : 'muted')+'">blok '+b.sz+' adres · '+Math.max(0, b.sz - 2)+' hostů'+(b.sz - 2 < b.h ? ' (málo)' : '')+'</span>'; });
  }
  need.forEach((_,i) => { $('#p'+i).onchange = drawMap; $('#a'+i).oninput = drawMap; });
  drawMap();
  $('#chk').onclick = () => {
    checked = true;
    let good = 0;
    need.forEach((h,i) => {
      const p = +$('#p'+i).value, a = $('#a'+i).value === '' ? -1 : +$('#a'+i).value, s = sol[i];
      const okP = p === s.p, okA = a === s.net; good += okP + okA;
      $('#r'+i).innerHTML = '<span style="color:'+(okP&&okA?'var(--ok)':'var(--bad)')+'">'+(okP&&okA?'✓ ':'✗ ')+'</span><span class="mono small">.'+s.net+'/'+s.p+' · hosti .'+(s.net+1)+'–.'+(s.net+s.sz-2)+' · bc .'+(s.net+s.sz-1)+'</span>';
    });
    beep(good === need.length*2 ? 'ok' : 'bad');
    const fin = $('#chk'); fin.textContent = 'Dokončit'; fin.onclick = () => labDone(11, good === need.length*2 ? 'Návrh je správně' : 'Návrh zkontrolován', [[good+'/'+need.length*2, 'správných polí']], good*3, () => LABS[11][0].run(11));
  };
});
lab(11, 'Sumarizace', 'Sluč sítě do jedné souhrnné trasy.', calcLab(11, 'Sumarizace', () => {
  const k = [2,4,8][ri(0,2)], bits = Math.log2(k), A = ri(0, Math.floor(255/k)-1)*k, b = ri(10,250);
  const nets = Array.from({length:k}, (_,i) => '10.'+b+'.'+(A+i)+'.0/24');
  return mcqOf('Sumarizuj sítě '+nets[0]+' až '+nets[k-1]+' ('+k+' sítí).', '10.'+b+'.'+A+'.0/'+(24-bits), ['10.'+b+'.'+A+'.0/'+(24-bits+1), '10.'+b+'.'+A+'.0/'+(24-bits-1), '10.'+b+'.'+(A+k-1)+'.0/'+(24-bits)], 11);
}, 'Sloučení 2ⁿ sousedních sítí /24 → prefix /(24 − n), adresa = první síť bloku.'));
lab(11, 'Směrovací protokoly', 'Přiřaď vlastnost k protokolu.', bucketLab(11, 'Směrovací protokoly', 'Kterému protokolu vlastnost patří?', ['RIP','IGRP','EIGRP','OSPF'],
  [['Metrika hop count, max. 15 skoků',0],['Celé tabulky každých 30 s',0],['Cisco distance-vector, aktualizace po 90 s',1],['Max. 255 skoků, AD 100',1],['Hybridní, algoritmus DUAL',2],['Aktualizace jen při změně',2],['Link-state, area 0 (backbone)',3],['Hello pakety každých 10 s, metrika cost',3]]));

/* ================= T12 – terminál ================= */
lab(12, 'Unixový terminál', 'Splň úkoly v simulovaném shellu (cd, ls, cat, chmod, grep, mv…).', n => {
  const HOME = '/home/student';
  const F = (c, m) => ({t:'f', c, m: m || 644}); const D = (k) => ({t:'d', k, m:755});
  const fs = D({ bin: D({ls:F('',755), cp:F('',755), mv:F('',755), cat:F('',755)}),
    etc: D({ passwd:F('root:x:0:0:root:/root:/bin/bash\nstudent:x:1000:1000:Student:/home/student:/bin/bash\nftp:x:14:50:FTP:/var/ftp:/sbin/nologin'),
      hosts:F('127.0.0.1   localhost\n192.168.1.10  server.skola.cz server'), vsftpd: D({'vsftpd.conf':F('anonymous_enable=NO\nlocal_enable=YES\nwrite_enable=YES')}) }),
    home: D({ student: D({ dokumenty: D({'poznamky.txt':F('maturita: unix, fat, ntfs')}), 'skript.sh':F('#!/bin/bash\necho "Ahoj"', 644) }) }),
    tmp: D({}), var: D({ log: D({ syslog:F('boot ok\nsshd started\nvsftpd started') }) }), dev: D({sda:F(''), tty:F('')}) });
  let cwd = HOME; const out = ['Vítej v simulovaném shellu. Napiš help pro seznam příkazů.']; const flags = {};
  const tasks = [
    ['Zjisti, ve kterém adresáři právě jsi.', () => flags.pwd],
    ['Přejdi do adresáře /etc.', () => cwd === '/etc'],
    ['Vypiš obsah souboru hosts.', () => flags.cathosts],
    ['Najdi v souboru /etc/passwd řádek se slovem student pomocí grep.', () => flags.grepstudent],
    ['Vrať se do domovského adresáře.', () => cwd === HOME],
    ['Vytvoř adresář projekt.', () => !!node(HOME+'/projekt')],
    ['Nastav souboru skript.sh práva rwxr-xr-x.', () => (node(HOME+'/skript.sh')||{}).m === 755],
    ['Přesuň poznamky.txt z adresáře dokumenty do adresáře projekt.', () => !!node(HOME+'/projekt/poznamky.txt') && !node(HOME+'/dokumenty/poznamky.txt')]
  ];
  let ti = 0; const t0 = Date.now(); let cmds = 0;
  function norm(p){
    if(!p) return cwd; if(p === '~' || p.startsWith('~/')) p = HOME + p.slice(1);
    const parts = (p.startsWith('/') ? p : cwd + '/' + p).split('/'); const st = [];
    parts.forEach(x => { if(!x || x === '.') return; if(x === '..') st.pop(); else st.push(x); });
    return '/' + st.join('/');
  }
  function node(p){ let cur = fs; if(p === '/') return cur; for(const x of p.split('/').filter(Boolean)){ if(!cur || cur.t !== 'd' || !cur.k[x]) return null; cur = cur.k[x]; } return cur; }
  function parent(p){ const i = p.lastIndexOf('/'); return [i <= 0 ? '/' : p.slice(0,i), p.slice(i+1)]; }
  function modeStr(nd){ const m = String(nd.m).padStart(3,'0'); const r = d => ((+d&4)?'r':'-')+((+d&2)?'w':'-')+((+d&1)?'x':'-'); return (nd.t==='d'?'d':'-')+r(m[0])+r(m[1])+r(m[2]); }
  function exec(line, input){
    const a = line.trim().split(/\s+/).filter(Boolean); const c = a[0]; const arg = a.slice(1);
    const err = s => { throw new Error(s); };
    switch(c){
      case undefined: return '';
      case 'help': return 'Příkazy: pwd, ls [-l] [cesta], cd [cesta], cat soubor, mkdir adr, touch soubor, rm [-r] cesta, cp zdroj cíl, mv zdroj cíl, chmod 755 soubor, grep vzor [soubor], head/tail -n N soubor, echo text, whoami, ps, clear. Funguje i roura |.';
      case 'pwd': flags.pwd = true; return cwd;
      case 'whoami': return 'student';
      case 'ps': return '  PID TTY      CMD\n 1021 pts/0    bash\n 1088 pts/0    ps';
      case 'echo': return arg.join(' ').replace(/^["']|["']$/g,'');
      case 'clear': out.length = 0; return null;
      case 'ls': {
        const L = arg.includes('-l') || arg.includes('-al') || arg.includes('-la'); const p = norm(arg.find(x => !x.startsWith('-'))); const nd = node(p);
        if(!nd) err('ls: nelze přistoupit k '+p+': Adresář nebo soubor neexistuje');
        if(nd.t === 'f') return p.split('/').pop();
        return Object.keys(nd.k).sort().map(k => L ? modeStr(nd.k[k])+' student student '+k : k+(nd.k[k].t==='d'?'/':'')).join(L ? '\n' : '  ');
      }
      case 'cd': { const p = norm(arg[0] || '~'); const nd = node(p); if(!nd || nd.t !== 'd') err('cd: '+(arg[0]||'')+': Adresář neexistuje'); cwd = p; return ''; }
      case 'cat': { if(!arg.length) return input || ''; const p = norm(arg[0]); const nd = node(p); if(!nd) err('cat: '+arg[0]+': Soubor neexistuje'); if(nd.t==='d') err('cat: '+arg[0]+': Je adresář'); if(p === '/etc/hosts') flags.cathosts = true; return nd.c; }
      case 'head': case 'tail': { const k = arg.indexOf('-n'); const N = k >= 0 ? +arg[k+1] : 10; const f = arg.filter((x,i) => i !== k && i !== k+1)[0]; let txt = input || ''; if(f){ const nd = node(norm(f)); if(!nd || nd.t!=='f') err(c+': '+f+': Soubor neexistuje'); txt = nd.c; } const ls = txt.split('\n'); return (c==='head' ? ls.slice(0,N) : ls.slice(-N)).join('\n'); }
      case 'grep': { const pat = (arg[0]||'').replace(/^["']|["']$/g,''); let txt = input || ''; if(arg[1]){ const p = norm(arg[1]); const nd = node(p); if(!nd || nd.t!=='f') err('grep: '+arg[1]+': Soubor neexistuje'); txt = nd.c; if(p === '/etc/passwd' && pat === 'student') flags.grepstudent = true; } else if(input && input.includes('student:x:1000') && pat === 'student') flags.grepstudent = true; return txt.split('\n').filter(l => l.includes(pat)).join('\n'); }
      case 'mkdir': { if(!arg[0]) err('mkdir: chybí operand'); const p = norm(arg[0]); const [pp, nm] = parent(p); const pn = node(pp); if(!pn || pn.t!=='d') err('mkdir: nelze vytvořit '+arg[0]); if(pn.k[nm]) err('mkdir: '+arg[0]+' už existuje'); pn.k[nm] = D({}); return ''; }
      case 'touch': { const p = norm(arg[0]); const [pp, nm] = parent(p); const pn = node(pp); if(!pn) err('touch: nelze'); if(!pn.k[nm]) pn.k[nm] = F(''); return ''; }
      case 'rm': { const r = arg.includes('-r') || arg.includes('-rf'); const t = arg.find(x => !x.startsWith('-')); const p = norm(t); const nd = node(p); if(!nd) err('rm: '+t+': neexistuje'); if(nd.t==='d' && !r) err('rm: '+t+': je adresář (použij -r)'); const [pp, nm] = parent(p); delete node(pp).k[nm]; return ''; }
      case 'cp': case 'mv': {
        if(arg.length < 2) err(c+': chybí operand'); const s = norm(arg[0]); const sn = node(s); if(!sn) err(c+': '+arg[0]+': neexistuje');
        let d = norm(arg[1]); const dn = node(d); if(dn && dn.t === 'd') d = d + '/' + s.split('/').pop();
        const [dp, dnm] = parent(d); const dpn = node(dp); if(!dpn || dpn.t!=='d') err(c+': cílový adresář neexistuje');
        dpn.k[dnm] = c === 'cp' ? JSON.parse(JSON.stringify(sn)) : sn; if(c === 'mv'){ const [sp, snm] = parent(s); delete node(sp).k[snm]; } return '';
      }
      case 'chmod': { const m = arg[0]; const p = norm(arg[1]); const nd = node(p); if(!nd) err('chmod: '+arg[1]+': neexistuje'); if(/^[0-7]{3}$/.test(m)) nd.m = +m; else if(m === '+x' || m === 'a+x' || m === 'u+x'){ const s = String(nd.m).padStart(3,'0').split('').map(Number); const idx = m === 'u+x' ? [0] : [0,1,2]; idx.forEach(i => s[i] |= 1); nd.m = +s.join(''); } else err('chmod: neplatný režim '+m+' (použij např. 755)'); return ''; }
      case 'man': return (arg[0]||'?')+': viz help – v tomto simulátoru je zkrácená nápověda.';
      default: err(c+': příkaz nenalezen');
    }
  }
  function run(line){
    cmds++; out.push('<span class="pr">student@maturita:'+esc(cwd.replace(HOME,'~'))+'$</span> '+esc(line));
    try{ let data = undefined; for(const part of line.split('|')){ const r = exec(part, data); if(r === null) { data = null; break; } data = r; } if(data) out.push(esc(data)); }
    catch(e){ out.push('<span class="er">'+esc(e.message)+'</span>'); beep('bad'); }
    let progressed = false; while(ti < tasks.length && tasks[ti][1]()){ ti++; progressed = true; }
    if(progressed){ beep('ok'); if(ti >= tasks.length){ const s = Math.round((Date.now()-t0)/1000); return labDone(12, 'Všechny úkoly splněny', [[cmds, 'příkazů'], [s+' s', 'čas']], 40, () => LABS[12][0].run(12)); } }
    render();
  }
  function render(){
    labShell(12, 'Unixový terminál',
      '<div class="tasks">'+tasks.map((t,k) => '<div class="task'+(k<ti?' done':(k===ti?' cur':''))+'"><span>'+(k<ti?'✓':(k+1))+'</span>'+esc(t[0])+'</div>').join('')+'</div>'+
      '<div class="termwin" id="term"><div class="tout">'+out.slice(-60).join('\n')+'</div><div class="tin"><span class="pr">student@maturita:'+esc(cwd.replace(HOME,'~'))+'$</span><input id="cmd" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Příkaz"></div></div>',
      'Enter spustí příkaz · šipka nahoru vrátí předchozí příkaz · help vypíše příkazy.');
    const inp = $('#cmd'); inp.focus({preventScroll:true}); const term = $('#term'); term.scrollTop = term.scrollHeight;
    term.onclick = () => inp.focus();
    let hi = hist.length;
    inp.onkeydown = e => {
      if(e.key === 'Enter'){ e.preventDefault(); const v = inp.value; if(v.trim()) hist.push(v); run(v); }
      else if(e.key === 'ArrowUp'){ e.preventDefault(); if(hi > 0){ hi--; inp.value = hist[hi]; } }
      else if(e.key === 'ArrowDown'){ e.preventDefault(); if(hi < hist.length-1){ hi++; inp.value = hist[hi]; } else { hi = hist.length; inp.value = ''; } }
    };
  }
  const hist = [];
  render();
});
lab(12, 'Kam to patří?', 'Přiřaď obsah k adresáři UNIXu.', bucketLab(12, 'Adresářová struktura', 'Ve kterém adresáři to najdeš?', ['/etc','/dev','/bin','/sbin','/var','/home','/tmp','/mnt'],
  [['Konfigurace sítě a služeb',0],['vsftpd.conf',0],['Soubor reprezentující disk sda',1],['Příkazy ls, cp, cat',2],['fsck, reboot (pro roota)',3],['Logy a fronty tiskáren',4],['Domovské adresáře uživatelů',5],['Dočasné soubory, mažou se po restartu',6],['Připojení externího disku',7]]));
lab(12, 'Život procesu', 'Seřaď fork, exec, exit, wait.', orderLab(12, 'Život procesu v UNIXu', 'Seřaď životní cyklus procesu potomka.', ['fork() – vznikne kopie rodiče','exec() – načte se nový program','Proces běží','exit() – potomek skončí s návratovým kódem','Stav ZOMBIE','wait() – rodič sklidí potomka']));
lab(12, 'Porty služeb', 'Přiřaď službu k portu.', bucketLab(12, 'Porty služeb', 'Na jakém portu služba běží?', ['20/21','22','23','53','67/68'],
  [['FTP',0],['SSH',1],['scp / sftp',1],['Telnet',2],['DNS',3],['DHCP',4]]));

/* ================= T13 ================= */
lab(13, 'Geometrie a adresace', 'Počítej kapacitu z CHS, CHS → LBA a latenci.', calcLab(13, 'Geometrie HDD', () => {
  const t = ri(0,1);
  if(t === 0){ const C = [1024,2048,4096,16383][ri(0,3)], H = [4,8,16][ri(0,2)], S = 63; const cap = C*H*S*512;
    return mcqOf('Disk má C = '+C+', H = '+H+', S = '+S+', sektor 512 B. Kapacita?', fmt(cap/1048576,1)+' MiB', [fmt(cap/1048576/2,1)+' MiB', fmt(cap/1048576*2,1)+' MiB', fmt(C*H*S/1024,1)+' MiB'], 13); }
  const H = 16, S = 63, c = ri(0,20), h = ri(0,15), s = ri(1,63); const lba = (c*H + h)*S + (s-1);
  return mcqOf('Geometrie H = 16, S = 63. Jaká je LBA adresa pro CHS ('+c+', '+h+', '+s+')?', fmt(lba,0), [fmt(lba+1,0), fmt((c*H + h)*S + s + 1,0), fmt(c*H*S + h + s,0)], 13);
}, 'Kapacita = C × H × S × 512 B · LBA = (C × H + h) × S + (s − 1); proto CHS 0,0,1 = LBA 0.'));
lab(13, 'Záznamové technologie', 'Přiřaď popis k technologii.', bucketLab(13, 'Záznamové technologie', 'O kterou technologii jde?', ['LMR','PMR','SMR','HAMR','MAMR'],
  [['Domény rovnoběžně s povrchem',0],['Paramagnetismus omezuje hustotu',0],['Kolmé domény, stabilizační vrstva',1],['Až 5× hustota oproti podélnému zápisu',1],['Stopy se překrývají jako šindele',2],['Pomalý přepis, vhodné na archivy',2],['Laser ohřeje místo před zápisem',3],['Spin-torque oscilátor, mikrovlny',4]]));
lab(13, 'Kódování dat', 'Seřaď kódování od nejstaršího.', orderLab(13, 'Vývoj kódování dat na HDD', 'Seřaď kódování od nejstaršího (nejméně úsporného) po nejmodernější.', ['FM','MFM (úspora ~20 % oproti FM)','RLL (úspora ~50 % oproti MFM)','PRML / EPRML (odhad nejpravděpodobnějšího bitu)']));

/* ================= T14 – MBR hex ================= */
lab(14, 'MBR v hex editoru', 'Jako v DiskEditu: najdi v 512 B sektoru tabulku oddílů, aktivní příznak a signaturu.', n => {
  const B = new Uint8Array(512); let seed = 7; const rnd = () => (seed = (seed*1103515245 + 12345) & 0x7fffffff) & 255;
  for(let i = 0; i < 446; i++) B[i] = rnd();
  const msg = 'Invalid partition table.Error loading operating system.Missing operating system.';
  for(let i = 0; i < msg.length; i++) B[0x163 + i] = msg.charCodeAt(i);
  const le = (o, v) => { for(let k = 0; k < 4; k++) B[o+k] = (v >>> (8*k)) & 255; };
  const t2 = [0x07, 0x0C, 0x83][ri(0,2)];
  const e1 = 0x1BE, e2 = 0x1CE; const s1 = 2048, n1 = ri(100,400)*2048*256, s2 = s1 + n1, n2 = ri(50,300)*2048*256;
  B.set([0x80, 0x20, 0x21, 0x00, 0x07, 0xFE, 0xFF, 0xFF], e1); le(e1+8, s1); le(e1+12, n1);
  B.set([0x00, 0xFE, 0xFF, 0xFF, t2, 0xFE, 0xFF, 0xFF], e2); le(e2+8, s2); le(e2+12, n2);
  B[0x1FE] = 0x55; B[0x1FF] = 0xAA;
  const TASKS = [
    ['Klikni na boot signaturu (konec MBR).', [0x1FE, 0x1FF], 'Signatura 55 AA na offsetu 0x1FE–0x1FF.'],
    ['Klikni na první bajt tabulky oddílů (PaT).', [0x1BE], 'PaT začíná za 446 B zaváděcího kódu, offset 0x1BE.'],
    ['Klikni na příznak aktivního (bootovacího) oddílu.', [0x1BE], 'První záznam, bajt 0: 80h = aktivní.'],
    ['Klikni na typ prvního oddílu (07h = NTFS).', [0x1C2], 'Bajt 4 záznamu: offset 0x1BE + 4 = 0x1C2.'],
    ['Klikni na typ druhého oddílu.', [0x1D2], 'Druhý záznam začíná na 0x1CE, typ je na 0x1D2.'],
    ['Klikni na začátek LBA adresy prvního oddílu (bajty 8–11 záznamu).', [0x1C6,0x1C7,0x1C8,0x1C9], 'LBA začátku na 0x1C6, little-endian (00 08 00 00 = 2048).']
  ];
  let ti = 0, mistakes = 0; const found = new Set();
  const TYP = {0x07:'NTFS / exFAT', 0x0C:'FAT32 (LBA)', 0x83:'Linux'};
  const hx2 = v => v.toString(16).toUpperCase().padStart(2,'0')+'h';
  function reg(o){
    if(ti >= 1 && o >= 0x1FE) return ' rsig';
    if(ti >= 2 && o >= 0x1BE && o < 0x1FE) return ' rpt e'+Math.floor((o - 0x1BE) / 16);
    if(ti >= 2 && o < 0x1BE) return ' rboot';
    return '';
  }
  function side(){
    const blk = (cls, t, sz, on) => '<div class="mbrb '+cls+(on ? ' on' : '')+'"><b>'+t+'</b><span>'+sz+'</span></div>';
    let h = '<div class="mbrmap"><h4>Mapa sektoru (512 B)</h4>'+blk('boot', 'zaváděcí kód', '0x000–0x1BD · 446 B', ti >= 2)+
      '<div class="mbrpt'+(ti >= 2 ? ' on' : '')+'"><span class="mbrl">tabulka oddílů · 0x1BE · 64 B</span>'+[0,1,2,3].map(k => '<div class="mbre e'+k+'">záznam '+(k+1)+' <em>0x'+(0x1BE + k*16).toString(16).toUpperCase()+'</em></div>').join('')+'</div>'+
      blk('sig', 'signatura 55 AA', '0x1FE–0x1FF · 2 B', ti >= 1)+'</div>';
    const f = (lbl, val, show) => '<tr><td>'+lbl+'</td><td>'+(show ? val : '<span class="muted">?</span>')+'</td></tr>';
    const lba = (o) => B[o] | (B[o+1] << 8) | (B[o+2] << 16) | (B[o+3] << 24);
    h += '<div class="mbrdec"><h4>Rozbor záznamů</h4><table class="tbl mbrt"><tr><th></th><th>záznam 1</th><th>záznam 2</th></tr>'+
      '<tr><td>aktivní (bajt 0)</td><td>'+(ti >= 3 ? hx2(B[0x1BE])+' → ano' : '?')+'</td><td>'+(ti >= 3 ? hx2(B[0x1CE])+' → ne' : '?')+'</td></tr>'+
      '<tr><td>typ (bajt 4)</td><td>'+(ti >= 4 ? hx2(B[0x1C2])+' → '+TYP[B[0x1C2]] : '?')+'</td><td>'+(ti >= 5 ? hx2(B[0x1D2])+' → '+TYP[B[0x1D2]] : '?')+'</td></tr>'+
      '<tr><td>LBA začátku (8–11)</td><td>'+(ti >= 6 ? lba(0x1C6).toLocaleString('cs-CZ') : '?')+'</td><td>'+(ti >= 6 ? lba(0x1D6).toLocaleString('cs-CZ') : '?')+'</td></tr>'+
      '<tr><td>sektorů (12–15)</td><td>'+(ti >= 6 ? (lba(0x1CA) >>> 0).toLocaleString('cs-CZ') : '?')+'</td><td>'+(ti >= 6 ? (lba(0x1DA) >>> 0).toLocaleString('cs-CZ') : '?')+'</td></tr></table></div>';
    return h;
  }
  function render(){
    let rows = '';
    for(let r = 0; r < 32; r++){
      let hx = '', asc = '';
      for(let c = 0; c < 16; c++){ const o = r*16 + c, v = B[o]; hx += '<button class="hb'+(found.has(o)?' fnd':'')+reg(o)+'" data-o="'+o+'">'+v.toString(16).toUpperCase().padStart(2,'0')+'</button>'; asc += (v >= 32 && v < 127) ? esc(String.fromCharCode(v)) : '.'; }
      rows += '<div class="hrow"><span class="ho">'+(r*16).toString(16).toUpperCase().padStart(4,'0')+'</span><span class="hx">'+hx+'</span><span class="ha">'+asc+'</span></div>';
    }
    labShell(14, 'MBR v hex editoru', '<p><b>Úkol '+(ti+1)+'/'+TASKS.length+':</b> '+TASKS[ti][0]+'</p><div class="mbrx"><div><div class="hex">'+rows+'</div><p class="mono small hoff" id="hoff">Najeď myší na bajt – uvidíš jeho offset.</p></div><div class="mbrside">'+side()+'</div></div><p class="mono small muted" style="margin-top:10px">chyby: '+mistakes+'</p>',
      'MBR = 446 B zaváděcí kód + 4 × 16 B tabulka oddílů + 2 B signatura. Záznam: 0 aktivní, 1–3 CHS začátek, 4 typ, 5–7 CHS konec, 8–11 LBA začátek, 12–15 počet sektorů.');
    $$('.hb').forEach(b => b.onmouseenter = () => { const o = +b.dataset.o; $('#hoff').innerHTML = 'offset <b>0x'+o.toString(16).toUpperCase().padStart(3,'0')+'</b> = '+o+' · řádek 0x'+(o & ~15).toString(16).toUpperCase().padStart(4,'0')+' + '+(o & 15)+' · hodnota '+hx2(B[o]); });
    $$('.hb').forEach(b => b.onclick = () => {
      const o = +b.dataset.o;
      if(TASKS[ti][1].includes(o)){ TASKS[ti][1].forEach(x => found.add(x)); beep('ok'); toast(TASKS[ti][2]); lvMark(14, 'MBR v hex editoru', ti); ti++;
        if(ti >= TASKS.length) return labDone(14, 'MBR přečtený', [[TASKS.length - from, 'úkolů'], [mistakes, 'chyby'], [(n1/2048).toLocaleString('cs-CZ')+' MiB', 'velikost oddílu 1']], Math.round(Math.max(8, 36 - mistakes*4) * (TASKS.length - from) / TASKS.length), () => LABS[14][0].run(14), '<div class="mbrside" style="margin-top:16px">'+side()+'</div>');
        render(); }
      else { mistakes++; beep('bad'); flash(b,'err'); toast('Tohle je offset 0x'+o.toString(16).toUpperCase()); }
    });
  }
  let from = 0;
  levelPick(14, 'MBR v hex editoru', TASKS.map((t, k) => [['Boot signatura','Začátek tabulky oddílů','Aktivní oddíl','Typ 1. oddílu','Typ 2. oddílu','Začátek 1. oddílu (LBA)'][k], t[0]]), k => { from = k; ti = k; found.clear(); TASKS.slice(0, k).forEach(t => t[1].forEach(x => found.add(x))); render(); });
});
lab(14, 'RAID: kapacita a přežití', 'Spočítej kapacitu pole a rozhodni, jestli přežije výpadek.', calcLab(14, 'RAID', () => {
  const lv = [0,1,5,6,10][ri(0,4)], s = [1,2,4][ri(0,2)];
  const nd = {0:ri(2,4), 1:2, 5:ri(3,5), 6:ri(4,6), 10:[4,6][ri(0,1)]}[lv];
  if(Math.random() < .5){ const cap = {0:nd*s, 1:s, 5:(nd-1)*s, 6:(nd-2)*s, 10:nd/2*s}[lv];
    return mcqOf('RAID '+lv+' z '+nd+' disků po '+s+' TB. Jaká je využitelná kapacita?', cap+' TB', [nd*s+' TB', (nd-1)*s+' TB', (nd/2)*s+' TB', (nd-2)*s+' TB', s+' TB'], 14); }
  let fail, surv, desc;
  if(lv === 10){ const pairs = nd/2; const a = ri(0,pairs-1); const same = Math.random() < .5; const b = same ? a : (a+1) % pairs;
    desc = same ? 'oba disky zrcadlového páru '+(a+1) : 'po jednom disku v párech '+(a+1)+' a '+(b+1); surv = !same; fail = 2; }
  else { fail = ri(1, Math.min(2, nd-1)); surv = {0:false, 1:fail < 2, 5:fail <= 1, 6:fail <= 2}[lv]; desc = fail+' '+(fail===1?'disk':'disky'); }
  const opts = ['Ano, data přežijí','Ne, data jsou ztracena']; const ans = surv ? opts[0] : opts[1];
  return {id:null, n:14, text:'RAID '+lv+' z '+nd+' disků: vypadnou '+desc+'. Přežije pole?', opts, correct:opts.indexOf(ans), ans};
}, 'RAID 0: n×s, žádná ochrana · RAID 1: zrcadlo · RAID 5: (n−1)×s, přežije 1 disk · RAID 6: (n−2)×s, přežije 2 · RAID 10: n/2×s, přežije, pokud nevypadne celý pár.'));
lab(14, 'MBR, nebo GPT?', 'Roztřiď vlastnosti tabulek oddílů.', bucketLab(14, 'MBR, nebo GPT?', 'Ke které tabulce vlastnost patří?', ['MBR','GPT'],
  [['Max. 4 primární oddíly',0],['Rozšířený oddíl a EPT',0],['Max. 2 TB',0],['Boot signatura 55 AA, BIOS',0],['128 primárních oddílů',1],['64bitová LBA',1],['Záložní kopie na konci disku',1],['Součást standardu UEFI, ESP oddíl',1]]));

/* ================= T15 – FAT ================= */
lab(15, 'Sleduj řetězec FAT', 'Podle FAT tabulky projdi clustery souboru až k EOF.', n => {
  let round = 0, mistakes = 0;
  function build(){
    const cl = shuffle(Array.from({length:22}, (_,i) => i+2)); const len = ri(4,6);
    const chain = cl.slice(0,len), other = cl.slice(len, len+5); const fat = {};
    for(let c = 2; c < 24; c++) fat[c] = '0000';
    chain.forEach((c,i) => fat[c] = i < len-1 ? chain[i+1].toString(16).toUpperCase().padStart(4,'0') : 'FFFF');
    other.forEach((c,i) => fat[c] = i < other.length-1 ? other[i+1].toString(16).toUpperCase().padStart(4,'0') : 'FFF8');
    fat[cl[len+6]] = 'FFF7';
    return {chain, fat, name:['REFERAT.TXT','FOTO.JPG','DATA.BIN','MATURA.DOC'][ri(0,3)], size: (len-1)*4096 + ri(100,4000)};
  }
  let f = build(), pos = 0;
  function render(){
    labShell(15, 'Řetězec FAT · soubor '+(round+1)+'/2',
      '<div class="fatdir"><svg viewBox="0 0 24 24" class="fati"><path d="M6 2h8l5 5v15H6z"/><path d="M14 2v5h5"/></svg><div><span class="fatl">záznam v adresáři</span><b>'+f.name+'</b></div><div><span class="fatl">první cluster</span><b>'+f.chain[0]+' <em>(0x'+f.chain[0].toString(16).toUpperCase()+')</em></b></div><div><span class="fatl">velikost</span><b>'+fmt(f.size,0)+' B</b></div></div>'+
      '<p>Klikej na buňky FAT se clustery souboru v pořadí – hodnota v buňce říká, kam soubor pokračuje.</p>'+
      '<div class="fat">'+Object.keys(f.fat).map(c => { const k = f.chain.indexOf(+c), fd = k > -1 && k < pos; return '<button class="fc'+(fd ? ' fnd' : '')+'" data-c="'+c+'"><span>cluster '+c+' (0x'+(+c).toString(16).toUpperCase()+')</span><b>'+f.fat[c]+'</b>'+(fd ? '<em class="ford">'+(k+1)+'.</em>' : '')+'</button>'; }).join('')+'</div>'+
      '<div class="fatdisk"><span class="fatl">datová oblast disku · clustery 2–23</span><div class="fdk">'+Object.keys(f.fat).map(c => { const v = f.fat[c], k = f.chain.indexOf(+c), fd = k > -1 && k < pos, t = fd ? 'mine' : v === '0000' ? 'free' : v === 'FFF7' ? 'bad' : 'used';
        return '<div class="fdc '+t+'">'+(fd ? '<em>'+(k+1)+'</em>' : '')+'<span>'+c+'</span></div>'; }).join('')+'</div><div class="fdleg"><i class="mine"></i>tvůj soubor <i class="used"></i>obsazeno <i class="free"></i>volné <i class="bad"></i>vadný</div></div>'+
      '<p class="mono small muted" style="margin-top:10px">0000 volný · FFF7 vadný · FFF8–FFFF EOF · jinak číslo dalšího clusteru (hex) · chyby: '+mistakes+'</p>', 'Hodnota v buňce clusteru říká, kde soubor pokračuje.');
    $$('.fc').forEach(b => b.onclick = () => {
      const c = +b.dataset.c;
      if(c === f.chain[pos]){ pos++; beep('ok');
        if(pos >= f.chain.length){ round++; toast('EOF – soubor zabírá '+f.chain.length+' clusterů = '+fmt(f.chain.length*4096,0)+' B na disku'); if(round >= 2) return labDone(15, 'Řetězce prošlé', [[mistakes, 'chyby']], Math.max(8, 30 - mistakes*4), () => LABS[15][0].run(15)); f = build(); pos = 0; }
        render(); }
      else { mistakes++; beep('bad'); flash(b,'err'); }
    });
  }
  render();
});
lab(15, 'FAT, nebo NTFS?', 'Roztřiď vlastnosti souborových systémů.', bucketLab(15, 'FAT, nebo NTFS?', 'Kterému systému vlastnost patří?', ['FAT/FAT32','NTFS','exFAT'],
  [['Dvě kopie alokační tabulky',0],['Max. soubor 4 GB',0],['Smazaný záznam začíná E5h',0],['MFT a metasoubory $',1],['Žurnál $LogFile, transakce',1],['ACL práva, EFS šifrování, kvóty',1],['Flash disky, soubory nad 4 GB, bitmapa volného místa',2]]));
lab(15, 'Uložení souboru na FAT', 'Seřaď kroky zápisu souboru.', orderLab(15, 'Uložení souboru na FAT', 'Seřaď, jak OS uloží soubor na FAT.', ['Najde ve FAT první volný cluster (0000)','Zapíše do něj první část dat','Najde další volný cluster a zapíše jeho číslo do FAT předchozího','Opakuje do konce souboru','Poslední cluster označí EOF (FFF8h+)','Vytvoří záznam v adresáři (jméno, atributy, čas, velikost, 1. cluster)']));
lab(15, 'Chyby FAT', 'Přiřaď popis k chybě.', bucketLab(15, 'Chyby FAT', 'O jakou chybu jde?', ['Ztracený cluster','Překřížený cluster','Poškozený FAT','Fragmentace'],
  [['Cluster obsahuje data, ale nikdo na něj neukazuje',0],['Dva soubory ukazují na stejný cluster',1],['Ukazatel míří na neexistující cluster',2],['Soubor je rozházený po disku a čte se pomalu',3]]));

/* ================= T16 ================= */
lab(16, 'Start PC s BIOSem', 'Seřaď kroky od zapnutí po OS.', orderLab(16, 'Start PC s BIOSem', 'Seřaď, co se děje od stisku tlačítka.', ['5VSB drží desku v pohotovosti','Tlačítko → PS_ON (zelený) zapne zdroj','Zdroj zapne větve +3,3 / +5 / +12 V','PW_OK (šedý) – napětí jsou stabilní','BIOS: POST','Inicializace ovladačů a výpis HW','Hledání boot zařízení podle pořadí','Načtení MBR → boot record aktivního oddílu','Zavaděč OS spustí systém']));
lab(16, 'Fáze UEFI', 'Seřaď fáze bootu UEFI.', orderLab(16, 'Fáze bootu UEFI', 'Seřaď fáze bootu UEFI.', ['PEI – CPU, RAM, chipset','DXE – paralelně ovladače (síť, disky, USB)','BDS – výběr boot zařízení','TSL – načtení zavaděče (bootx64.efi z ESP) a předání OS']));
lab(16, 'BIOS, nebo UEFI?', 'Roztřiď vlastnosti firmwaru.', bucketLab(16, 'BIOS, nebo UEFI?', 'Kterému firmwaru vlastnost patří?', ['BIOS','UEFI'],
  [['16bitový, adresuje 1 MB',0],['Jen klávesnice, modro-bílé menu',0],['Zavaděč v MBR',0],['Max. disk 2,2 TB',0],['Secure Boot',1],['GPT a ESP oddíl ve FAT32',1],['Paralelní inicializace HW',1],['Myš a grafické rozhraní, boot ze sítě',1],['CSM pro starší systémy',1]]));
lab(16, 'Napájecí konektory', 'Přiřaď konektor k zařízení.', bucketLab(16, 'Napájecí konektory', 'Co konektor napájí?', ['Základní deska','Procesor','Disky a mechaniky','Grafická karta','Disketová mechanika 3,5"'],
  [['24pin ATX',0],['ATX12V 4pin / EPS 8pin',1],['SATA Power 15pin',2],['MOLEX 4pin',2],['PCIe 6pin (75 W)',3],['PCIe 8pin (150 W)',3],['12VHPWR (ATX 3.0)',3],['Berg (mini molex)',4]]));
lab(16, 'Ochrany zdroje', 'Přiřaď zkratku k ochraně.', bucketLab(16, 'Ochrany zdroje', 'Před čím ochrana chrání?', ['Nadproud','Přepětí','Přetížení výkonu','Přehřátí','Zkrat'],
  [['OCP',0],['OVP',1],['OPP',2],['OTP',3],['SCP',4]]));

/* ================= T17 ================= */
lab(17, 'Propustnost pamětí', 'DDR výpočty: PC-označení, takty, Dual Channel.', calcLab(17, 'Propustnost pamětí', () => {
  const t = ri(0,3);
  if(t === 0){ const e = [200,266,333,400][ri(0,3)]; return mcqOf('Jaké PC-označení má modul DDR-'+e+'?', 'PC-'+[1600,2100,2700,3200][[200,266,333,400].indexOf(e)], ['PC-'+e, 'PC-'+e*4, 'PC-'+e*16], 17); }
  if(t === 1){ const e = [800,1066,1333,1600,1866,2133][ri(0,5)]; return mcqOf('Propustnost jednoho modulu DDR3-'+e+' (64 b)?', fmt(e*8,0)+' MB/s', [fmt(e,0)+' MB/s', fmt(e*4,0)+' MB/s', fmt(e*16,0)+' MB/s'], 17); }
  if(t === 2){ const e = [2400,2666,3200][ri(0,2)]; return mcqOf('DDR4-'+e+' v Dual Channel – teoretická propustnost?', fmt(e*16,0)+' MB/s', [fmt(e*8,0)+' MB/s', fmt(e*32,0)+' MB/s', fmt(e*2,0)+' MB/s'], 17); }
  const e = [200,266,333,400][ri(0,3)]; return mcqOf('Jaký je reálný takt paměti DDR-'+e+'?', fmt(e/2,1)+' MHz', [e+' MHz', e*2+' MHz', fmt(e/4,1)+' MHz'], 17);
}, 'Propustnost = efektivní frekvence × 8 B · DDR přenáší na obou hranách (reálný takt = poloviční) · Dual Channel = 2 × 64 b.'));
lab(17, 'Logická struktura paměti', 'Přiřaď adresu k oblasti.', bucketLab(17, 'Logická struktura paměti', 'Do které oblasti adresa patří?', ['Konvenční (0–640 kB)','UMA (640 kB–1 MB)','XMS (nad 1 MB)'],
  [['0x00500',0],['0x9F000',0],['0xA0000 (VGA)',1],['0xC0000 (video BIOS)',1],['0xF0000 (systémový BIOS)',1],['0x100000',2],['0x3FFFFFF',2]]));
lab(17, 'Časování DRAM', 'Seřaď parametry časování 9-9-9-24.', orderLab(17, 'Časování DRAM', 'Ve formátu 9-9-9-24 jsou parametry v tomto pořadí. Seřaď je.', ['tCL – CAS latence','tRCD – zpoždění RAS → CAS','tRP – RAS precharge','tRAS – min. doba aktivního řádku']));
lab(17, 'Generace DDR', 'Přiřaď vlastnost ke generaci.', bucketLab(17, 'Generace pamětí', 'Které generaci vlastnost patří?', ['SDR SDRAM','DDR','DDR2','DDR3','DDR4'],
  [['3,3 V, 168 pinů',0],['Jen náběžná hrana',0],['2,5 V, 184 pinů',1],['1,8 V, prefetch 4n',2],['1,5 V, prefetch 8n',3],['288 pinů, novější generace',4]]));

/* ================= T18 ================= */
lab(18, 'Navrhni chlazení', 'Podle TDP vyber chlazení.', calcLab(18, 'Návrh chlazení', () => {
  const tdp = [15,25,35,65,95,125,170,250,300][ri(0,8)];
  const opts = ['Pasivní chlazení','Aktivní vzduchové chlazení','Výkonné aktivní nebo AIO vodní','Custom vodní nebo extrémní'];
  const k = tdp < 30 ? 0 : tdp <= 95 ? 1 : tdp <= 200 ? 2 : 3;
  return {id:null, n:18, text:'Procesor má TDP '+tdp+' W. Jaké chlazení doporučují podklady?', opts, correct:k, ans:opts[k]};
}, '< 30 W pasivní · 30–95 W aktivní vzduch · 95–200 W výkonné aktivní / AIO · > 200 W custom vodní nebo extrémní.'));
lab(18, 'Cyklus heatpipe', 'Seřaď, jak heatpipe přenáší teplo.', orderLab(18, 'Cyklus heatpipe', 'Seřaď kroky přenosu tepla v heatpipe.', ['Výparník u CPU: kapalina se ohřeje a odpaří','Pára proudí k chladnějšímu konci (rozdíl tlaků)','Kondenzace u žeber – teplo přejde do chladiče','Knot vrací kapalinu kapilárními silami k výparníku']));
lab(18, 'Severní, nebo jižní most?', 'Roztřiď funkce chipsetu.', bucketLab(18, 'Severní, nebo jižní most?', 'Který most to obsluhoval?', ['Severní most (MCH)','Jižní most'],
  [['Řadič operační paměti',0],['Grafická karta (AGP)',0],['Spojení s CPU přes FSB',0],['Řadiče SATA a RAID',1],['USB a PS/2',1],['Zvuková karta a síť',1],['Paměť BIOSu',1]]));
lab(18, 'Intel, nebo AMD?', 'Přiřaď socket nebo technologii výrobci.', bucketLab(18, 'Intel, nebo AMD?', 'Čí to je?', ['Intel','AMD'],
  [['LGA 1151',0],['LGA 2011',0],['LGA 1155',0],['EIST',0],['Turbo Boost',0],['AM4',1],['AM3+',1],['FM2+',1],["Cool'n'Quiet",1]]));

/* ================= T19 ================= */
lab(19, 'Propustnost PCIe', 'Počítej rychlost podle generace a počtu linek.', calcLab(19, 'Propustnost PCIe', () => {
  const g = ri(1,6), lanes = [1,4,8,16][ri(0,3)], per = [0.25,0.5,1,2,4,8][g-1]; const both = Math.random() < .4;
  const v = per*lanes*(both?2:1);
  return mcqOf('PCIe '+g+'.0 x'+lanes+' – propustnost '+(both?'obousměrně':'jedním směrem')+'?', fmt(v,2)+' GB/s', [fmt(v*2,2)+' GB/s', fmt(v/2,2)+' GB/s', fmt(per*(both?2:1),2)+' GB/s'], 19);
}, 'Na jednu linku jedním směrem: 1.0 = 250 MB/s, každá další generace 2× · obousměrně 2×.'));
lab(19, 'Paralelní sběrnice', 'Přiřaď parametry ke sběrnici.', bucketLab(19, 'Paralelní sběrnice', 'Které sběrnici parametr patří?', ['ISA','EISA','PCI','PCI-X','AGP'],
  [['16 b, 8 MHz, max. 8 MB/s',0],['Ruční nastavení IRQ a DMA',0],['32 b při 8 MHz, až 33 MB/s',1],['33/66 MHz, 133/266 MB/s, Plug & Play',2],['64 b, 133 MHz, servery',3],['Slot jen pro grafiku, Intel 1996',4]]));
lab(19, 'Architektura PCIe', 'Přiřaď roli k prvku PCIe.', bucketLab(19, 'Architektura PCIe', 'Který prvek to dělá?', ['Root Complex','Switch','Bridge','Endpoint'],
  [['Propojuje PCIe s CPU a pamětí',0],['Větví sběrnici do více cest',1],['Převádí PCIe na PCI nebo USB',2],['Grafická karta nebo NVMe SSD',3]]));

/* ================= T20 ================= */
lab(20, 'Seřaď podle rychlosti', 'Seřaď rozhraní od nejpomalejšího.', orderLab(20, 'Seřaď podle rychlosti', 'Seřaď rozhraní od nejpomalejšího po nejrychlejší (maximální rychlost).', ['USB 1.1 (12 Mb/s)','USB 2.0 (480 Mb/s)','FireWire 800 (800 Mb/s)','SATA I (1,5 Gb/s)','SATA II (3 Gb/s)','USB 3.0 (~5 Gb/s)','SATA III (6 Gb/s)','Thunderbolt 3 (40 Gb/s)'].map(s => s)));
lab(20, 'Technologie SATA', 'Přiřaď popis k technologii.', bucketLab(20, 'Technologie SATA', 'O kterou technologii jde?', ['NCQ','Hot Swap','Staggered Spin-Up','Port Selector','Port Multiplier'],
  [['Řadič přeuspořádá požadavky pro méně pohybů hlavy',0],['Výměna disku za chodu',1],['Postupné roztáčení disků kvůli zdroji',2],['Jeden disk na dvou řadičích – redundance',3],['Více disků na jednom portu řadiče',4]]));
lab(20, 'AHCI, nebo NVMe?', 'Roztřiď vlastnosti.', bucketLab(20, 'AHCI, nebo NVMe?', 'Kam vlastnost patří?', ['AHCI (SATA)','NVMe'],
  [['Režim SATA řadiče s NCQ a hot swap',0],['Navrženo pro mechanické disky',0],['SSD komunikuje s CPU přímo přes PCIe',1],['Vysoká paralelizace požadavků',1],['~7× vyšší propustnost než SATA SSD',1]]));
lab(20, 'Zapojení IDE a USB', 'Barvy konektorů a vodičů.', bucketLab(20, 'Zapojení IDE a USB', 'Co barva znamená?', ['Master','Slave','Základní deska','+5 V','Data −','Data +','GND'],
  [['Černý konektor IDE (Cable Select)',0],['Šedý konektor IDE',1],['Modrý konektor IDE',2],['Červený vodič USB',3],['Bílý vodič USB',4],['Zelený vodič USB',5],['Černý vodič USB',6]], {art: it => {
    const nm = it[0];
    if(/IDE/.test(nm)){
      const on = /Černý/.test(nm) ? 'k' : /Šedý/.test(nm) ? 'g' : 'b', C = {b:['#2b6dd6',40,'deska'], g:['#9aa2a4',215,'slave'], k:['#16191a',320,'master']};
      let g = '<rect x="20" y="34" width="330" height="22" fill="#c9ccc6"/>'+Array.from({length:20}, (_, k) => '<path d="M20 '+(35 + k)+'H350" stroke="#a6aaa3" stroke-width=".5"/>').join('')+'<path d="M20 35H350" stroke="#c2412d" stroke-width="1.6"/>';
      Object.keys(C).forEach(k => { const [col, x, lb] = C[k], act = k === on; g += '<rect x="'+(x-18)+'" y="22" width="56" height="46" rx="4" fill="'+col+'" stroke="'+(act ? '#e0a83a' : '#555')+'" stroke-width="'+(act ? 4 : 1.2)+'" opacity="'+(act ? 1 : .45)+'"/>'; });
      return '<svg class="bkart" viewBox="0 0 370 86" aria-hidden="true">'+g+'</svg>';
    }
    const W = {Červený:'#d8392b', Bílý:'#f2f2ee', Zelený:'#2fa24a', Černý:'#16191a'}, on = Object.keys(W).find(k => nm.startsWith(k));
    let g = '<rect x="20" y="28" width="70" height="34" rx="3" fill="#b8c0be" stroke="#7d8587"/><rect x="28" y="36" width="54" height="10" fill="#2a3133"/><rect x="90" y="32" width="40" height="26" rx="4" fill="#2a3133"/>';
    Object.keys(W).forEach((k, j) => { const act = k === on, y = 18 + j * 18; g += '<path d="M130 '+(38 + j * 5)+'C190 '+(38 + j * 5)+' 200 '+y+' 330 '+y+'" fill="none" stroke="#6b5a35" stroke-width="'+(act ? 9 : 6)+'" opacity="'+(act ? .9 : .3)+'"/><path d="M130 '+(38 + j * 5)+'C190 '+(38 + j * 5)+' 200 '+y+' 330 '+y+'" fill="none" stroke="'+W[k]+'" stroke-width="'+(act ? 7 : 4)+'" opacity="'+(act ? 1 : .35)+'"'+(act ? ' style="filter:drop-shadow(0 0 4px #e0a83a)"' : '')+'/><text x="338" y="'+(y + 4)+'" font-size="11" fill="#5a4a2a" opacity="'+(act ? 1 : .5)+'">'+(j + 1)+'</text>'; });
    return '<svg class="bkart" viewBox="0 0 360 90" aria-hidden="true">'+g+'</svg>';
  }}));

/* ================= AI ================= */
const AI = {mode:null, sample:null, dict:null, tts:null, needKey:false, ready:null};
AI.ready = (async () => {
  try{
    const proxy = window.MD_PROXY && window.MD_PROXY.url && window.MD_PROXY.key;
    if(window.maturitaAI){ const s = await window.maturitaAI.status(); if(s && s.available && (s.hasKey || !proxy)){ AI.mode = 'electron'; AI.needKey = !s.hasKey; return; } }
    if(window.claude && window.claude.use){
      const [sm, dc, ts] = await Promise.all([window.claude.use('sample'), window.claude.use('dictation').catch(() => null), window.claude.use('tts').catch(() => null)]);
      if(sm){ AI.sample = sm; AI.mode = 'artifact'; } AI.dict = dc; AI.tts = ts;
      return;
    }
    if(proxy) AI.mode = 'proxy';   // AI zdarma přes Supabase funkci (Groq)
  }catch(e){}
})();
function aiPlayerId(){
  try{ let id = JSON.parse(localStorage.getItem('md3-lb-id') || 'null') || localStorage.getItem('md-ai-id');
    if(!id){ id = 'a' + Date.now().toString(36) + Math.random().toString(36).slice(2, 12); localStorage.setItem('md-ai-id', id); }
    return String(id).replace(/[^\w-]/g, '').slice(0, 64); }catch(e){ return 'anon-' + Math.random().toString(36).slice(2, 12); }
}
function speechAPI(){   // rozpoznávání řeči prohlížeče funguje spolehlivě jen v Chrome a Edge (Brave, Opera, Vivaldi ho mají jen naoko)
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition, ua = navigator.userAgent;
  if(!SR || window.maturitaAI || VOICE.srFailed || navigator.brave || /Electron\/|OPR\/|Opera|Vivaldi|YaBrowser|SamsungBrowser|Firefox/.test(ua)) return null;
  return (/Edg\//.test(ua) || /Chrome\//.test(ua)) ? SR : null;
}
function canVoice(){ return !!(AI.dict || speechAPI() || (AI.mode === 'proxy' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder)); }
const VOICE = {rec:null, stream:null, timer:null, sr:null, srFailed:false};
function audioCtx(){   // sdílený AudioContext, probouzí se při kliknutí (jinak by prohlížeč „neslyšel“)
  const AC = window.AudioContext || window.webkitAudioContext; if(!AC) return null;
  if(!VOICE.ac || VOICE.ac.state === 'closed') VOICE.ac = new AC();
  if(VOICE.ac.state === 'suspended') VOICE.ac.resume().catch(() => {});
  return VOICE.ac;
}
function voiceSetBtn(btn, state){ if(!btn) return; btn.classList.toggle('rec', state === 'rec'); btn.disabled = state === 'busy'; btn.textContent = state === 'rec' ? 'Poslouchám… klikni pro konec' : state === 'busy' ? 'Přepisuju…' : 'Mluvit'; }
function voiceAppend(ta, txt){
  if(ta && !ta.isConnected && ta.id) ta = document.getElementById(ta.id) || ta;
  if(!ta || !txt) return;
  ta.value = (ta.value ? ta.value.replace(/\s*$/, ' ') : '') + txt.trim(); ta.focus();
}
function voiceInput(ta, btn, n){
  audioCtx();
  if(AI.dict){   // Claude artefakt: vestavěné diktování
    const d = AI.dict; let base = ta.value ? ta.value + ' ' : '';
    try{
      d.onPartial(({text}) => { ta.value = base + text; });
      d.onFinal(({text}) => { base = base + text + ' '; ta.value = base; });
      d.onState(({state}) => voiceSetBtn(btn, state === 'listening' ? 'rec' : 'idle'));
      if(btn && btn.classList.contains('rec')){ d.stop(); return; }
      d.start().catch(e => { if(e && e.code === 'not_granted'){ AI.dict = null; toast('Mikrofon není povolený'); } });
    }catch(e){}
    return;
  }
  const SR = speechAPI();
  if(SR && !VOICE.srFailed){   // Chrome / Edge: rozpoznávání řeči prohlížeče (dobrá čeština, živě)
    if(VOICE.sr){ VOICE.sr.stop(); return; }
    const sr = new SR(); VOICE.sr = sr;
    sr.lang = 'cs-CZ'; sr.continuous = true; sr.interimResults = true;
    const base = ta.value ? ta.value.replace(/\s*$/, ' ') : ''; let fin = '';
    sr.onresult = e => { let interim = ''; for(let i = e.resultIndex; i < e.results.length; i++){ const r = e.results[i]; if(r.isFinal) fin += r[0].transcript + ' '; else interim += r[0].transcript; } const t2 = ta.isConnected ? ta : document.getElementById('ans'); if(t2) t2.value = base + fin + interim; };
    let got = false; sr.addEventListener('result', () => { got = true; });
    const dead = setTimeout(() => { if(!got && VOICE.sr === sr){ VOICE.srFailed = true; try{ sr.abort(); }catch(e){} toast('Rozpoznávání v prohlížeči nefunguje – klikni znovu na Mluvit, použiju přepis přes server'); } }, 6000);
    sr.onerror = e => { if(e.error === 'not-allowed' || e.error === 'service-not-allowed'){ toast('Mikrofon není povolený'); } else if(e.error === 'network' || e.error === 'audio-capture'){ VOICE.srFailed = true; toast('Rozpoznávání v prohlížeči nejde – klikni znovu na Mluvit, použiju přepis přes server'); } };
    sr.onend = () => { clearTimeout(dead); VOICE.sr = null; voiceSetBtn(btn && btn.isConnected ? btn : document.getElementById('mic'), 'idle'); };
    try{ sr.start(); voiceSetBtn(btn, 'rec'); }catch(e){ VOICE.sr = null; VOICE.srFailed = true; voiceInput(ta, btn, n); }
    return;
  }
  voiceRecord(ta, btn, n);
}
async function voiceRecord(ta, btn, n){   // desktopová aplikace, Firefox: nahrávka s detekcí ticha → Whisper
  if(VOICE.rec){ if(VOICE.rec.send) VOICE.rec.send(); return; }
  if(!(AI.mode === 'proxy' && window.MD_PROXY)){ toast('Přepis řeči tady není dostupný'); return; }
  const c = {}; VOICE.rec = c;
  const cur = () => btn && btn.isConnected ? btn : document.getElementById('mic');
  voiceSetBtn(cur(), 'rec'); const b0 = cur(); if(b0) b0.textContent = 'Zapínám mikrofon…';
  c.level = v => { const b = cur(); if(b) b.style.setProperty('--lvl', Math.min(1, v).toFixed(2)); };
  try{
    const txt = await listenVAD(n, m => { const b = cur(); if(b){ b.textContent = /^Mluvíš/.test(m) ? 'Mluvíš… (skončí samo po pauze)' : /^Až domluvíš|^Poslouchám/.test(m) ? 'Poslouchám… klikni, až domluvíš' : m; if(m === 'Přepisuju…'){ b.disabled = true; b.classList.remove('rec'); } } }, c);
    if(txt) voiceAppend(ta, txt); else if(!c.aborted) toast('Nic jsem neslyšel – zkus mluvit blíž k mikrofonu');
  }catch(e){ toast(e && e.message ? e.message : 'Mikrofon nejde'); }
  VOICE.rec = null; const b = cur(); if(b){ b.style.removeProperty('--lvl'); voiceSetBtn(b, 'idle'); }
}
async function sttUpload(blob, n){
  if(blob.size < 1500) return '';
  const b64 = await new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(String(fr.result).split(',')[1] || ''); fr.onerror = rej; fr.readAsDataURL(blob); });
  const P = window.MD_PROXY, h = {apikey:P.key, 'Content-Type':'application/json'}; if(/^eyJ/.test(P.key)) h.Authorization = 'Bearer ' + P.key;
  const r = await fetch(P.url.replace(/\/$/, '') + '/functions/v1/' + (P.fn || 'ai-zkousejici'), {method:'POST', headers:h, body:JSON.stringify({kind:'stt', audio:b64, mime:blob.type, player:aiPlayerId()})});
  const j = await r.json().catch(() => null);
  if(!r.ok) throw {message:(j && j.message) || ('chyba ' + r.status)};
  const t = (j && j.text || '').trim();
  if(/^(?:www\.|https?:)|titulky|amara\.org|děkuji za (?:pozornost|sledování)|odebírejte|^\W*$/i.test(t) && t.length < 60) return '';   // typické „halucinace“ Whisperu na tichu
  if(n && T[n] && sttEcho(t, n)){ toast('Nerozuměl jsem, zopakuj to prosím'); return ''; }
  return t;
}
function sttEcho(t, n){   // pojistka: přepis, který jen opakuje osnovu tématu slovo od slova, je „halucinace“
  const norm = x => String(x).toLowerCase().replace(/[^0-9a-záčďéěíňóřšťúůýž]+/g, ' ').trim().split(' ').filter(Boolean);
  const src = norm(T[n].t + ' ' + T[n].outline.join(' ') + ' ' + (T[n].terms || []).map(x => x[0] + ' ' + x[1]).join(' ') + ' ' + T[n].open.map(o => o.q).join(' '));
  const grams = new Set(); for(let i = 0; i + 4 < src.length; i++) grams.add(src.slice(i, i + 5).join(' '));
  const w = norm(t); if(w.length < 5) return false;
  const hit = new Array(w.length).fill(false);
  for(let i = 0; i + 4 < w.length; i++) if(grams.has(w.slice(i, i + 5).join(' '))) for(let k = i; k < i + 5; k++) hit[k] = true;
  return hit.filter(Boolean).length / w.length > 0.5;
}
/* ---- hovor: hlas zkoušejícího + poslouchání s detekcí konce řeči ---- */
function canCall(){ return !!(speechAPI() || (AI.mode === 'proxy' && window.MD_PROXY && navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder && (window.AudioContext || window.webkitAudioContext))); }
function czVoice(){
  if(!('speechSynthesis' in window)) return null;
  const vs = speechSynthesis.getVoices().filter(v => /^cs/i.test(v.lang));
  return vs.find(v => /natural|online|neural/i.test(v.name)) || vs.find(v => /google/i.test(v.name)) || vs.find(v => /jakub|antonin|vlasta|zuzana/i.test(v.name)) || vs[0] || null;
}
function voicesReady(){ return new Promise(res => { if(!('speechSynthesis' in window)) return res(); if(speechSynthesis.getVoices().length) return res(); const t = setTimeout(res, 1500); speechSynthesis.onvoiceschanged = () => { clearTimeout(t); res(); }; }); }
function sayable(md){
  return String(md || '').replace(/^[ \t*_]*ZNÁMKA.*$/gmi, '').replace(/\*\*(Hodnocení|Otázka|Silné stránky|Doplnit):?\*\*:?/gi, '$1: ').replace(/[*_`#>]/g, '').replace(/^\s*(?:[-•]|\d+[.)])\s*/gm, '').replace(/\s*\n+\s*/g, '. ').replace(/([.:!?])\s*\.\s*/g, '$1 ').replace(/\s{2,}/g, ' ').trim();
}
async function listenVAD(n, live, ctlr){   // nahrávání → Whisper; konec po pauze (pokud jde měřit hlasitost), jinak tlačítkem
  let wantStop = false, stop = () => { wantStop = true; };
  ctlr.send = () => stop(); ctlr.cancel = () => { ctlr.aborted = true; stop(); };   // funguje hned od začátku
  let to; const stream = await Promise.race([
    navigator.mediaDevices.getUserMedia({audio:{channelCount:1, echoCancellation:true, noiseSuppression:true, autoGainControl:true}}),
    new Promise((_, rej) => { to = setTimeout(() => rej({message:'Mikrofon se nespustil. Zkontroluj, že je připojený a povolený.'}), 8000); })
  ]).finally(() => clearTimeout(to));
  if(ctlr.aborted){ stream.getTracks().forEach(t => t.stop()); return ''; }
  const mime = ['audio/webm;codecs=opus','audio/ogg;codecs=opus','audio/webm','audio/mp4'].find(m => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(m)) || '';
  const rec = new MediaRecorder(stream, Object.assign({audioBitsPerSecond:64000}, mime ? {mimeType:mime} : {})), chunks = [];
  rec.ondataavailable = e => { if(e.data && e.data.size) chunks.push(e.data); };
  const stopped = new Promise(res => { rec.onstop = res; });
  stop = () => { if(rec.state !== 'inactive') rec.stop(); };
  rec.start(250);
  if(wantStop){ stop(); }
  // měření hlasitosti – jen když zvukový modul opravdu běží (nikdy na něj nečekáme)
  let ac = null, src = null, an = null;
  try{ ac = audioCtx(); if(ac && ac.state !== 'running') ac.resume().catch(() => {}); src = ac.createMediaStreamSource(stream); an = ac.createAnalyser(); an.fftSize = 1024; src.connect(an); }catch(e){ an = null; }
  const buf = new Float32Array(1024), t0 = Date.now(); let noise = 1, speaking = false, lastVoice = 0, voiced = 0, vadOK = false, warned = false;
  if(live) live('Poslouchám…');
  const iv = setInterval(() => {
    const now = Date.now();
    if(now - t0 > 90000) return stop();
    if(!an || ac.state !== 'running'){ if(!warned && now - t0 > 1500){ warned = true; if(live) live('Až domluvíš, klikni na „Domluvil jsem“'); } return; }
    an.getFloatTimeDomainData(buf); let sum = 0; for(let i = 0; i < buf.length; i++) sum += buf[i]*buf[i]; const rms = Math.sqrt(sum / buf.length);
    if(rms > 0) vadOK = true;
    if(now - t0 < 600){ noise = Math.min(noise, rms); return; }   // nejtišší chvíle = hluk místnosti
    if(!vadOK){ if(!warned && now - t0 > 2500){ warned = true; if(live) live('Až domluvíš, klikni na „Domluvil jsem“'); } return; }
    const thr = Math.min(0.045, Math.max(0.01, noise * 3));
    if(ctlr.level) ctlr.level(rms / (thr * 3));
    if(rms > thr){ if(!speaking){ speaking = true; if(live) live('Mluvíš… (až domluvíš, chvíli počkej)'); } lastVoice = now; voiced += 100; }
    if(speaking && voiced > 600 && now - lastVoice > (ctlr.silence || 2000)) stop();
  }, 100);
  await stopped; clearInterval(iv); stream.getTracks().forEach(t => t.stop()); try{ if(src) src.disconnect(); }catch(e){}
  if(ctlr.aborted) return '';
  if(vadOK && !speaking && Date.now() - t0 < 4000) return '';   // měření běželo a nic neslyšelo
  if(live) live('Přepisuju…');
  return sttUpload(new Blob(chunks, {type: rec.mimeType || mime || 'audio/webm'}), n);
}
function listenSR(live, ctlr){   // rozpoznávání řeči prohlížeče, konec = 2,2 s ticha
  return new Promise(res => {
    const SR = speechAPI(), sr = new SR(); sr.lang = 'cs-CZ'; sr.continuous = true; sr.interimResults = true;
    let fin = '', interim = '', timer = null, done = false, heard = false;
    const finish = () => { if(done) return; done = true; clearTimeout(timer); clearTimeout(dead); try{ sr.stop(); }catch(e){} res(ctlr.aborted ? '' : (fin + ' ' + interim).trim()); };
    const giveUp = () => { if(done || heard) return; VOICE.srFailed = true; ctlr.fallback = true; toast('Rozpoznávání řeči v prohlížeči nefunguje – přepínám na přepis přes server'); finish(); };
    const dead = setTimeout(() => { if(!sr.__audio) giveUp(); }, 5000);
    sr.onaudiostart = () => { sr.__audio = true; };
    ctlr.send = () => { if(!fin && !interim) return giveUp(); finish(); }; ctlr.cancel = () => { ctlr.aborted = true; finish(); };
    sr.onresult = e => { heard = true; interim = ''; for(let i = e.resultIndex; i < e.results.length; i++){ const r = e.results[i]; if(r.isFinal) fin += r[0].transcript + ' '; else interim += r[0].transcript; } if(live) live((fin + interim).trim()); clearTimeout(timer); timer = setTimeout(finish, ctlr.silence || 2200); };
    sr.onerror = e => { if(e.error === 'not-allowed' || e.error === 'service-not-allowed'){ toast('Mikrofon není povolený'); ctlr.aborted = true; finish(); } else if(e.error === 'network' || e.error === 'audio-capture'){ VOICE.srFailed = true; ctlr.fallback = true; finish(); } };
    sr.onend = () => { if(done) return; if(fin || interim) return finish(); try{ sr.start(); }catch(e){ finish(); } };
    try{ sr.start(); }catch(e){ VOICE.srFailed = true; ctlr.fallback = true; finish(); }
  });
}
async function aiProxyAsk(system, turns, onText, signal){
  const P = window.MD_PROXY, url = P.url.replace(/\/$/, '') + '/functions/v1/' + (P.fn || 'ai-zkousejici');
  const h = {apikey:P.key, 'Content-Type':'application/json'}; if(/^eyJ/.test(P.key)) h.Authorization = 'Bearer ' + P.key;
  let r;
  for(let attempt = 0; ; attempt++){
    try{ r = await fetch(url, {method:'POST', headers:h, signal, body:JSON.stringify({system, messages:turns, player:aiPlayerId()})}); }
    catch(e){ if(e && e.name === 'AbortError') throw {code:'cancelled'}; throw {code:'upstream_error', message:'bez připojení k internetu'}; }
    if(r.ok) break;
    let j = null; try{ j = await r.json(); }catch(e){}
    const busy = (j && j.code === 'busy') || (r.status === 429 && j && /přetížen/.test(j.message || ''));
    if(busy && attempt < 3){ onText('AI je chvilku přetížená, zkouším to znovu…'); await new Promise(res => setTimeout(res, 7000 * (attempt + 1))); if(signal && signal.aborted) throw {code:'cancelled'}; continue; }
    throw {code:busy ? 'rate_limited' : ((j && j.code) || (r.status === 429 ? 'rate_limited' : 'upstream_error')), message:(j && j.message) || ('chyba ' + r.status)};
  }
  const rd = r.body.getReader(), dec = new TextDecoder(); let buf = '', text = '', raw = '';
  for(;;){
    const {done, value} = await rd.read(); if(done) break;
    buf += dec.decode(value, {stream:true});
    let i; while((i = buf.indexOf('\n')) >= 0){
      const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
      if(!line.startsWith('data:')) continue;
      const d = line.slice(5).trim(); if(d === '[DONE]') continue;
      try{ const j = JSON.parse(d); const c = j.choices && j.choices[0] && j.choices[0].delta && j.choices[0].delta.content; if(c){ raw += c; text = raw.replace(/<think>[\s\S]*?(<\/think>\s*|$)/g, '').replace(/^\s+/, ''); if(text) onText(text); } if(j.error) throw {code:'upstream_error', message:j.error.message || 'chyba AI'}; }catch(e){ if(e && e.code) throw e; }
    }
  }
  if(!text) throw {code:'upstream_error', message:'AI vrátila prázdnou odpověď'};
  return text;
}
function rawExcerpt(n, text, max){
  const raw = RAW[n] || ''; if(!raw) return '';
  if(raw.length <= max) return raw;
  const words = new Set((text||'').toLowerCase().match(/[a-záčďéěíňóřšťúůýž0-9]{4,}/g) || []);
  const paras = raw.match(/[\s\S]{1,700}(\n|$)/g) || [raw];
  const scored = paras.map((p,i) => { const lw = p.toLowerCase(); let s = 0; words.forEach(w => { if(lw.includes(w.slice(0,5))) s++; }); return {i, s}; }).sort((a,b) => b.s - a.s);
  const pick = []; let len = 0; for(const x of scored){ if(len + paras[x.i].length > max) break; pick.push(x.i); len += paras[x.i].length; }
  return pick.sort((a,b) => a-b).map(i => paras[i]).join('\n…\n');
}
function aiErrText(e){
  const c = e && e.code;
  if(c === 'rate_limited' && e.message) return e.message;
  return ({not_granted:'Použití AI bylo zamítnuto.', rate_limited:'Moc dotazů najednou nebo vyčerpaný limit. Zkus to za chvíli.', no_key:'Chybí API klíč.', auth:'API klíč nefunguje. Zkontroluj ho v nastavení.', refused:'AI na tohle neodpoví. Zkus otázku přeformulovat.', sampling_disabled:'AI není pro tento účet dostupná.', session_expired:'Přihlas se znovu.'}[c]) || ('AI teď neodpovídá'+(e && e.message ? ': '+e.message : '')+'. Zkus to znovu.');
}
async function aiAsk(system, turns, onText, signal){
  await AI.ready;
  if(AI.mode === 'electron'){
    if(signal) signal.addEventListener('abort', () => window.maturitaAI.abort());
    return window.maturitaAI.ask({system, messages:turns}, t => onText(t));
  }
  if(AI.mode === 'artifact'){
    const r = await AI.sample([{role:'user', content:system}, ...turns], {cache:false, signal, onText:({text}) => onText(text)});
    return r.text;
  }
  if(AI.mode === 'proxy') return aiProxyAsk(system, turns, onText, signal);
  throw {code:'unavailable', message:'AI není dostupná'};
}
function aiUnavailableHTML(){
  return '<div class="aibox"><b>AI tady není dostupná.</b><p class="muted small">AI zkoušející běží zdarma přes server hry. Pokud se tohle zobrazuje, server ještě není nastavený (Supabase funkce ai-zkousejici). Jinak AI funguje v Claude artefaktu nebo v desktopové aplikaci s vlastním API klíčem Anthropic.</p></div>';
}
function keyFormHTML(){
  return '<div class="aibox"><b>Nastav API klíč</b><p class="muted small">Desktopová aplikace volá Claude přes tvůj API klíč z console.anthropic.com. Klíč se uloží jen v tomto počítači (šifrovaně, pokud to systém umí). Každý dotaz se platí z tvého API účtu.</p>'+
    '<div class="row"><input id="apikey" type="password" class="notes" style="min-height:0;max-width:420px" placeholder="sk-ant-…" autocomplete="off"><button class="btn" id="savekey">Uložit klíč</button></div></div>';
}
function bindKeyForm(after){
  const b = $('#savekey'); if(!b) return;
  b.onclick = async () => { const k = $('#apikey').value.trim(); if(!k) return; try{ await window.maturitaAI.setKey(k); AI.needKey = false; toast('Klíč uložen'); after(); }catch(e){ toast('Klíč se nepodařilo uložit'); } };
}

/* AI vysvětlení špatné odpovědi */
function aiExplainButton(cur, host){
  if(!host) return;
  AI.ready.then(() => {
    if(!AI.mode || (AI.mode === 'electron' && AI.needKey)) return;
    const b = document.createElement('button'); b.className = 'btn ghost'; b.textContent = 'Vysvětli mi to (AI)';
    host.appendChild(b);
    b.onclick = async () => {
      b.disabled = true;
      let box = view.querySelector('.aiexp'); if(!box){ box = document.createElement('div'); box.className = 'aiexp md'; view.querySelector('.bench').appendChild(box); }
      box.textContent = 'Přemýšlím…';
      const t = cur.n ? T[cur.n] : null;
      const sys = 'Jsi trpělivý učitel IT na střední průmyslové škole a pomáháš studentovi s přípravou k maturitě. Odpovídej česky, stručně (nejvýše 120 slov), věcně a srozumitelně, bez nadpisů. Drž se studentových podkladů; když podklady něco neříkají, řekni to.';
      const msg = 'Téma: '+(t ? t.n+'. '+t.t : '')+'\nOtázka: '+cur.text+'\nSprávná odpověď: '+cur.ans+'\nŠpatné možnosti: '+cur.opts.filter(o => o !== cur.ans).join(' | ')+
        '\n\nVýtah z podkladů studenta:\n"""\n'+rawExcerpt(cur.n, cur.text+' '+cur.ans, AI.mode === 'proxy' ? 2000 : 3500)+'\n"""\n\nVysvětli, proč je správná odpověď správná a čím se liší od ostatních možností. Přidej jednu pomůcku, jak si to zapamatovat.';
      try{ await aiAsk(sys, [{role:'user', content:msg}], txt => { box.innerHTML = mdLite(txt); }); }
      catch(e){ box.textContent = aiErrText(e); }
    };
  });
}

/* AI zkoušející */
function mdLite(src){   // Markdown z AI → HTML (nadpisy, seznamy, tučně, kurzíva, kód, citace, odkazy)
  const lines = String(src == null ? '' : src).replace(/\r/g, '').split('\n'); let out = '', list = null, code = null;
  const inl = x => esc(x).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/__(.+?)__/g, '<b>$1</b>')
    .replace(/(^|[\s(„])\*(?!\s)([^*]+?)\*(?=[\s).,;:!?“]|$)/g, '$1<i>$2</i>').replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  const close = () => { if(list){ out += '</'+list+'>'; list = null; } };
  lines.forEach(l => {
    if(code !== null){ if(/^\s*```/.test(l)){ out += '<pre class="code">'+esc(code.join('\n'))+'</pre>'; code = null; } else code.push(l); return; }
    if(/^\s*```/.test(l)){ close(); code = []; return; }
    let m;
    if((m = l.match(/^\s*#{1,6}\s+(.*)$/))){ close(); out += '<h4>'+inl(m[1])+'</h4>'; return; }
    if(/^\s*([-*_])(\s*\1){2,}\s*$/.test(l)){ close(); out += '<hr>'; return; }
    if((m = l.match(/^\s*>\s?(.*)$/))){ close(); out += '<blockquote>'+inl(m[1])+'</blockquote>'; return; }
    if((m = l.match(/^\s*\d+[.)]\s+(.*)$/))){ if(list !== 'ol'){ close(); out += '<ol>'; list = 'ol'; } out += '<li>'+inl(m[1])+'</li>'; return; }
    if((m = l.match(/^\s*[-*•]\s+(.*)$/))){ if(list !== 'ul'){ close(); out += '<ul>'; list = 'ul'; } out += '<li>'+inl(m[1])+'</li>'; return; }
    close();
    if(l.trim()) out += '<p>'+inl(l)+'</p>';
  });
  if(code !== null) out += '<pre class="code">'+esc(code.join('\n'))+'</pre>';
  close();
  return out;
}
function examTimer(sec, el, onEnd){
  const end = Date.now() + sec*1000; let done = false;
  const tick = () => {
    const box = document.getElementById(el);
    if(!box){ clearInterval(iv); return; }
    const left = Math.max(0, Math.round((end - Date.now())/1000));
    box.textContent = String(Math.floor(left/60)).padStart(2,'0') + ':' + String(left%60).padStart(2,'0');
    box.classList.toggle('warn', left <= 180 && left > 60); box.classList.toggle('crit', left <= 60);
    if(left <= 0 && !done){ done = true; clearInterval(iv); onEnd(); }
  };
  const iv = setInterval(tick, 500); setTimeout(tick, 0);
  return {left:() => Math.max(0, Math.round((end - Date.now())/1000)), stop:() => { done = true; clearInterval(iv); }};
}
function runAIExam(n, opts){
  opts = opts || {};
  if(opts.call) audioCtx();
  const t = T[n]; const MAXQ = 7; let turns = [], busy = false, ctl = null, speak = false, asked = 0, timer = null, timeUp = false, finished = false, grade = null;
  const call = {on:!!opts.call, state:'think', label:'Připojuji zkoušejícího…', ctl:null, skip:null, voice:null};
  const alive = () => !!document.getElementById('chat');
  function setCall(st, label){ call.state = st; call.label = label; const p = document.getElementById('callp'); if(p) p.dataset.st = st; const l = document.getElementById('callst'); if(l) l.textContent = label; const v = document.getElementById('calllive'); if(v) v.textContent = ''; }
  function live(txt){ const v = document.getElementById('calllive'); if(v) v.textContent = txt; }
  function stopCall(){ if(call.ctl && call.ctl.cancel) call.ctl.cancel(); call.ctl = null; if(call.skip) call.skip(); try{ if('speechSynthesis' in window) speechSynthesis.cancel(); }catch(e){} }
  function sayIt(md){
    return new Promise(res => {
      const txt = sayable(md); if(!txt || !call.voice) return res();
      const parts = txt.match(/[^.!?]+[.!?]*/g) || [txt]; let i = 0, done = false;
      const fin = () => { if(!done){ done = true; call.skip = null; res(); } };
      call.skip = () => { i = parts.length; try{ speechSynthesis.cancel(); }catch(e){} fin(); };
      const next = () => { if(i >= parts.length || !alive()) return fin(); const u = new SpeechSynthesisUtterance(parts[i++].trim()); u.lang = 'cs-CZ'; u.voice = call.voice; u.rate = 1.05; u.onend = next; u.onerror = next; speechSynthesis.speak(u); };
      try{ speechSynthesis.cancel(); }catch(e){} next();
    });
  }
  async function callTurn(txt){
    if(!call.on || finished || !alive()) return;
    if(txt){ setCall('speak', 'Zkoušející mluví…'); await sayIt(txt); }
    if(!call.on || finished || busy || !alive()) return;
    setCall('listen', 'Poslouchám – mluv. Až domluvíš, chvíli počkej.');
    const c = {silence:2500}; call.ctl = c; let ans = '';
    try{
      if(speechAPI() && !VOICE.srFailed){ ans = await listenSR(live, c); if(c.fallback && !c.aborted && !ans){ ans = await listenVAD(n, live, c); } }
      else ans = await listenVAD(n, live, c);
    }catch(e){ toast('Mikrofon nejde: ' + (e && e.message || 'chyba')); call.on = false; if(alive()) render(); return; }
    if(call.ctl === c) call.ctl = null;
    if(c.aborted || !call.on || finished || !alive()) return;
    if(!ans){ setCall('listen', 'Nic jsem neslyšel, zkus to znovu.'); return callTurn(''); }
    turns.push({role:'user', content:ans}); ask();
  }
  const base = 'Jsi zkoušející u ústní maturitní zkoušky z IT na střední průmyslové škole elektrotechnické. Zkoušíš otázku č. '+n+': '+t.t+'.\n\n'+
    'Osnova otázky:\n- '+t.outline.join('\n- ')+'\n\nKlíčové body ze studentových podkladů (body označené „mimo PDF“ v jeho podkladech nejsou):\n'+t.open.map(o => '* '+o.q+': '+o.k.join('; ')).join('\n');
  const rules = '\n\nPravidla:\n- Mluv česky, jako vlídný, ale důsledný zkoušející. Buď stručný: nejvýš 90 slov.\n'+
    '- Fakta ber z výtahu podkladů a z klíčových bodů výše. Odpovědi studenta hodnoť podle nich. Když student řekne něco správného, co v podkladech není, uznej to, ale nevyžaduj to. Nevymýšlej si fakta, která odporují podkladům.\n'+
    '- Vždy polož jen jednu otázku. Postupně projdi osnovu od začátku, ptej se i doplňujícími otázkami („a proč?“, „uveď příklad“), jako komise.\n'+
    '- Hodnoť přísně a poctivě jako skutečná komise. Chval jen to, co student opravdu napsal – nikdy nevymýšlej, co „správně uvedl“. Když odpověď neobsahuje žádný věcný obsah k otázce (např. „nevím“, prázdná, mimo téma, nadávky, vtip), napiš jasně „Odpověď neobsahuje nic k otázce – za tuhle část 0 bodů.“, stručně řekni správnou odpověď podle podkladů a polož další otázku. Takové odpovědi se do známky počítají jako nezodpovězené.\n'+
    '- Formát odpovědi: nejdřív řádek „**Hodnocení:**“ a 1–3 odrážky (co bylo správně, co chybí nebo je špatně – oprav podle podkladů), pak řádek „**Otázka:**“ s další otázkou. Na úplně první zprávu jen pozdrav jednou větou a „**Otázka:**“.\n'+
    '- Odpověď na svou otázku předem neprozrazuj.\n'+
    '- Když student napíše „KONEC“, nebo už jsi položil '+MAXQ+' otázek, ukonči zkoušení: dej známku 1–5 podle maturitní stupnice, pak „**Silné stránky:**“ (2–3 odrážky) a „**Doplnit:**“ (2–3 odrážky). Na úplný konec napiš řádek ve tvaru ZNÁMKA: X.';
  const sysFor = () => {
    const lastAI = [...turns].reverse().find(m => m.role === 'assistant'), lastMe = turns.length > 1 ? turns[turns.length-1] : null;
    const ctx = ((lastAI ? lastAI.content : '') + ' ' + (lastMe && lastMe.role === 'user' ? lastMe.content : '')).trim() || t.outline.join(' ');
    const ex = RAW[n] ? rawExcerpt(n, ctx + ' ' + t.outline.join(' '), AI.mode === 'proxy' ? 4500 : 14000) : '';
    return base + (ex ? '\n\nVýtah ze studentových podkladů k aktuální části zkoušení (fakta ber odsud):\n"""\n' + ex + '\n"""' : '') + rules;
  };
  const backTo = () => { call.on = false; stopCall(); if(timer) timer.stop(); if(ctl) ctl.abort(); if(VOICE.rec && VOICE.rec.cancel) VOICE.rec.cancel(); onKey = null; opts.drawn ? go('') : renderTopic(n); };
  function shell(inner){
    view.innerHTML = '<div class="bench wide aix"><div class="aixhead"><button class="back" id="back">← Ukončit</button>'+
      '<div class="aixmeta">'+(opts.timed ? '<span class="otimer" id="otimer" title="Zbývající čas">15:00</span>' : '')+
      '<span class="aixq">otázka <b>'+Math.min(asked, MAXQ)+'</b>/'+MAXQ+'</span></div></div>'+
      '<div class="eyebrow">'+(opts.call ? 'Hovor se zkoušejícím' : 'Ústní zkouška s AI')+' · '+ref(n)+'</div><h2 class="labh">'+n+'. '+esc(t.t)+'</h2>'+inner+'</div>';
    $('#back').onclick = backTo;
  }
  async function start(){
    await AI.ready;
    if(!AI.mode){ shell(aiUnavailableHTML()); return; }
    if(AI.mode === 'electron' && AI.needKey){ shell(keyFormHTML()); bindKeyForm(start); return; }
    turns = [{role:'user', content:'Dobrý den, jsem připravený. Začněte prosím zkoušet.'}];
    if(opts.timed) timer = {stub:true};
    if(call.on){ await voicesReady(); call.voice = czVoice(); if(!call.voice) toast('Nenašel jsem český hlas – otázky čti v chatu, poslouchat budu dál'); }
    render(); 
    if(opts.timed) timer = examTimer(15*60, 'otimer', () => { timeUp = true; toast('Čas vypršel – zkoušející tě ohodnotí'); if(call.ctl && call.ctl.cancel) call.ctl.cancel(); if(call.skip) call.skip(); if(!busy && !finished){ turns.push({role:'user', content:'KONEC – čas na zkoušení vypršel.'}); ask(); } });
    await ask();
  }
  function bubbles(){
    return turns.slice(1).map(m => m.role === 'assistant'
      ? '<div class="msgb ai"><span class="who">Zkoušející</span>'+mdLite(m.content.replace(/^[ \t*_]*ZNÁMKA[ \t*_]*:?[ \t*_]*[1-5][ \t*_.]*$/gmi, ''))+'</div>'
      : '<div class="msgb me"><span class="who">Ty</span>'+esc(m.content)+'</div>').join('');
  }
  function render(pending){
    const tl = timer && timer.left ? timer.left() : null;
    shell('<div class="chat" id="chat">'+bubbles()+(pending != null ? '<div class="msgb ai" id="pend"><span class="who">Zkoušející</span><div id="pendt">'+(pending ? mdLite(pending) : '<span class="typing"><i></i><i></i><i></i></span>')+'</div></div>' : '')+'</div>'+
      (finished ? '<div class="aixgrade"><div class="g">'+(grade || '–')+'</div><div><b>'+(grade ? ['','Výborně','Chvalitebně','Dobře','Dostatečně','Nedostatečně'][grade] : 'Hodnocení')+'</b><span class="muted small">'+(opts.timed && tl != null ? 'Čas: '+Math.floor((900-tl)/60)+' min '+((900-tl)%60)+' s · ' : '')+asked+' '+plural(asked,'otázka','otázky','otázek')+'</span></div>'+
          '<div class="row"><button class="btn" id="again">Zkoušet znovu</button><button class="btn ghost" id="bk">Zpět na téma</button></div></div>'
        : call.on ? '<div class="callpanel" id="callp" data-st="'+call.state+'"><div class="callorb"><i></i><i></i><i></i></div><div class="callinfo"><b id="callst">'+esc(call.label)+'</b><span id="calllive"></span></div>'+
          '<div class="row"><button class="btn" id="csend">Domluvil jsem</button><button class="btn ghost" id="cskip">Přeskočit čtení</button><button class="btn ghost" id="ctype">Psát místo mluvení</button><span class="spacer"></span><button class="btn red" id="chang">Zavěsit a ohodnotit</button></div></div>'
        : '<div class="composer"><textarea class="notes" id="ans" placeholder="Odpověz vlastními slovy…"'+(busy?' disabled':'')+'></textarea>'+
          '<div class="row"><button class="btn" id="send"'+(busy?' disabled':'')+'>Odeslat<span class="kbd">Ctrl+Enter</span></button>'+
          (AI.tts ? '<button class="btn ghost" id="spk" aria-pressed="'+speak+'">'+(speak?'Předčítání zap':'Předčítání vyp')+'</button>' : '')+
          '<span class="spacer"></span>'+(busy ? '<button class="btn red" id="stop">Zastavit</button>' : '<button class="btn ghost" id="end">Ukončit a ohodnotit</button>')+'</div></div>'));
    if(timer && timer.left){ const b = document.getElementById('otimer'); if(b){ const l = timer.left(); b.textContent = String(Math.floor(l/60)).padStart(2,'0')+':'+String(l%60).padStart(2,'0'); } }
    const chat = $('#chat'); chat.scrollTop = chat.scrollHeight;
    if(finished){ $('#again').onclick = () => runAIExam(n, opts); $('#bk').onclick = backTo; return; }
    if(call.on){
      $('#csend').onclick = () => { if(call.ctl && call.ctl.send) call.ctl.send(); };
      $('#cskip').onclick = () => { if(call.skip) call.skip(); };
      $('#ctype').onclick = () => { call.on = false; stopCall(); render(); };
      $('#chang').onclick = () => { stopCall(); if(busy) return; turns.push({role:'user', content:'KONEC'}); ask(); };
      return;
    }
    const ta = $('#ans');
    if(!busy) ta.focus({preventScroll:true});
    ta.onkeydown = e => { if(e.key === 'Enter' && (e.ctrlKey || e.metaKey)){ e.preventDefault(); send(); } };
    $('#send').onclick = send;
    if($('#end')) $('#end').onclick = () => { ta.value = 'KONEC'; send(); };
    if($('#stop')) $('#stop').onclick = () => { if(ctl) ctl.abort(); };
    if($('#spk')) $('#spk').onclick = () => { speak = !speak; if(!speak && AI.tts) try{ AI.tts.stop(); }catch(e){} render(); };
    if($('#mic')) $('#mic').onclick = () => voiceInput($('#ans'), $('#mic'), n);
  }
  async function send(){
    const ta = $('#ans'); const v = ta.value.trim(); if(!v || busy) return;
    if(VOICE.rec && VOICE.rec.send) VOICE.rec.send();
    turns.push({role:'user', content:v}); await ask();
  }
  async function ask(){
    busy = true; if(call.on) setCall('think', 'Zkoušející přemýšlí…'); render('');
    ctl = new AbortController();
    try{
      const txt = await aiAsk(sysFor(), turns, s => { const p = document.getElementById('pendt'); if(p){ p.innerHTML = mdLite(s); const c = $('#chat'); c.scrollTop = c.scrollHeight; } }, ctl.signal);
      turns.push({role:'assistant', content:txt});
      if(/\*\*Otázka:?\*\*|\?\s*$/m.test(txt)) asked++;
      if(speak && AI.tts) AI.tts.speak(txt.replace(/\*\*/g,'').slice(0,1900)).catch(() => {});
      const m = txt.replace(/[*_]/g, '').match(/ZNÁMKA\s*:?\s*([1-5])/i);
      busy = false;
      if(m){ grade = +m[1]; finished = true; if(timer && timer.stop) timer.stop(); const xp = Math.max(10, (6-grade)*12); addXP(xp); toast('Známka '+grade+' · +'+xp+' XP'); render(); if(call.on && call.voice) sayIt('Známka ' + grade + '. ' + txt); return; }
      if(timeUp && !finished){ turns.push({role:'user', content:'KONEC – čas na zkoušení vypršel.'}); return ask(); }
      render();
      if(call.on) callTurn(txt);
    }catch(e){
      busy = false;
      if(e && e.code === 'cancelled'){ if(e.text) turns.push({role:'assistant', content:e.text}); else if(turns.length > 1) turns.pop(); if(document.getElementById('chat')) render(); return; }
      if(e && (e.code === 'no_key' || e.code === 'auth')){ AI.needKey = true; shell(keyFormHTML()+'<p class="muted small">'+esc(aiErrText(e))+'</p>'); bindKeyForm(start); return; }
      let back = '';
      if(turns.length > 1 && turns[turns.length-1].role === 'user'){ back = turns.pop().content; }
      if(document.getElementById('chat')){ render(); const ta = $('#ans'); if(ta && back && back !== 'KONEC' && !/^KONEC –/.test(back)) ta.value = back; toast(aiErrText(e)); }
      if(call.on && alive() && !finished){ setTimeout(() => callTurn(''), 1500); }
      if(call.on && alive() && !finished){ setCall('listen', 'Něco se pokazilo, zopakuj prosím odpověď.'); setTimeout(() => callTurn(''), 1500); }
    }
  }
  start();
}
