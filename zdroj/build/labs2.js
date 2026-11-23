/* ================= LABORATOŘ 2 (v3): víc cvičení + kreativní dílna ================= */
function cre(n, name, desc, run){ lab(n, name, desc, run); LABS[n][LABS[n].length-1].cre = true; }
function lsGet(k, d){ try{ const v = localStorage.getItem('md3-'+k); return v ? JSON.parse(v) : d; }catch(e){ return d; } }
function lsSet(k, v){ try{ localStorage.setItem('md3-'+k, JSON.stringify(v)); }catch(e){} }

/* ---------- T1: najdi chybu ---------- */
const BUGS = [
 ['int x;\nscanf("%d", x);', 'Chybí & – scanf potřebuje adresu: &x', ['Má být %f místo %d','Chybí středník za scanf','Proměnná musí být inicializovaná na 0']],
 ['int a[5];\nfor (int i = 0; i <= 5; i++)\n    a[i] = i;', 'Podmínka i <= 5 zapíše mimo pole (index 5 neexistuje)', ['Pole se musí deklarovat jako int a(5)','Cyklus začíná od 1, ne od 0','Chybí return na konci cyklu']],
 ['if (x = 5)\n    printf("pět");', 'Přiřazení = místo porovnání ==', ['Chybí složené závorky {}','printf potřebuje \\n','Podmínka musí být v hranatých závorkách']],
 ['FILE *f = fopen("data.txt", "r");\nfscanf(f, "%d", &n);', 'Chybí kontrola, zda fopen nevrátilo NULL (a fclose)', ['fopen má režim "read", ne "r"','fscanf neumí číst ze souboru','Proměnná f musí být typu int']],
 ['double p = 7 / 2;\nprintf("%.1f", p);', 'Celočíselné dělení dá 3 – je třeba 7.0 / 2', ['Specifikátor %.1f nejde použít pro double','double nelze inicializovat výrazem','Chybí přetypování výsledku na int']],
 ['int soucet(int a, int b) {\n    int s = a + b;\n}', 'Funkce nevrací výsledek – chybí return s;', ['Parametry musí být ukazatele','Funkce typu int nesmí mít lokální proměnné','Chybí prototyp uvnitř funkce']],
 ['int *p;\n*p = 10;', 'Ukazatel neukazuje na žádnou platnou paměť', ['Hvězdička se píše za p: p* = 10','Ukazatel musí být typu void','Číslo 10 se musí přetypovat na ukazatel']],
 ['char jmeno[5] = "Ondřej";', 'Řetězec se do pole 5 znaků nevejde (+ ukončovací \\0)', ['Řetězce se zapisují v apostrofech','Pole char nejde inicializovat textem','Chybí specifikátor %s']],
 ['while (i < 10)\n    printf("%d", i);', 'Proměnná i se nemění – nekonečný cyklus', ['while nepodporuje podmínku <','printf v cyklu musí mít \\n','Cyklus while musí mít středník za podmínkou']]
];
lab(1, 'Najdi chybu v kódu', 'Kód se přeloží, ale nefunguje správně. Kde je chyba?', n => {
  const set = shuffle(BUGS).slice(0, 7);
  runQuiz({title:'Najdi chybu', total:set.length, lives:null, record:false, next:i => { const b = set[i]; const q = mcqOf('Co je v tomto kódu špatně?', b[1], b[2], 1); q.code = b[0]; return q; },
    back:() => renderTopic(1), again:() => LABS[1].find(l => l.name === 'Najdi chybu v kódu').run(1)});
});

/* ---------- T2: mini procesor (kreativní) ---------- */
cre(2, 'Naprogramuj procesor', 'Střadačový procesor: napiš program v assembleru a sleduj fázi fetch – decode – execute.', n => {
  const TASKS = [
    {t:'Sečti M[0] a M[1], výsledek ulož do M[2].', start:'LOAD 0\n; sem doplň\nHALT', f:(a,b) => a+b, edge:[[0,0],[50,49]], gen:() => [ri(0,50), ri(0,50)]},
    {t:'Odečti M[1] od M[0] a výsledek ulož do M[2].', start:'LOAD 0\n\nHALT', f:(a,b) => a-b, edge:[[20,20],[90,0]], gen:() => [ri(20,90), ri(0,20)]},
    {t:'Vynásob M[0] × M[1] opakovaným sčítáním (M[1] ≥ 0), výsledek do M[2]. Tip: M[3] = 1 jako konstanta.', start:'; M[3] = 1 (konstanta)\nLOADI 0\nSTORE 2\nloop:\n  LOAD 1\n  JZ konec\n  ; sem doplň tělo cyklu\n  JMP loop\nkonec:\nHALT', f:(a,b) => a*b, mem:[0,1], edge:[[7,0],[0,5],[9,6]], gen:() => [ri(0,9), ri(0,6)]},
    {t:'Do M[2] ulož větší z čísel M[0] a M[1]. Tip: JN skáče, když je výsledek záporný.', start:'LOAD 0\nSUB 1\n; JN …\nHALT', f:(a,b) => Math.max(a,b), edge:[[30,70],[70,30],[42,42],[0,99]], gen:() => [ri(0,99), ri(0,99)]}
  ];
  let ti = 0, code = TASKS[0].start, cpu, prog, err = '';
  const HELP = 'LOAD a · LOADI n · STORE a · ADD a · SUB a · INC · DEC · JMP L · JZ L · JN L · HALT · návěští „jméno:“ · komentář „;“';
  function parse(src){
    const lines = src.split('\n'), labels = {}, ins = [];
    lines.forEach((raw, ln) => { let s = raw.replace(/;.*$/, '').trim(); if(!s) return; const m = s.match(/^([A-Za-z_]\w*):\s*(.*)$/); if(m){ labels[m[1].toLowerCase()] = ins.length; s = m[2].trim(); if(!s) return; } const p = s.split(/\s+/); ins.push({op:p[0].toUpperCase(), arg:p[1], ln, txt:s}); });
    ins.forEach(x => {
      const ops = ['LOAD','LOADI','STORE','ADD','SUB','INC','DEC','JMP','JZ','JN','HALT'];
      if(!ops.includes(x.op)) throw new Error('Řádek '+(x.ln+1)+': neznámá instrukce '+x.op);
      if(['JMP','JZ','JN'].includes(x.op)){ const l = (x.arg||'').toLowerCase(); if(labels[l] == null && !/^\d+$/.test(l)) throw new Error('Řádek '+(x.ln+1)+': návěští '+x.arg+' neexistuje'); x.to = labels[l] != null ? labels[l] : +l; }
      else if(['LOAD','LOADI','STORE','ADD','SUB'].includes(x.op)){ if(x.arg == null || !/^-?\d+$/.test(x.arg)) throw new Error('Řádek '+(x.ln+1)+': '+x.op+' potřebuje číslo'); x.v = +x.arg; if(x.op !== 'LOADI' && (x.v < 0 || x.v > 15)) throw new Error('Řádek '+(x.ln+1)+': adresa musí být 0–15'); }
    });
    return ins;
  }
  // pevné hraniční testy + 3 náhodné: chybný program nesmí projít náhodou opakovaným klikáním
  function tests(T){ return (T.edge||[]).concat([T.gen(), T.gen(), T.gen()]).map(([a,b]) => ({m:[a,b].concat(T.mem||[]), want:T.f(a,b)})); }
  function reset(mem){ cpu = {pc:0, ir:'—', acc:0, z:1, nf:0, phase:'fetch', mem:(mem||[]).concat(Array(16).fill(0)).slice(0,16), steps:0, halted:false, cur:null, dec:'', last:null}; }
  function exec1(c, x){
    const set = v => { c.acc = v; c.z = v === 0 ? 1 : 0; c.nf = v < 0 ? 1 : 0; };
    switch(x.op){
      case 'LOAD': set(c.mem[x.v]); break; case 'LOADI': set(x.v); break; case 'STORE': c.mem[x.v] = c.acc; break;
      case 'ADD': set(c.acc + c.mem[x.v]); break; case 'SUB': set(c.acc - c.mem[x.v]); break;
      case 'INC': set(c.acc + 1); break; case 'DEC': set(c.acc - 1); break;
      case 'JMP': c.pc = x.to; break; case 'JZ': if(c.z) c.pc = x.to; break; case 'JN': if(c.nf) c.pc = x.to; break;
      case 'HALT': c.halted = true; break;
    }
  }
  const DESC = {LOAD:'ALU: střadač ← M[a]', LOADI:'střadač ← číslo', STORE:'M[a] ← střadač', ADD:'ALU: střadač + M[a]', SUB:'ALU: střadač − M[a]', INC:'ALU: střadač + 1', DEC:'ALU: střadač − 1', JMP:'řadič: PC ← návěští', JZ:'řadič: skok, je-li Z = 1', JN:'řadič: skok, je-li N = 1', HALT:'stop'};
  function phaseStep(){
    if(cpu.halted) return;
    if(cpu.pc >= prog.length){ cpu.halted = true; return; }
    if(cpu.phase === 'fetch'){ cpu.cur = prog[cpu.pc]; cpu.ir = cpu.cur.txt; cpu.at = cpu.pc; cpu.pc++; cpu.phase = 'decode'; cpu.last = 'fetch'; cpu.dec = ''; }
    else if(cpu.phase === 'decode'){ cpu.dec = DESC[cpu.cur.op]; cpu.phase = 'execute'; cpu.last = 'decode'; }
    else { exec1(cpu, cpu.cur); cpu.steps++; cpu.phase = 'fetch'; cpu.last = 'execute'; }
  }
  function runAll(c, p){ let k = 0; while(!c.halted && c.pc < p.length && k++ < 5000){ const x = p[c.pc]; c.pc++; exec1(c, x); } return k < 5000; }
  function diagram(){
    const x = cpu.cur, op = x && x.op, L = cpu.last, A = {};
    if(L === 'fetch'){ A.pc = A.pmem = A.ir = A.pcP = A.pIr = 1; }
    else if(L === 'decode'){ A.ir = A.dec = A.irDec = 1; }
    else if(L === 'execute' && op){
      A.dec = 1;
      if(['LOAD','STORE','ADD','SUB'].includes(op)){ A.ir = A.irAb = A.ab = A.dmem = 1; A['m'+x.v] = 1; A.db = 1; }
      if(['LOAD','ADD','SUB'].includes(op)) A.dbAlu = 1;
      if(op === 'LOADI'){ A.ir = A.irDb = A.db = A.dbAlu = 1; }
      if(['LOAD','LOADI','ADD','SUB','INC','DEC'].includes(op)){ A.alu = A.aluAcc = A.acc = A.fl = 1; }
      if(['ADD','SUB','INC','DEC'].includes(op)) A.accAlu = 1;
      if(op === 'STORE'){ A.acc = A.accDb = 1; }
      if(['JMP','JZ','JN'].includes(op)){ A.ir = A.irPc = A.pc = 1; if(op !== 'JMP') A.fl = 1; }
    }
    const o = k => A[k] ? ' on' : '';
    const blk = (k, x0, y0, w, h, t) => '<g class="cb'+o(k)+'"><rect x="'+x0+'" y="'+y0+'" width="'+w+'" height="'+h+'" rx="7"/>'+(t ? '<text x="'+(x0+8)+'" y="'+(y0+15)+'" class="cbt">'+t+'</text>' : '')+'</g>';
    const reg = (k, x0, y0, w, h, lb, v) => '<g class="cr'+o(k)+'"><rect x="'+x0+'" y="'+y0+'" width="'+w+'" height="'+h+'" rx="5"/><text x="'+(x0+6)+'" y="'+(y0+12)+'" class="crl">'+lb+'</text><text x="'+(x0+w/2)+'" y="'+(y0+h-8)+'" class="crv" text-anchor="middle">'+esc(String(v))+'</text></g>';
    const w = (k, d, mk) => '<path class="cw'+o(k)+'" d="'+d+'"'+(mk === false ? '' : ' marker-end="url(#cpuAr'+(A[k] ? 'On' : '')+')"')+'/>';
    let g = '<defs>'+['','On'].map(s => '<marker id="cpuAr'+s+'" viewBox="0 0 10 10" refX="8" refY="5" markerUnits="userSpaceOnUse" markerWidth="10" markerHeight="10" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="'+(s ? '#f3cd7e' : '#4b5a55')+'"/></marker>').join('')+'</defs>';
    // paměť programu
    g += blk('pmem', 10, 10, 200, 170, 'PAMĚŤ PROGRAMU');
    const P = prog || [], cur = L === 'fetch' || L === 'decode' || L === 'execute' ? cpu.at : cpu.pc, top = Math.max(0, Math.min((cur|0) - 3, P.length - 8));
    for(let i = 0; i < 8; i++){ const k = top + i, ins = P[k]; if(!ins) break; const here = k === cur && cpu.last;
      g += (here ? '<rect x="16" y="'+(30+i*18)+'" width="188" height="17" rx="3" class="cpcur"/>' : '')+'<text x="24" y="'+(43+i*18)+'" class="cpa">'+k+'</text><text x="48" y="'+(43+i*18)+'" class="cpi'+(here ? ' on' : '')+'">'+esc(ins.txt.length > 19 ? ins.txt.slice(0,18)+'…' : ins.txt)+'</text>'; }
    if(!P.length) g += '<text x="110" y="100" text-anchor="middle" class="cpa">načti program</text>';
    // řadič
    g += blk('ctl', 228, 10, 178, 170, 'ŘADIČ');
    g += reg('ir', 238, 30, 158, 40, 'IR', cpu.ir) + reg('pc', 238, 98, 66, 40, 'PC', cpu.pc) + '<g class="cr'+o('dec')+'"><rect x="314" y="98" width="82" height="72" rx="5"/><text x="320" y="110" class="crl">DEKODÉR</text><text x="355" y="142" text-anchor="middle" class="crv">'+(L && op && L !== 'fetch' ? op : '—')+'</text></g>';
    g += w('pIr', 'M210 50H236') + w('pcP', 'M238 118H212') + w('irDec', 'M355 70V96') + w('irPc', 'M271 70V96');
    // datová paměť
    g += blk('dmem', 430, 10, 160, 380, 'DATOVÁ PAMĚŤ');
    cpu.mem.forEach((v, i) => { const c = i % 4, r = (i / 4) | 0, x0 = 438 + c * 37, y0 = 30 + r * 88;
      g += '<g class="cm'+o('m'+i)+(i === 2 ? ' tgt' : '')+'"><rect x="'+x0+'" y="'+y0+'" width="33" height="80" rx="5"/><text x="'+(x0+16.5)+'" y="'+(y0+14)+'" text-anchor="middle" class="crl">M'+i+'</text><text x="'+(x0+16.5)+'" y="'+(y0+50)+'" text-anchor="middle" class="cmv">'+v+'</text></g>'; });
    // sběrnice
    g += '<path class="cbus'+o('ab')+'" d="M228 205H428" marker-end="url(#cpuAr'+(A.ab ? 'On' : '')+')"/><text x="236" y="199" class="cbl">adresová sběrnice</text>';
    g += '<path class="cbus'+o('db')+'" d="M218 240H428" marker-start="url(#cpuAr'+(A.db ? 'On' : '')+')" marker-end="url(#cpuAr'+(A.db ? 'On' : '')+')"/><text x="236" y="233" class="cbl">datová sběrnice</text>';
    g += w('irAb', 'M398 50H416V203', false) + w('irDb', 'M396 62H406V238', false);
    // ALU, střadač, příznaky
    g += '<g class="cb alu'+o('alu')+'"><path d="M240 280H292L300 292L308 280H360L336 330H264Z"/><text x="300" y="318" text-anchor="middle" class="cbt">ALU</text></g>';
    g += w('dbAlu', 'M266 242V278') + w('aluAcc', 'M300 330V346');
    g += reg('acc', 250, 348, 100, 40, 'STŘADAČ', cpu.acc) + reg('fl', 370, 348, 27, 40, 'Z', cpu.z) + reg('fl', 400, 348, 27, 40, 'N', cpu.nf);
    g += w('accAlu', 'M350 358H360V268H334V277') + w('accDb', 'M250 368H226V242');
    return '<div class="cpuwrap"><svg class="cpusvg" viewBox="0 0 600 400" role="img" aria-label="Schéma střadačového procesoru">'+g+'</svg></div>';
  }
  function render(){
    const T = TASKS[ti];
    labShell(2, 'Naprogramuj procesor · úloha '+(ti+1)+'/'+TASKS.length,
      '<p><b>'+esc(T.t)+'</b></p><div class="cpu"><div class="cpu-code"><label class="mono small muted" for="asm">Program</label><textarea id="asm" class="notes code-ed" spellcheck="false">'+esc(code)+'</textarea>'+
      '<div class="row" style="margin-top:8px"><button class="btn ghost" id="rs">Načíst a reset</button><button class="btn ghost" id="st">Krok (fáze)</button><button class="btn ghost" id="ru">Spustit</button><button class="btn" id="ck">Ověřit testy</button></div>'+
      '<p class="mono small muted">'+HELP+'</p></div>'+
      '<div class="cpu-state">'+(err?'<p class="er">'+esc(err)+'</p>':'')+diagram()+
      '<div class="phases">'+['fetch','decode','execute'].map(p => '<span class="'+(cpu.phase===p&&!cpu.halted?'on':'')+'">'+p+'</span>').join('')+'<em class="mono small muted">další fáze</em></div>'+
      '<p class="mono small cpudesc">'+(cpu.halted?'<b style="color:var(--ok)">HALT</b> · ':'')+(cpu.last === 'fetch' ? 'FETCH: instrukce z adresy '+cpu.at+' je v IR, PC = '+cpu.pc : cpu.dec ? (cpu.last === 'decode' ? 'DECODE: ' : 'EXECUTE: ')+esc(cpu.dec) : 'Krokuj tlačítkem „Krok (fáze)“ a sleduj, kudy tečou data.')+'</p></div></div>',
      'Fetch: IR ← instrukce z paměti programu, PC++. Decode: dekodér určí operaci. Execute: ALU nebo řadič ji provede. Z = výsledek je nula, N = výsledek je záporný.');
    const ta = $('#asm'); ta.oninput = () => { code = ta.value; };
    $('#rs').onclick = load; $('#st').onclick = () => { if(!prog) load(); phaseStep(); beep('tick'); render(); };
    $('#ru').onclick = () => { if(!prog) load(); if(!runAll(cpu, prog)) err = 'Program běžel moc dlouho – nekonečný cyklus?'; cpu.phase = 'fetch'; cpu.last = null; cpu.cur = null; render(); };
    $('#ck').onclick = check;
  }
  function load(){
    err = ''; try{ prog = parse(code); }catch(e){ err = e.message; prog = []; }
    reset(tests(TASKS[ti]).pop().m); render();
  }
  function check(){
    try{ prog = parse(code); }catch(e){ err = e.message; render(); return; }
    let ok = 0; const res = [], TS = tests(TASKS[ti]);
    for(const t of TS){ const c = {}; reset(t.m); Object.assign(c, cpu); const fin = runAll(c, prog); const good = fin && c.mem[2] === t.want; if(good) ok++; res.push((good?'✓':'✗')+' M[0]='+t.m[0]+', M[1]='+t.m[1]+' → M[2]='+c.mem[2]+(good?'':' (má být '+t.want+')')); }
    if(ok === TS.length){ beep('ok'); toast('Úloha splněna!'); addXP(15); ti++; if(ti >= TASKS.length) return labDone(2, 'Všechny programy fungují', [[TASKS.length, 'úloh']], 25, () => LABS[2].find(l => l.name === 'Naprogramuj procesor').run(2)); code = TASKS[ti].start; prog = null; reset([]); render(); }
    else { beep('bad'); err = 'Testy: '+ok+'/'+TS.length+'\n'+res.join('\n'); render(); }
  }
  reset([]); render();
});

/* ---------- T3: PLA programátor (kreativní) ---------- */
cre(3, 'Naprogramuj PLA', 'Propal propojky ve schématu PLA (pole AND a OR) tak, aby výstup odpovídal pravdivostní tabulce. Signály vidíš svítit přímo ve vodičích.', n => {
  const LIT = ['A','¬A','B','¬B','C','¬C'];
  const FN = [
    {name:'Y = A·B + ¬C', f:(a,b,c) => (a&&b)||!c},
    {name:'Y = A ⊕ B', f:(a,b) => a!==b},
    {name:'Y = majorita(A, B, C)', f:(a,b,c) => (a+b+c) >= 2},
    {name:'Y = ¬A·¬B·¬C + A·B·C', f:(a,b,c) => (!a&&!b&&!c)||(a&&b&&c)}
  ];
  let lvl = 0, andM, orM, hint = false, tries = 0, cur = 0;
  function reset(){ andM = Array.from({length:4}, () => Array(6).fill(0)); orM = Array(4).fill(0); hint = false; }
  function term(i){ const l = andM[i].map((v,k) => v ? LIT[k] : null).filter(Boolean); return l.length ? l.join('·') : null; }
  const lits = x => { const a = !!(x&4), b = !!(x&2), c = !!(x&1); return [a,!a,b,!b,c,!c]; };
  const prod = (i, val) => andM[i].some(Boolean) ? andM[i].every((v,k) => !v || val[k]) : null;
  function evalY(a,b,c){ const val = [a,!a,b,!b,c,!c]; let y = false; for(let i = 0; i < 4; i++) if(orM[i] && prod(i, val)) y = true; return y; }
  function schema(){
    const val = lits(cur), LX = [62, 92, 162, 192, 262, 292], PY = [128, 184, 240, 296], OX = 438, ON = '#61e38c', OFF = '#33433d';
    const col = v => v ? ON : OFF, P = PY.map((_, i) => prod(i, val)), y = [0,1,2,3].some(i => orM[i] && P[i]);
    let g = '<defs><filter id="plaGlow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>';
    g += '<rect x="34" y="96" width="336" height="236" rx="8" class="plaplane"/><text x="362" y="326" text-anchor="end" class="plapl">POLE AND</text>';
    g += '<rect x="404" y="96" width="70" height="236" rx="8" class="plaplane"/><text x="466" y="326" text-anchor="end" class="plapl">OR</text>';
    // vstupy, přepínače, invertory
    ['A','B','C'].forEach((nm, j) => {
      const v = !!(cur & (4 >> j)), x = LX[j*2], xi = LX[j*2+1], cx = (x + xi) / 2;
      g += '<g class="plasw" data-j="'+j+'"><rect x="'+(cx-22)+'" y="6" width="44" height="26" rx="13" class="'+(v ? 'on' : '')+'"/><circle cx="'+(v ? cx+9 : cx-9)+'" cy="19" r="9" class="plakn"/><text x="'+(cx-34)+'" y="24" text-anchor="end" class="plain">'+nm+'</text></g>';
      g += '<path d="M'+cx+' 32V46H'+x+'V90M'+cx+' 46H'+xi+'V54" stroke="'+col(v)+'" class="plaw"/>';
      g += '<path d="M'+(xi-7)+' 54H'+(xi+7)+'L'+xi+' 66Z" class="plainv"/><circle cx="'+xi+'" cy="69" r="3" class="plainv"/><path d="M'+xi+' 72V90" stroke="'+col(!v)+'" class="plaw"/>';
    });
    LX.forEach((x, k) => { g += '<path d="M'+x+' 90V320" stroke="'+col(val[k])+'" class="plaw'+(val[k] ? ' hot' : '')+'"/><text x="'+x+'" y="88" text-anchor="middle" class="plalit">'+LIT[k]+'</text>'; });
    // součiny
    PY.forEach((py, i) => {
      const pv = P[i], used = pv !== null;
      g += '<path d="M44 '+py+'H318" stroke="'+(used ? col(pv) : OFF)+'" class="plaw'+(used ? '' : ' unused')+(pv ? ' hot' : '')+'"/>';
      g += '<path d="M318 '+(py-15)+'H334A15 15 0 0 1 334 '+(py+15)+'H318Z" class="plagate'+(pv ? ' on' : '')+'"/><text x="331" y="'+(py+4)+'" text-anchor="middle" class="plagt">&amp;</text>';
      g += '<path d="M349 '+py+'H486" stroke="'+(used ? col(pv) : OFF)+'" class="plaw'+(pv ? ' hot' : '')+'"/><text x="492" y="'+(py-6)+'" class="plap">P'+(i+1)+'</text><text x="492" y="'+(py+9)+'" class="plat">'+esc(term(i) || 'nepoužit')+'</text>';
      LX.forEach((x, k) => { const on = andM[i][k]; g += '<g class="plafuse'+(on ? ' on' : '')+'" data-i="'+i+'" data-k="'+k+'"><circle cx="'+x+'" cy="'+py+'" r="12" class="plahit"/>'+(on ? '<circle cx="'+x+'" cy="'+py+'" r="6.5" class="pladot" filter="url(#plaGlow)"/>' : '<path d="M'+(x-4)+' '+(py-4)+'l8 8M'+(x+4)+' '+(py-4)+'l-8 8" class="plaxx"/>')+'</g>'; });
      const on = orM[i]; g += '<g class="plafuse or'+(on ? ' on' : '')+'" data-o="'+i+'"><circle cx="'+OX+'" cy="'+py+'" r="12" class="plahit"/>'+(on ? '<circle cx="'+OX+'" cy="'+py+'" r="6.5" class="pladot" filter="url(#plaGlow)"/>' : '<path d="M'+(OX-4)+' '+(py-4)+'l8 8M'+(OX+4)+' '+(py-4)+'l-8 8" class="plaxx"/>')+'</g>';
    });
    // OR hradlo a výstup
    g += '<path d="M'+OX+' 104V338" stroke="'+col(y)+'" class="plaw'+(y ? ' hot' : '')+'"/>';
    g += '<path d="M'+(OX-18)+' 338Q'+OX+' 346 '+(OX+18)+' 338Q'+(OX+18)+' 364 '+OX+' 378Q'+(OX-18)+' 364 '+(OX-18)+' 338Z" class="plagate'+(y ? ' on' : '')+'"/><text x="'+OX+'" y="360" text-anchor="middle" class="plagt">≥1</text>';
    g += '<path d="M'+OX+' 378V388H500" stroke="'+col(y)+'" class="plaw'+(y ? ' hot' : '')+'"/><circle cx="514" cy="388" r="11" class="plaled'+(y ? ' on' : '')+'"/><text x="534" y="393" class="plain">Y</text>';
    return '<svg class="plasvg" viewBox="0 0 580 404" role="img" aria-label="Schéma PLA">'+g+'</svg>';
  }
  function render(){
    const F = FN[lvl]; let rows = '', ok = true;
    for(let x = 0; x < 8; x++){ const a = !!(x&4), b = !!(x&2), c = !!(x&1); const y = evalY(a,b,c), t = !!F.f(a,b,c); if(y !== t) ok = false; rows += '<tr class="plarow'+(y===t?'':' miss')+(x===cur?' cur':'')+'" data-x="'+x+'"><td>'+(+a)+'</td><td>'+(+b)+'</td><td>'+(+c)+'</td><td><b>'+(+y)+'</b></td><td>'+(+t)+'</td></tr>'; }
    const expr = [0,1,2,3].filter(i => orM[i] && term(i)).map(term).join(' + ') || '0';
    labShell(3, 'Naprogramuj PLA · funkce '+(lvl+1)+'/'+FN.length,
      '<p>Klikáním na křížení propal propojky: v poli <b>AND</b> vyber, které vstupy jdou do součinu P1–P4, v poli <b>OR</b> které součiny jdou na výstup Y. Přepínači A, B, C nebo kliknutím na řádek tabulky zkoušíš vstupy – vodiče s hodnotou 1 svítí.</p>'+
      '<div class="pla"><div class="plawrap">'+schema()+'</div>'+
      '<div class="tblwrap"><table class="tbl"><tr><th>A</th><th>B</th><th>C</th><th>Y tvoje</th><th>Y cíl</th></tr>'+rows+'</table></div></div>'+
      '<p class="mono plaexpr">Y = '+esc(expr)+'</p>'+(hint?'<p class="muted small">Nápověda: '+esc(F.name)+'</p>':'')+
      '<div class="row"><button class="btn" id="dn"'+(ok?'':' disabled')+'>'+(ok?'Funguje! Další funkce':'Výstup zatím nesedí')+'</button><button class="btn ghost" id="hn">Nápověda</button><button class="btn ghost" id="cl">Smazat</button></div>',
      'Součet součinů: každý řádek tabulky, kde má být Y = 1, pokryje aspoň jeden součin. Nepoužitý součin (bez propojek) se nepočítá. ● = propojeno, × = propojka přerušená.');
    $$('.plafuse').forEach(b => b.onclick = () => { if(b.dataset.o != null){ orM[+b.dataset.o] ^= 1; } else { andM[+b.dataset.i][+b.dataset.k] ^= 1; } tries++; beep('tick'); render(); });
    $$('.plasw').forEach(b => b.onclick = () => { cur ^= (4 >> +b.dataset.j); beep('tick'); render(); });
    $$('.plarow').forEach(r => r.onclick = () => { cur = +r.dataset.x; render(); });
    $('#hn').onclick = () => { hint = true; render(); }; $('#cl').onclick = () => { reset(); render(); };
    $('#dn').onclick = () => { beep('ok'); lvl++; if(lvl >= FN.length) return labDone(3, 'PLA naprogramováno', [[FN.length, 'funkcí'], [tries, 'propálení']], 35, () => LABS[3].find(l => l.name === 'Naprogramuj PLA').run(3)); toast('Funkce sedí!'); reset(); render(); };
  }
  reset(); render();
});

/* ---------- T3: LED matice 8×8 (kreativní) ---------- */
cre(3, 'LED matice 8×8', 'Kresli na LED panel (jako světelné tabule s 74595) a sleduj, jaké bajty bys do registrů poslal. Nebo zadej hex a zobraz obrázek.', n => {
  const ICONS = {'srdce':[0x00,0x66,0xFF,0xFF,0x7E,0x3C,0x18,0x00], 'smajlík':[0x3C,0x42,0xA5,0x81,0xA5,0x99,0x42,0x3C], 'šipka':[0x18,0x3C,0x7E,0xFF,0x18,0x18,0x18,0x18], 'písmeno M':[0x81,0xC3,0xA5,0x99,0x81,0x81,0x81,0x00], 'čip':[0x00,0x7E,0x42,0x5A,0x5A,0x42,0x7E,0x00]};
  let mode = 'draw', px = lsGet('led', Array(8).fill(0)), target = null, tname = '', solved = 0;
  let scan = 'static', mx = {r:0, bit:0, sr:0, out:0, act:-1, ds:-1, clk:'', timer:null};
  const stopScan = () => { clearInterval(mx.timer); mx.timer = null; };
  function applyScan(){
    const mod = $('#lmod'); if(!mod){ stopScan(); return; }
    $$('#lmod .lm').forEach(b => { const r = +b.dataset.r, c = +b.dataset.c, bit = (px[r] >> (7-c)) & 1;
      const lit = scan === 'static' ? bit : r === mx.act && ((mx.out >> (7-c)) & 1);
      b.classList.toggle('on', !!lit); b.classList.toggle('ghost', scan !== 'static' && !lit && !!bit); });
    $$('#lmod .lpin.c').forEach(p => { const c = +p.dataset.c; p.classList.toggle('on', scan === 'static' ? false : !!((mx.out >> (7-c)) & 1)); });
    $$('#lmod .lpin.r').forEach(p => p.classList.toggle('on', scan === 'static' || +p.dataset.r === mx.act));
    $$('.src i').forEach((cell, k) => { const v = (mx.sr >> (7-k)) & 1; cell.textContent = scan === 'static' ? '·' : v; cell.classList.toggle('on', scan !== 'static' && !!v); cell.classList.toggle('new', scan === 'slow' && k === 7 && mx.clk === 'sh'); });
    const st = $('#srs'); if(st) st.innerHTML = scan === 'static' ? 'Statický obraz: oko vidí všechny řádky najednou. Zapni multiplex a uvidíš, jak to doopravdy funguje.' :
      scan === 'fast' ? 'Rychlý multiplex: v každé chvíli svítí jen jeden řádek – při stovkách Hz to oko slije do celého obrázku.' :
      mx.clk === 'st' ? '<b>ST_CP ↑</b> – latch: bajt <b>'+hx(mx.out)+'</b> se zapíše na výstupy Q7–Q0 a rozsvítí se <b>řádek '+mx.act+'</b>.' :
      '<b>SH_CP ↑</b> – řádek '+mx.r+', bit '+mx.bit+'/8: na DS je <b>'+mx.ds+'</b>, registr se posune o jedno místo.';
    ['ds','sh','st'].forEach(k => { const e = $('#sig-'+k); if(e) e.classList.toggle('on', scan === 'slow' && (k === 'ds' ? mx.ds === 1 && mx.clk === 'sh' : mx.clk === k)); });
  }
  function tick(){
    if(!$('#lmod')){ stopScan(); return; }
    if(scan === 'fast'){ mx.r = (mx.r + 1) % 8; mx.sr = mx.out = px[mx.r]; mx.act = mx.r; mx.clk = ''; }
    else if(mx.bit < 8){ mx.ds = (px[mx.r] >> (7 - mx.bit)) & 1; mx.sr = ((mx.sr << 1) | mx.ds) & 255; mx.bit++; mx.clk = 'sh'; }
    else if(mx.clk !== 'st'){ mx.out = mx.sr; mx.act = mx.r; mx.clk = 'st'; }
    else { mx.r = (mx.r + 1) % 8; mx.bit = 0; mx.clk = ''; mx.ds = -1; }
    applyScan();
  }
  function setScan(m){ scan = m; stopScan(); mx = {r:0, bit:0, sr:0, out:0, act:-1, ds:-1, clk:'', timer:null}; if(m !== 'static') mx.timer = setInterval(tick, m === 'slow' ? 260 : 70); }
  function module(){
    const cols = [0,1,2,3,4,5,6,7];
    return '<div class="lmod" id="lmod"><div class="lmhole"></div><div class="lmhole r"></div>'+
      '<div class="lmmcu"><div class="ic"><b>MCU</b><small>STM32</small></div><div class="lmsig"><span id="sig-ds">DS</span><span id="sig-sh">SH_CP</span><span id="sig-st">ST_CP</span></div></div>'+
      '<div class="lmcol"><div class="ic wide"><b>74HC595</b><small>sloupce · Q7…Q0</small></div><div class="lpins h">'+cols.map(c => '<span class="lpin c" data-c="'+c+'"><em>Q'+(7-c)+'</em></span>').join('')+'</div></div>'+
      '<div class="lmrow"><div class="ic tall"><b>ŘÁDKY</b><small>budič</small></div><div class="lpins v">'+cols.map(r => '<span class="lpin r" data-r="'+r+'"><em>R'+r+'</em></span>').join('')+'</div></div>'+
      grid(px, true)+'<div class="lmsilk">LED MATRIX 8×8 · 1588BS</div></div>';
  }
  const hx = v => '0x'+v.toString(16).toUpperCase().padStart(2,'0');
  function grid(bytes, clickable){ let s = '<div class="ledm">'; for(let r = 0; r < 8; r++) for(let c = 0; c < 8; c++){ const on = (bytes[r] >> (7-c)) & 1; s += '<button class="lm'+(on?' on':'')+'" data-r="'+r+'" data-c="'+c+'"'+(clickable?'':' disabled')+' aria-label="LED '+r+','+c+'"></button>'; } return s+'</div>'; }
  function render(){
    let inner = '<div class="row" style="margin-bottom:12px"><button class="btn '+(mode==='draw'?'':'ghost')+'" id="mdraw">Volné kreslení</button><button class="btn '+(mode==='chal'?'':'ghost')+'" id="mchal">Výzva: zadej hex</button></div>';
    if(mode === 'draw'){
      inner += '<div class="seg ledseg">'+[['static','Statický obraz'],['slow','Multiplex pomalu'],['fast','Multiplex rychle']].map(m => '<button class="'+(scan===m[0]?'on':'')+'" data-s="'+m[0]+'">'+m[1]+'</button>').join('')+'</div>'+
        '<div class="ledwrap"><div>'+module()+'<div class="srp"><span class="srl">posuvný registr 74HC595</span><div class="src">'+[7,6,5,4,3,2,1,0].map(k => '<i data-q="'+k+'">·</i>').join('')+'</div><p class="srs" id="srs"></p></div></div><div><div class="tblwrap"><table class="tbl"><tr><th>Řádek</th><th>Binárně (Q7…Q0)</th><th>Hex</th></tr>'+px.map((b,r) => '<tr><td>'+r+'</td><td>'+b.toString(2).padStart(8,'0')+'</td><td>'+hx(b)+'</td></tr>').join('')+'</table></div>'+
        '<pre class="code">const uint8_t obr[8] = {'+px.map(hx).join(', ')+'};</pre>'+
        '<div class="row"><button class="btn ghost" id="inv">Invertovat</button><button class="btn ghost" id="shl">Posun ←</button><button class="btn ghost" id="shr">Posun →</button><button class="btn ghost" id="clr2">Smazat</button></div>'+
        '<div class="row" style="margin-top:8px">'+Object.keys(ICONS).map(k => '<button class="btn ghost icn" data-k="'+k+'">'+k+'</button>').join('')+'</div></div></div>';
    } else {
      if(!target){ const ks = Object.keys(ICONS); tname = ks[ri(0, ks.length-1)]; target = ICONS[tname]; }
      const cur = Array.from({length:8}, (_,r) => { const v = parseInt((($('#h'+r)||{}).value||'0'), 16); return isNaN(v) ? 0 : v & 255; });
      inner += '<p>Zobraz na matici obrázek <b>'+esc(tname)+'</b>: zadej 8 hodnot v hex (jeden bajt = jeden řádek, MSB vlevo). Vyřešeno: '+solved+'</p>'+
        '<div class="ledwrap"><div><p class="mono small muted">cíl</p>'+grid(target, false)+'</div><div><p class="mono small muted">tvoje matice</p><div id="mine">'+grid(cur, false)+'</div></div>'+
        '<div class="hexin">'+Array.from({length:8}, (_,r) => '<label class="mono small">řádek '+r+' 0x<input id="h'+r+'" class="oct" maxlength="2" inputmode="text" autocomplete="off"></label>').join('')+'<button class="btn" id="hchk">Odeslat do registrů</button></div></div>';
    }
    labShell(3, 'LED matice 8×8', inner, mode === 'draw' ? 'Každý řádek je jeden bajt – přesně tolik bitů nasuneš do jednoho 74595. Obrázek se ukládá v prohlížeči.' : 'Nápověda: 1111 1111 = 0xFF, 0001 1000 = 0x18, 0011 1100 = 0x3C.');
    $('#mdraw').onclick = () => { mode = 'draw'; render(); }; $('#mchal').onclick = () => { mode = 'chal'; setScan('static'); render(); };
    if(mode === 'draw'){
      $$('.lm').forEach(b => b.onclick = () => { px[+b.dataset.r] ^= (1 << (7 - +b.dataset.c)); lsSet('led', px); beep('tick'); render(); });
      $$('.ledseg button').forEach(b => b.onclick = () => { setScan(b.dataset.s); render(); });
      applyScan();
      $('#inv').onclick = () => { px = px.map(b => (~b) & 255); lsSet('led', px); render(); };
      $('#shl').onclick = () => { px = px.map(b => (b << 1) & 255); lsSet('led', px); render(); };
      $('#shr').onclick = () => { px = px.map(b => b >> 1); lsSet('led', px); render(); };
      $('#clr2').onclick = () => { px = Array(8).fill(0); lsSet('led', px); render(); };
      $$('.icn').forEach(b => b.onclick = () => { px = ICONS[b.dataset.k].slice(); lsSet('led', px); render(); });
    } else {
      const upd = () => { const cur = Array.from({length:8}, (_,r) => { const v = parseInt($('#h'+r).value || '0', 16); return isNaN(v) ? 0 : v & 255; }); $('#mine').innerHTML = grid(cur, false); return cur; };
      $$('.hexin input').forEach(i => i.oninput = upd);
      $('#hchk').onclick = () => { const cur = upd(); if(cur.every((v,r) => v === target[r])){ beep('ok'); solved++; addXP(10); toast('Obrázek sedí!'); target = null; render(); } else { beep('bad'); toast('Některé řádky ještě nesedí.'); } };
    }
  }
  render();
});

/* ---------- T4: otevřený kolektor a třístav ---------- */
lab(4, 'Sběrnice: OC a třístav', 'Urči úroveň sběrnice podle výstupů zařízení.', calcLab(4, 'Sběrnice s otevřeným kolektorem a třístavem', () => {
  if(Math.random() < .5){
    const st = Array.from({length:3}, () => Math.random() < .35 ? 'stahuje do 0' : 'uvolněno');
    const lvl = st.includes('stahuje do 0') ? '0' : '1 (díky pull-up rezistoru)';
    return mcqOf('Otevřený kolektor s pull-up: zařízení A '+st[0]+', B '+st[1]+', C '+st[2]+'. Jaká je úroveň sběrnice?', 'Log. '+lvl, ['Log. '+(lvl[0]==='0'?'1 (díky pull-up rezistoru)':'0'), 'Nedefinovaná (visí ve vzduchu)', 'Zkrat – dvě zařízení vysílají zároveň'], 4);
  }
  const en = Array.from({length:3}, () => Math.random() < .45), val = Array.from({length:3}, () => ri(0,1));
  const act = en.map((e,i) => e ? i : -1).filter(i => i >= 0);
  const desc = ['A','B','C'].map((x,i) => x+': OE '+(en[i]?'aktivní, dává '+val[i]:'neaktivní (Hi-Z)')).join(' · ');
  let ans;
  if(!act.length) ans = 'Nikdo nevysílá – sběrnice je ve vysoké impedanci';
  else if(act.length === 1) ans = 'Sběrnice má hodnotu '+val[act[0]]+' od zařízení '+'ABC'[act[0]];
  else ans = new Set(act.map(i => val[i])).size > 1 ? 'Kolize – aktivní výstupy se přetlačují (zkrat)' : 'Více aktivních výstupů – nepovolený stav, hrozí kolize';
  return mcqOf('Třístavové výstupy na sběrnici: '+desc+'. Co je na sběrnici?', ans, ['Nikdo nevysílá – sběrnice je ve vysoké impedanci','Sběrnice má hodnotu 1 díky pull-up rezistoru','Kolize – aktivní výstupy se přetlačují (zkrat)','Sběrnice má hodnotu 0 od zařízení A','Sběrnice má hodnotu 1 od zařízení C'], 4);
}, 'Otevřený kolektor: kdokoli stáhne do 0 → 0 (wired AND). Třístav: smí vysílat jen jeden výstup s aktivním OE, ostatní jsou Hi-Z.'));

/* ---------- T5: teploměrový kód ---------- */
lab(5, 'Teploměrový kód', 'Z napětí urči výstupy komparátorů flash převodníku a binární výsledek.', calcLab(5, 'Teploměrový kód (3bitový flash ADC)', () => {
  const ux = Math.round((Math.random()*7.8 + .1)*10)/10, k = Math.min(7, Math.floor(ux));
  const th = '1'.repeat(k).padStart(7,'0');
  if(Math.random() < .5) return mcqOf('3bitový flash ADC, Uref = 8 V (komparátory na 1, 2 … 7 V). Ux = '+fmt(ux,1)+' V. Výstupy komparátorů K7…K1?', th, ['1'.repeat(Math.min(7,k+1)).padStart(7,'0'), '1'.repeat(Math.max(0,k-1)).padStart(7,'0'), k.toString(2).padStart(7,'0')], 5);
  return mcqOf('3bitový flash ADC, Uref = 8 V. Ux = '+fmt(ux,1)+' V. Jaký je binární výstup dekodéru?', k.toString(2).padStart(3,'0'), [Math.min(7,k+1).toString(2).padStart(3,'0'), Math.max(0,k-1).toString(2).padStart(3,'0'), (7-k).toString(2).padStart(3,'0')], 5);
}, 'Komparátor Ki dá 1, když Ux > i V. Počet jedniček v teploměrovém kódu = binární výsledek.'));

/* ---------- T6: výpočet WT/TAT ---------- */
lab(6, 'Spočítej WT a TAT', 'Z tabulky procesů urči průměrnou čekací dobu.', calcLab(6, 'Průměrná čekací doba', () => {
  const alg = Math.random() < .5 ? 'FCFS' : 'SJF';
  const P = Array.from({length:3}, (_,i) => ({at: i===0?0:ri(0,4), bt: ri(1,7), n:'P'+(i+1)})).sort((a,b) => a.at-b.at).map((p,i) => ({...p, n:'P'+(i+1)}));
  let t = 0; const done = [], left = P.slice();
  while(left.length){ let r = left.filter(p => p.at <= t); if(!r.length){ t = Math.min(...left.map(p => p.at)); continue; }
    const p = alg === 'FCFS' ? r[0] : r.slice().sort((a,b) => a.bt-b.bt || a.at-b.at)[0]; t += p.bt; p.ct = t; done.push(p); left.splice(left.indexOf(p),1); }
  const wt = P.reduce((s,p) => s + (p.ct-p.at-p.bt), 0)/3;
  const q = mcqOf(alg+': '+P.map(p => p.n+' (AT '+p.at+', BT '+p.bt+')').join(', ')+'. Průměrné WT?', fmt(wt,2), [fmt(wt+1,2), fmt(Math.max(0,wt-1),2), fmt(P.reduce((s,p) => s + (p.ct-p.at), 0)/3,2)], 6);
  return q;
}, 'TAT = CT − AT, WT = TAT − BT. FCFS: v pořadí příchodu. SJF: z čekajících nejkratší BT (nepreemptivně).'));

/* ---------- T7: producent–konzument se semafory ---------- */
lab(7, 'Producent–konzument se semafory', 'Sleduj semafory empty, full a mutex při vkládání a odebírání.', n => {
  const N = ri(2,3); let empty = N, full = 0; const steps = [];
  for(let s = 0; s < 7; s++){
    const prod = full === 0 ? true : empty === 0 ? false : Math.random() < .5;
    if(prod){ steps.push({txt:'Producent vloží položku (WAIT(empty), WAIT(mutex), vlož, SIGNAL(mutex), SIGNAL(full)).', ans:'empty = '+(empty-1)+', full = '+(full+1), ws:['empty = '+(empty+1)+', full = '+(full-1 < 0 ? 0 : full-1), 'empty = '+(empty-1)+', full = '+full, 'empty = '+empty+', full = '+(full+1)], e:empty, f:full}); empty--; full++; }
    else { steps.push({txt:'Konzument odebere položku (WAIT(full), WAIT(mutex), odeber, SIGNAL(mutex), SIGNAL(empty)).', ans:'empty = '+(empty+1)+', full = '+(full-1), ws:['empty = '+(empty-1)+', full = '+(full+1), 'empty = '+empty+', full = '+(full-1), 'empty = '+(empty+1)+', full = '+full], e:empty, f:full}); empty++; full--; }
  }
  steps.push({txt:'Buffer je plný? Producent chce vložit další položku – co se stane, když empty = 0?', ans:'Producent se zablokuje na WAIT(empty), dokud konzument něco neodebere', ws:['Producent přepíše nejstarší položku v bufferu','Semafor empty přejde na −1 a položka se vloží','Konzument se zablokuje a producent vloží položku'], e:0, f:N});
  runQuiz({title:'Producent–konzument (buffer '+N+')', total:steps.length, lives:null, record:false, next:i => { const s = steps[i], q = mcqOf('Buffer má '+N+' místa. Stav: empty = '+s.e+', full = '+s.f+', mutex = 1. '+s.txt+(i < steps.length-1 ? ' Jaké budou hodnoty potom?' : ''), s.ans, s.ws, 7);
      const pr = /Producent/.test(s.txt);
      q.html = '<div class="pkx"><div class="pkw'+(pr ? ' isact' : '')+'"><svg viewBox="0 0 40 40"><circle cx="20" cy="11" r="7"/><path d="M8 38c0-9 5-15 12-15s12 6 12 15"/></svg><b>producent</b>'+(pr ? '<em>vkládá →</em>' : '')+'</div>'+
        '<div class="pkbuf"><span>buffer · '+N+' místa</span><div>'+Array.from({length:N}, (_, k) => '<i class="'+(k < s.f ? 'full' : '')+'">'+(k < s.f ? '■' : '')+'</i>').join('')+'</div></div>'+
        '<div class="pkw'+(!pr ? ' isact' : '')+'"><svg viewBox="0 0 40 40"><circle cx="20" cy="11" r="7"/><path d="M8 38c0-9 5-15 12-15s12 6 12 15"/></svg><b>konzument</b>'+(!pr ? '<em>← odebírá</em>' : '')+'</div>'+
        '<div class="pksem"><span><b>'+s.e+'</b>empty</span><span><b>'+s.f+'</b>full</span><span><b>1</b>mutex</span></div></div>';
      return q; },
    extra:() => '<p class="muted small">empty = volná místa, full = obsazená místa, mutex chrání buffer před současným přístupem.</p>',
    back:() => renderTopic(7), again:() => LABS[7].find(l => l.name === 'Producent–konzument se semafory').run(7)});
});

/* ---------- T8: počet výpadků ---------- */
lab(8, 'Kolik bude výpadků?', 'Spočítej výpadky stránek pro FIFO a LRU v hlavě.', calcLab(8, 'Počet výpadků stránek', () => {
  const alg = Math.random() < .5 ? 'FIFO' : 'LRU', F = 3; const refs = []; while(refs.length < 9){ const p = ri(1,5); if(refs[refs.length-1] !== p) refs.push(p); }
  const fr = [], t = {}; let f = 0;
  refs.forEach((p,i) => { if(fr.includes(p)){ if(alg === 'LRU') t[p] = i; return; } f++; if(fr.length < F){ fr.push(p); t[p] = i; return; } let v = fr[0]; fr.forEach(q => { if(t[q] < t[v]) v = q; }); fr[fr.indexOf(v)] = p; t[p] = i; });
  return mcqOf(alg+', 3 rámce, reference: '+refs.join(' ')+'. Kolik výpadků stránky?', String(f), [String(f+1), String(f-1), String(f+2)], 8);
}, 'Do prázdných rámců se stránky načtou (každé načtení je výpadek). FIFO vyhodí nejstarší načtenou, LRU nejdéle nepoužitou.'));

/* ---------- T9: pohyb hlavičky ---------- */
lab(9, 'Spočítej pohyb hlavičky', 'Celkový pohyb pro FCFS a SSTF.', calcLab(9, 'Pohyb hlavičky disku', () => {
  const alg = Math.random() < .5 ? 'FCFS' : 'SSTF', h = ri(20,180), rq = []; while(rq.length < 5){ const r = ri(0,199); if(r !== h && !rq.includes(r)) rq.push(r); }
  let cur = h, tot = 0; const order = [];
  if(alg === 'FCFS') rq.forEach(r => { tot += Math.abs(r-cur); cur = r; order.push(r); });
  else { const p = rq.slice(); while(p.length){ p.sort((a,b) => Math.abs(a-cur)-Math.abs(b-cur)); const r = p.shift(); tot += Math.abs(r-cur); cur = r; order.push(r); } }
  return mcqOf(alg+': hlavička na '+h+', fronta '+rq.join(', ')+'. Celkový pohyb hlavičky (stopy)?', String(tot), [String(tot+ri(8,30)), String(Math.max(1,tot-ri(8,30))), String(rq.reduce((s,r) => s+Math.abs(r-h), 0))], 9);
}, 'Sčítej vzdálenosti mezi po sobě obslouženými stopami. SSTF jde vždy k nejbližšímu požadavku.'));

/* ---------- T10: CSMA/CD ---------- */
lab(10, 'Postup CSMA/CD', 'Seřaď, co dělá stanice v Ethernetu.', orderLab(10, 'Postup CSMA/CD', 'Stanice chce poslat rámec po sdíleném Ethernetu. Seřaď kroky.', ['Naslouchá, jestli je médium volné','Médium je volné – začne vysílat','Detekuje kolizi','Přestane vysílat a pošle JAM signál','Počká náhodnou dobu (backoff)','Zkusí vysílat znovu']));
lab(10, 'Token Ring krok za krokem', 'Seřaď předávání tokenu.', orderLab(10, 'Token Ring', 'Seřaď, jak probíhá přenos v Token Ringu.', ['Stanice čeká, až k ní dorazí token','Připojí data k tokenu a pošle je dál po kruhu','Cílová stanice data přečte a označí jako přijatá','Rámec oběhne kruh zpět k odesílateli','Odesílatel ověří příjem a uvolní token dalším']));

/* ---------- T11: maska v binárce + mini Packet Tracer (kreativní) ---------- */
lab(11, 'Maska v binárce', 'Naklikej masku ze zadaného prefixu bit po bitu.', n => {
  let round = 0, bits = 0; let p = ri(17,30); const R = 5; let mistakes = 0;
  const dot = v => [v>>>24,(v>>>16)&255,(v>>>8)&255,v&255].join('.');
  function render(){
    let s = '<div class="mkocts">';
    for(let o = 0; o < 4; o++){ const val = (bits >>> (24 - 8*o)) & 255; s += '<div class="mkoct"><span class="mkl">'+(o+1)+'. oktet</span><div class="mkbits">';
      for(let k = 31 - 8*o; k >= 24 - 8*o; k--) s += '<button class="bitc'+((bits>>>k)&1?' on':'')+'" data-k="'+k+'"><b>'+((bits>>>k)&1)+'</b><span>'+(32-k)+'</span></button>';
      s += '</div><b class="mkv">'+val+'</b><span class="mkw">'+[128,64,32,16,8,4,2,1].filter((w,j) => (val >> (7-j)) & 1).join(' + ')+'</span></div>'; }
    const bin = (bits>>>0).toString(2).padStart(32,'0'), ones = bin.indexOf('0') < 0 ? 32 : bin.indexOf('0'), contig = /^1*0*$/.test(bin);
    s += '</div><div class="mksplit'+(contig ? '' : ' bad')+'">'+(contig ? '<i style="flex:'+Math.max(ones, .001)+'"><b>síťová část</b><span>/'+ones+'</span></i><i class="h" style="flex:'+Math.max(32-ones, .001)+'"><b>'+(32-ones < 9 ? 'host' : 'hostitelská část')+'</b><span>'+(32-ones)+' b</span></i>' : '<i class="x"><b>maska není souvislá – jedničky musí jít zleva bez mezery</b></i>')+'</div>';
    labShell(11, 'Maska v binárce · '+(round+1)+'/'+R, '<p>Naklikej masku pro prefix <b>/'+p+'</b>. Maska je souvislý blok jedniček zleva.</p>'+s+
      '<p class="mono">'+dot(bits>>>0)+' · wildcard '+dot((~bits)>>>0)+'</p><div class="row"><button class="btn" id="ok">Zkontrolovat</button><button class="btn ghost" id="z">Vynulovat</button></div><p class="mono small muted">chyby: '+mistakes+'</p>', 'Číslo pod bitem = pořadí bitu zleva (1–32).');
    $$('.bitc').forEach(b => b.onclick = () => { bits = (bits ^ (1 << +b.dataset.k))>>>0; beep('tick'); render(); });
    $('#z').onclick = () => { bits = 0; render(); };
    $('#ok').onclick = () => { const want = p ? ((0xFFFFFFFF << (32-p))>>>0) : 0; if((bits>>>0) === want){ beep('ok'); toast('/'+p+' = '+dot(want)); round++; if(round >= R) return labDone(11, 'Masky zvládnuté', [[mistakes, 'chyby']], Math.max(8, 30-mistakes*4), () => LABS[11].find(l => l.name === 'Maska v binárce').run(11)); p = ri(8,30); bits = 0; render(); } else { mistakes++; beep('bad'); toast('Nesedí – správně je '+dot(want)); } };
  }
  render();
});
cre(11, 'Mini Packet Tracer', 'Postav síť jako v Cisco Packet Traceru: vlož router, switche a PC, propoj je správnými kabely, klikni na PC a nastav IP adresu. Pak pingni.', n => {
  const ip2n = s => { const p = String(s).trim().split('.'); if(p.length !== 4 || p.some(x => !/^\d{1,3}$/.test(x) || +x > 255)) return null; return ((+p[0]<<24)|(+p[1]<<16)|(+p[2]<<8)|(+p[3]))>>>0; };
  const n2ip = v => [v>>>24,(v>>>16)&255,(v>>>8)&255,v&255].join('.');
  const maskP = m => { const v = ip2n(m); if(v == null) return null; const b = v.toString(2).padStart(32,'0'); return /^1*0*$/.test(b) ? b.indexOf('0') < 0 ? 32 : b.indexOf('0') : null; };
  const PORTS = {rt:['Gi0/0','Gi0/1','Gi0/2'], sw:['Fa0/1','Fa0/2','Fa0/3','Fa0/4','Fa0/5','Fa0/6','Gi0/1','Gi0/2'], pc:['Fa0']};
  const KIND = {rt:'Router', sw:'Switch', pc:'PC'}, MAX = {rt:1, sw:4, pc:2};
    let W = 720, H = 330;
  const size = () => { [W, H] = innerWidth < 600 ? [400, 500] : [720, 330]; };
  let lvl = 0, scen, devs, links, cfg, log, tool = 'move', pend = null, sim = null, drag = null, uid = 0;

  const dev = id => devs.find(d => d.id === id);
  const byName = nm => devs.find(d => d.name === nm);
  const used = (d, p) => links.some(l => (l.a.d === d.id && l.a.p === p) || (l.b.d === d.id && l.b.p === p));
  const isSw = t => t === 'sw';
  const linkOk = l => { const A = dev(l.a.d).type, B = dev(l.b.d).type; return l.cross ? isSw(A) === isSw(B) : isSw(A) !== isSw(B); };
  const lname = l => dev(l.a.d).name+' '+l.a.p+' ↔ '+dev(l.b.d).name+' '+l.b.p;
  const pairName = l => { const t = [dev(l.a.d).type, dev(l.b.d).type].sort().join('-'); return {'sw-sw':'dvěma switchi', 'pc-pc':'dvěma PC', 'rt-rt':'dvěma routery', 'pc-rt':'PC a routerem'}[t] + (t === 'sw-sw' ? '' : ' (stejný typ rozhraní)'); };
  const why = l => l.cross ? 'mezi switchem a koncovým zařízením (PC, router) patří přímý kabel' : 'mezi '+pairName(l)+' patří křížený kabel';
  const IF = () => ({'Gi0/0':scen.r1, 'Gi0/1':scen.r2});
  function add(type, x, y){
    let k = 1; while(byName(KIND[type]+k)) k++;
    const d = {id:++uid, type, name:KIND[type]+k, x, y}; devs.push(d);
    if(type === 'pc' && !cfg[d.name]) cfg[d.name] = {ip:'', mask:'', gw:''};
    return d;
  }
  const link = (a, ap, b, bp, cross) => links.push({a:{d:a.id, p:ap}, b:{d:b.id, p:bp}, cross:!!cross});

  function build(){
    const X = ri(1,250), Y = ri(1,250);
    devs = []; links = []; cfg = {}; log = []; pend = null; sim = null; tool = 'move';
    if(lvl === 0) scen = {p:24, r1:'192.168.'+X+'.1', r2:'10.0.'+Y+'.1', sw:true,
      task:'Postav síť: PC1 a PC2 každé za svým switchem, oba switche zapoj do routeru. Pak nastav počítače, aby PC1 pingl PC2.'};
    else if(lvl === 1){ const b = [64,128][ri(0,1)]; scen = {p:26, r1:'192.168.'+X+'.'+(b+1), r2:'172.16.'+Y+'.'+(b-63), direct:true,
      task:'Sítě jsou /26. PC1 tentokrát zapoj do routeru napřímo, bez switche (pozor na typ kabelu), PC2 přes switch. Spočítej rozsahy a pingni.'}; }
    else {
      scen = {p:24, r1:'192.168.'+X+'.1', r2:'10.0.'+Y+'.1', task:'Síť postavil někdo před tebou a ping neprochází. Najdi a oprav chybu – v kabeláži, nebo v nastavení.'};
      size(); const L = W < 600 ? [[70,80],[220,80],[330,240],[220,400],[70,400]] : [[70,150],[210,150],[360,150],[510,150],[650,150]];
      const p1 = add('pc', ...L[0]), s1 = add('sw', ...L[1]), r = add('rt', ...L[2]), s2 = add('sw', ...L[3]), p2 = add('pc', ...L[4]);
      const n1 = ip2n(scen.r1) & 0xFFFFFF00, n2 = ip2n(scen.r2) & 0xFFFFFF00;
      cfg.PC1 = {ip:n2ip((n1+10)>>>0), mask:'255.255.255.0', gw:scen.r1}; cfg.PC2 = {ip:n2ip((n2+20)>>>0), mask:'255.255.255.0', gw:scen.r2};
      const bug = ri(0,6), w = ri(0,1), pc = cfg['PC'+(w+1)];
      link(p1, 'Fa0', s1, 'Fa0/1'); link(s1, 'Gi0/1', r, 'Gi0/0', bug === 6);
      link(r, bug === 4 ? 'Gi0/2' : 'Gi0/1', s2, 'Gi0/1'); if(bug !== 5) link(s2, 'Fa0/1', p2, 'Fa0');
      if(bug === 0) pc.gw = n2ip(ip2n(w ? scen.r2 : scen.r1) + 1);
      else if(bug === 1) pc.mask = '255.0.0.0';
      else if(bug === 2) pc.ip = n2ip(((w ? n1 : n2) + 30)>>>0);
      else if(bug === 3) pc.ip = n2ip(((w ? n2 : n1) + 255)>>>0);
    }
  }

  /* ---- průchod sítí: z PC přes switche až k rozhraní routeru ---- */
  function adj(id){ return links.filter(l => linkOk(l) && (l.a.d === id || l.b.d === id)).map(l => l.a.d === id ? {to:l.b.d, their:l.b.p} : {to:l.a.d, their:l.a.p}); }
  function seg(pc){
    const prev = new Map([[pc.id, null]]), q = [pc.id], ports = [];
    while(q.length){ const c = q.shift(); for(const e of adj(c)){ const t = dev(e.to);
      if(t.type === 'rt'){ ports.push({port:e.their, from:c, rt:t.id}); continue; }
      if(prev.has(e.to)) continue; prev.set(e.to, c); if(t.type === 'sw') q.push(e.to); } }
    const path = p => { const out = [p.rt]; let c = p.from; while(c != null){ out.push(c); c = prev.get(c); } return out.reverse(); };
    return {ports, path};
  }
  function check(){
    const out = [], fail = (m, reach, path) => { out.push('✗ '+m); return {out, reach:reach||0, path:path||[]}; };
    const p1 = byName('PC1'), p2 = byName('PC2'), rt = devs.find(d => d.type === 'rt');
    if(!p1 || !p2) return fail('v síti chybí '+(!p1 ? 'PC1' : 'PC2')+' – přidej ho z lišty pod plochou');
    if(!rt) return fail('v síti chybí router');
    const bad = links.find(l => !linkOk(l)); if(bad) return fail('kabel '+lname(bad)+' svítí červeně: '+why(bad));
    const ifs = IF(), seen = [], paths = [];
    for(const pc of [p1, p2]){
      if(!links.some(l => l.a.d === pc.id || l.b.d === pc.id)) return fail(pc.name+' nemá zapojený kabel');
      const s = seg(pc);
      if(!s.ports.length) return fail(pc.name+' se po kabelech nedostane k routeru');
      if(s.ports.length > 1) return fail('za '+pc.name+' jsou propojená dvě rozhraní routeru ('+s.ports.map(p => p.port).join(', ')+') – každé rozhraní potřebuje vlastní síť');
      const port = s.ports[0].port, path = s.path(s.ports[0]);
      if(!ifs[port]) return fail(pc.name+' vede do '+rt.name+' '+port+', které nemá IP adresu – použij Gi0/0 nebo Gi0/1');
      if(scen.sw && path.length < 3) return fail('v tomhle úkolu má být '+pc.name+' připojené přes switch');
      if(scen.direct && pc === p1 && path.length !== 2) return fail('v tomhle úkolu připoj PC1 do routeru napřímo, bez switche');
      seen.push(port); paths.push(path);
    }
    if(seen[0] === seen[1]) return fail('PC1 i PC2 jsou za stejným rozhraním '+seen[0]+' – úkol chce každé PC v jiné síti za routerem');
    const full = paths[0].concat(paths[1].slice().reverse().slice(1));
    const P = scen.p, M = (0xFFFFFFFF << (32-P))>>>0;
    for(let i = 0; i < 2; i++){
      const nm = 'PC'+(i+1), c = cfg[nm], ip = ip2n(c.ip), mp = maskP(c.mask), gw = ip2n(c.gw), R = ifs[seen[i]], r = ip2n(R), rnet = (r & M)>>>0;
      const f = m => fail(nm+': '+m, i, full);
      if(ip == null) return f('neplatná IP adresa');
      if(mp == null) return f('neplatná maska (musí být souvislé jedničky)');
      if(gw == null) return f('neplatná výchozí brána');
      if(((ip & M)>>>0) !== rnet) return f('IP '+n2ip(ip)+' neleží v síti rozhraní '+seen[i]+' ('+n2ip(rnet)+'/'+P+')');
      if(ip === rnet || ip === ((rnet | ~M)>>>0)) return f(n2ip(ip)+' je adresa sítě nebo broadcast');
      if(ip === r) return f('IP koliduje s rozhraním routeru');
      if(mp !== P) return f('maska /'+mp+' neodpovídá síti /'+P+(mp < P ? ' – PC si myslí, že cíl je v jeho síti, a ARP nikdo nezodpoví' : ''));
      if(gw !== r) return f('brána '+n2ip(gw)+' není rozhraní routeru, za kterým PC je ('+seen[i]+' = '+R+')');
      out.push('✓ '+nm+' nastaveno správně');
    }
    out.push('Odpověď od '+cfg.PC2.ip+': bajtů=32 čas<1ms TTL=127');
    return {out, reach:3, path:full};
  }

  /* ---- kreslení ---- */
  function icon(d){
    const on = pend && pend.d === d.id, s = on ? 'var(--led-on)' : 'var(--copper)', st = ' fill="var(--chip)" stroke="'+s+'" stroke-width="1.8"', ln = ' fill="none" stroke="'+s+'" stroke-width="1.8" stroke-linecap="round"';
    let g;
    if(d.type === 'rt') g = '<circle r="21"'+st+'/><path d="M-11 -11L-4 -4M-4 -9V-4H-9M11 11L4 4M4 9V4H9M11 -11L4 -4M4 -9V-4H9M-11 11L-4 4M-4 9V4H-9"'+ln+'/>';
    else if(d.type === 'sw') g = '<rect x="-27" y="-14" width="54" height="28" rx="4"'+st+'/><path d="M-17 -5H17M12 -9L17 -5L12 -1M17 5H-17M-12 1L-17 5L-12 9"'+ln+'/>';
    else g = '<rect x="-17" y="-18" width="34" height="24" rx="2"'+st+'/><rect x="-13" y="-14" width="26" height="16" fill="#0d2a22"/><path d="M0 6V11M-8 12H8"'+ln+'/>';
    const sub = d.type === 'pc' ? (cfg[d.name] && cfg[d.name].ip) || 'bez IP' : d.type === 'rt' ? '2911' : '2960';
    return '<g data-dev="'+d.id+'" transform="translate('+d.x+' '+d.y+')"><rect x="-32" y="-26" width="64" height="76" fill="transparent"/>'+g+
      '<text y="36" text-anchor="middle" font-size="12" fill="var(--silk)">'+esc(d.name)+'</text><text y="49" text-anchor="middle" font-size="10" fill="var(--silk-dim)">'+esc(sub)+'</text></g>';
  }
  function wire(l, i){
    const A = dev(l.a.d), B = dev(l.b.d), dx = B.x - A.x, dy = B.y - A.y, L = Math.hypot(dx, dy) || 1, ux = dx/L, uy = dy/L;
    const ok = linkOk(l), lit = sim && sim.lit.has(l.a.d+'-'+l.b.d) || sim && sim.lit.has(l.b.d+'-'+l.a.d);
    const at = (P, t) => [P.x + ux*t*(P === A ? 1 : -1), P.y + uy*t*(P === A ? 1 : -1)];
    const lt = Math.min(30, L/2 - 4), tx = Math.min(52, L/2 - 4), a1 = at(A, lt), b1 = at(B, lt), a2 = at(A, tx), b2 = at(B, tx);
    const col = lit ? 'var(--led-on)' : l.cross ? '#9cc3ff' : 'var(--copper)';
    return '<g data-link="'+i+'"><line x1="'+A.x+'" y1="'+A.y+'" x2="'+B.x+'" y2="'+B.y+'" stroke="transparent" stroke-width="14"/>'+
      '<line x1="'+A.x+'" y1="'+A.y+'" x2="'+B.x+'" y2="'+B.y+'" stroke="'+col+'" stroke-width="2.2"'+(l.cross ? ' stroke-dasharray="7 5"' : '')+'/>'+
      [a1, b1].map(p => '<circle cx="'+p[0].toFixed(1)+'" cy="'+p[1].toFixed(1)+'" r="4.5" fill="'+(ok ? 'var(--led-on)' : 'var(--bad)')+'"/>').join('')+
      [[a2, l.a.p], [b2, l.b.p]].map(q => '<text x="'+q[0][0].toFixed(1)+'" y="'+(q[0][1] - 7).toFixed(1)+'" text-anchor="middle" font-size="9.5" fill="var(--silk-dim)" paint-order="stroke" stroke="var(--chip-2)" stroke-width="3">'+q[1]+'</text>').join('')+'</g>';
  }
  function drawNet(){
    const svg = $('#ptnet'); if(!svg) return;
    svg.setAttribute('class', 'ptnet t-'+tool);
    let s = links.map(wire).join('') + devs.map(icon).join('');
    if(!devs.length) s += '<text x="'+W/2+'" y="'+H/2+'" text-anchor="middle" font-size="13" fill="var(--silk-dim)">Prázdná plocha – vyber zařízení v liště dole a klikni sem</text>';
    if(sim) s += '<g id="ptenv" transform="translate('+sim.x+' '+sim.y+')"><rect x="-10" y="-17" width="20" height="13" rx="1.5" fill="#f3e3b5" stroke="#8a6c34"/><path d="M-10 -17L0 -9L10 -17" fill="none" stroke="#8a6c34"/></g>' +
      (sim.end ? '<text x="'+sim.x+'" y="'+(sim.y - 24)+'" text-anchor="middle" font-size="20" font-weight="700" fill="'+(sim.end === 'ok' ? 'var(--led-on)' : 'var(--bad)')+'">'+(sim.end === 'ok' ? '✓' : '✗')+'</text>' : '');
    svg.innerHTML = s;
  }
  const IC = {
    move:'<path d="M6 3l13 7.5-5.6 1.7L10.6 18z"/>',
    rt:'<circle cx="12" cy="12" r="9"/><path d="M6.5 12h4M8.8 10l2 2-2 2M17.5 12h-4M15.2 10l-2 2 2 2M12 6.5v2.5M12 15v2.5"/>',
    sw:'<rect x="2.5" y="6.5" width="19" height="11" rx="2"/><path d="M6 10.5h12M15.5 8.5l2.5 2-2.5 2M18 13.5H6M8.5 11.5l-2.5 2 2.5 2"/>',
    pc:'<rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M12 16v3M8 20h8"/>',
    straight:'<path d="M6 12h12"/><circle cx="4" cy="12" r="2"/><circle cx="20" cy="12" r="2"/>',
    cross:'<path d="M5 6l14 12M5 18L19 6" stroke-dasharray="3.2 2.4"/>',
    del:'<path d="M4 7h16M10 3.5h4M6 7l1 13h10l1-13M10 11v5.5M14 11v5.5"/>',
    clear:'<rect x="4" y="4" width="16" height="16" rx="2" stroke-dasharray="3 2.6"/><path d="M9 9l6 6M15 9l-6 6"/>',
    x:'<path d="M6 6l12 12M18 6L6 18"/>',
    swap:'<path d="M4 8.5h15M15.5 5l3.5 3.5-3.5 3.5M20 15.5H5M8.5 12L5 15.5 8.5 19"/>',
    ping:'<rect x="3" y="6" width="18" height="12" rx="1.5"/><path d="M3.5 7l8.5 6 8.5-6"/>'
  };
  const ico = k => '<svg class="pti" viewBox="0 0 24 24" aria-hidden="true">'+IC[k]+'</svg>';
  const TOOLGRP = [['Zařízení', [['rt','Router'],['sw','Switch'],['pc','PC']]], ['Kabely', [['straight','Přímý'],['cross','Křížený']]], ['Úpravy', [['move','Výběr'],['del','Smazat']]]];
  const MODEL = {rt:'Router 2911', sw:'Switch 2960', pc:'PC-PT'}, ACC = {rt:'router', sw:'switch', pc:'počítač'};
  let pop = null;

  function status(){
    const el = $('#ptstat'); if(!el) return;
    el.textContent = tool in MAX ? 'Klikni na plochu, kam chceš '+KIND[tool].toLowerCase()+' umístit.' :
      tool === 'straight' || tool === 'cross' ? (pend ? 'Kabel z '+dev(pend.d).name+' '+pend.p+' – klikni na druhé zařízení'+(TOUCH ? '.' : ' (Esc zruší).') : (tool === 'cross' ? 'Křížený' : 'Přímý')+' kabel: klikni na první zařízení a vyber port.') :
      tool === 'del' ? 'Mazání: klikni na zařízení nebo kabel, který chceš odstranit.' : 'Klikni na zařízení nebo kabel – otevře se jeho nastavení. Zařízení můžeš přetahovat.';
    $$('.ptbar [data-t]').forEach(b => b.setAttribute('aria-pressed', b.dataset.t === tool));
  }
  const drawAll = () => { drawNet(); status(); };

  /* plovoucí okýnko u zařízení (menu portů i nastavení) */
  function placeAt(m, x, y){
    const svg = $('#ptnet'), wrap = $('.ptwrap'), r = svg.getBoundingClientRect(), wr = wrap.getBoundingClientRect(), sc = r.width / W, mw = m.offsetWidth;
    const ox = r.left - wr.left, oy = r.top - wr.top, right = ox + (x + 36) * sc, left = ox + (x - 36) * sc - mw;
    if(right + mw <= wr.width){ m.style.left = right + 'px'; m.style.top = Math.max(0, oy + (y - 30) * sc) + 'px'; }
    else if(left >= 0){ m.style.left = left + 'px'; m.style.top = Math.max(0, oy + (y - 30) * sc) + 'px'; }
    else { m.style.left = Math.max(0, (wr.width - mw) / 2) + 'px'; m.style.top = (oy + (y + 54) * sc) + 'px'; }
  }
  function hideMenu(){ const m = $('#ptmenu'); if(m) m.hidden = true; }
  function hidePop(){ pop = null; const m = $('#ptpop'); if(m) m.hidden = true; }
  function portMenu(d, cb){
    hidePop();
    const m = $('#ptmenu');
    m.innerHTML = '<div class="pthd">'+esc(d.name)+' · vyber port</div>'+PORTS[d.type].map(p => '<button data-p="'+p+'"'+(used(d, p) ? ' disabled' : '')+'>'+p+
      (d.type === 'rt' ? '<i>'+(IF()[p] || 'bez IP')+'</i>' : used(d, p) ? '<i>obsazeno</i>' : '')+'</button>').join('');
    m.hidden = false; placeAt(m, d.x, d.y);
    m.querySelectorAll('button').forEach(b => b.onclick = e => { e.stopPropagation(); hideMenu(); beep('tick'); cb(b.dataset.p); });
  }
  const peer = (d, p) => { const l = links.find(l => (l.a.d === d.id && l.a.p === p) || (l.b.d === d.id && l.b.p === p)); if(!l) return null; const o = l.a.d === d.id ? l.b : l.a; return {l, txt:dev(o.d).name+' '+o.p}; };
  function delDev(d){ devs = devs.filter(x => x !== d); links = links.filter(l => l.a.d !== d.id && l.b.d !== d.id); if(pend && !dev(pend.d)) pend = null; sim = null; hidePop(); beep('tick'); drawAll(); }
  function delLink(l){ links = links.filter(x => x !== l); sim = null; hidePop(); beep('tick'); drawAll(); }
  function devPop(d){
    hideMenu(); pop = {d};
    const m = $('#ptpop'), row = p => { const q = peer(d, p); return '<tr><td>'+p+'</td>'+(d.type === 'rt' ? '<td>'+(IF()[p] ? IF()[p]+'/'+scen.p : '<span class="muted">bez IP</span>')+'</td>' : '')+
      '<td class="'+(q ? linkOk(q.l) ? 'ptok' : 'ptbad' : 'muted')+'">'+(q ? '● '+esc(q.txt) : 'volný')+'</td></tr>'; };
    let body = '';
    if(d.type === 'pc'){
      const c = cfg[d.name];
      body = '<div class="ptsec">IP konfigurace</div>'+[['ip','IP adresa','např. 192.168.1.10'],['mask','Maska','255.255.255.0'],['gw','Výchozí brána','IP routeru']].map(f =>
        '<label class="ptfld"><span>'+f[1]+'</span><input type="text" class="oct ip" data-k="'+f[0]+'" value="'+esc(c[f[0]])+'" placeholder="'+f[2]+'" autocomplete="off" spellcheck="false" inputmode="decimal"></label>').join('')+
        '<div class="ptsec">Port</div><table class="ptports">'+row('Fa0')+'</table>';
    } else if(d.type === 'rt') body = '<div class="ptsec">Rozhraní</div><table class="ptports">'+PORTS.rt.map(row).join('')+'</table>';
    else { const us = PORTS.sw.filter(p => used(d, p)); body = '<div class="ptsec">Zapojené porty</div><table class="ptports">'+(us.length ? us.map(row).join('') : '<tr><td class="muted">žádný kabel</td></tr>')+'</table><div class="muted ptnote">volných portů: '+(PORTS.sw.length - us.length)+' z '+PORTS.sw.length+'</div>'; }
    m.innerHTML = '<div class="pthead">'+ico(d.type)+'<b>'+esc(d.name)+'</b><span>'+MODEL[d.type]+'</span><button class="ptx" data-act="x" aria-label="Zavřít">'+ico('x')+'</button></div>'+body+
      '<div class="ptacts"><button class="del" data-act="del">'+ico('del')+'Smazat '+ACC[d.type]+'</button></div>';
    m.hidden = false; placeAt(m, d.x, d.y);
    m.querySelector('[data-act="x"]').onclick = hidePop;
    m.querySelector('[data-act="del"]').onclick = () => delDev(d);
    m.querySelectorAll('input').forEach(inp => {
      inp.oninput = () => { cfg[d.name][inp.dataset.k] = inp.value.trim(); if(inp.dataset.k === 'ip') drawNet(); };
      inp.onkeydown = e => { if(e.key === 'Enter' || e.key === 'Escape'){ e.preventDefault(); hidePop(); } };
    });
  }
  function linkPop(l){
    hideMenu(); pop = {l};
    const m = $('#ptpop'), A = dev(l.a.d), B = dev(l.b.d), ok = linkOk(l);
    m.innerHTML = '<div class="pthead">'+ico(l.cross ? 'cross' : 'straight')+'<b>'+(l.cross ? 'Křížený' : 'Přímý')+' kabel</b><button class="ptx" data-act="x" aria-label="Zavřít">'+ico('x')+'</button></div>'+
      '<table class="ptports"><tr><td>'+esc(A.name)+'</td><td>'+l.a.p+'</td></tr><tr><td>'+esc(B.name)+'</td><td>'+l.b.p+'</td></tr></table>'+
      '<p class="'+(ok ? 'ptok' : 'ptbad')+' ptnote">● '+(ok ? 'kontrolky svítí zeleně – kabel je správně' : 'svítí červeně: '+why(l))+'</p>'+
      '<div class="ptacts"><button data-act="swap">'+ico('swap')+'Změnit na '+(l.cross ? 'přímý' : 'křížený')+'</button><button class="del" data-act="del">'+ico('del')+'Smazat kabel</button></div>';
    m.hidden = false; placeAt(m, (A.x + B.x) / 2, (A.y + B.y) / 2);
    m.querySelector('[data-act="x"]').onclick = hidePop;
    m.querySelector('[data-act="del"]').onclick = () => delLink(l);
    m.querySelector('[data-act="swap"]').onclick = () => { l.cross = !l.cross; sim = null; beep(linkOk(l) ? 'ok' : 'bad'); drawNet(); linkPop(l); };
  }
  function toSvg(e){ const svg = $('#ptnet'), pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; return pt.matrixTransform(svg.getScreenCTM().inverse()); }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  function bindNet(){
    const svg = $('#ptnet');
    svg.onpointerdown = e => {
      if(sim && sim.run) return;
      const p = toSvg(e), g = e.target.closest('[data-dev]'), lk = e.target.closest('[data-link]'), d = g && dev(+g.dataset.dev), l = !d && lk ? links[+lk.dataset.link] : null;
      hideMenu(); hidePop();
      if(tool in MAX){
        if(devs.filter(x => x.type === tool).length >= MAX[tool]){ beep('bad'); toast('V tomhle úkolu stačí '+MAX[tool]+'× '+KIND[tool].toLowerCase()); return; }
        add(tool, clamp(p.x, 34, W - 34), clamp(p.y, 28, H - 54)); beep('tick'); tool = 'move'; sim = null; return drawAll();
      }
      if(tool === 'del'){ if(d) delDev(d); else if(l) delLink(l); return; }
      if(tool === 'straight' || tool === 'cross'){
        if(!d){ pend = null; drawNet(); return status(); }
        if(pend && pend.d === d.id){ pend = null; drawNet(); return status(); }
        if(!PORTS[d.type].some(q => !used(d, q))){ beep('bad'); toast(d.name+' nemá volný port'); return; }
        if(!pend) portMenu(d, q => { pend = {d:d.id, p:q}; drawNet(); status(); });
        else portMenu(d, q => { links.push({a:pend, b:{d:d.id, p:q}, cross:tool === 'cross'}); const nl = links[links.length-1]; pend = null; sim = null; drawNet(); status();
          if(!linkOk(nl)){ beep('bad'); toast('Kabel svítí červeně – '+why(nl)); } });
        return;
      }
      if(d){ drag = {d, dx:p.x - d.x, dy:p.y - d.y, sx:p.x, sy:p.y, moved:false}; try{ svg.setPointerCapture(e.pointerId); }catch(err){} }
      else if(l) linkPop(l);
    };
    svg.onpointermove = e => {
      if(!drag) return; const p = toSvg(e);
      if(!drag.moved && Math.hypot(p.x - drag.sx, p.y - drag.sy) < 6) return;
      drag.moved = true; drag.d.x = clamp(p.x - drag.dx, 34, W - 34); drag.d.y = clamp(p.y - drag.dy, 28, H - 54); if(sim && !sim.run) sim = null; drawNet();
    };
    svg.onpointerup = () => { if(drag && !drag.moved) devPop(drag.d); drag = null; };
    svg.onpointercancel = () => { drag = null; };
  }

  function animate(path, reach, done){
    const pts = path.map(id => dev(id));
    const seq = reach === 3 ? pts.concat(pts.slice(0, -1).reverse()) : reach === 1 ? pts : pts.slice(0, 1);
    sim = {run:true, lit:new Set(), x:seq[0].x, y:seq[0].y, end:null};
    let k = 0, t0 = performance.now();
    const step = now => {
      if(!$('#ptnet')) return;
      if(k >= seq.length - 1){ sim.run = false; sim.end = reach === 3 ? 'ok' : 'bad'; drawNet(); return done(); }
      const A = seq[k], B = seq[k+1], t = Math.min(1, (now - t0) / 330);
      sim.x = A.x + (B.x - A.x) * t; sim.y = A.y + (B.y - A.y) * t;
      if(t >= 1){ sim.lit.add(A.id+'-'+B.id); k++; t0 = now; beep('tick'); }
      drawNet(); requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function render(){
    size(); devs.forEach(d => { d.x = clamp(d.x, 34, W - 34); d.y = clamp(d.y, 28, H - 54); }); pop = null;
    const btn = (t, lb) => '<button class="pttool'+(t === 'del' ? ' danger' : '')+'" data-t="'+t+'" aria-pressed="false" title="'+lb+'">'+ico(t)+'<span>'+lb+'</span></button>';
    labShell(11, 'Mini Packet Tracer · úroveň '+(lvl+1)+'/3',
      '<p><b>'+esc(scen.task)+'</b></p>'+
      '<p class="ptinfo">'+ico('rt')+'<span>Rozhraní routeru: <b>Gi0/0</b> '+scen.r1+'/'+scen.p+' · <b>Gi0/1</b> '+scen.r2+'/'+scen.p+' · <b>Gi0/2</b> bez IP</span></p>'+
      '<div class="ptwrap"><svg id="ptnet" class="ptnet" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Pracovní plocha sítě"></svg><div class="ptmenu" id="ptmenu" hidden></div><div class="ptpop" id="ptpop" hidden></div></div>'+
      '<div class="ptbar">'+TOOLGRP.map(g => '<div class="ptgrp"><span>'+g[0]+'</span><div>'+g[1].map(t => btn(t[0], t[1])).join('')+
        (g[0] === 'Úpravy' && lvl < 2 ? '<button class="pttool" id="ptclr" title="Vyčistit plochu">'+ico('clear')+'<span>Vyčistit</span></button>' : '')+'</div></div>').join('')+'</div>'+
      '<div class="ptstat" id="ptstat"></div>'+
      '<div class="row"><button class="btn" id="ping">'+ico('ping')+'ping PC2 z PC1</button></div>'+
      '<pre class="code term-log" id="ptlog">'+esc(log.join('\n') || 'C:\\> _')+'</pre>',
      'Klikni na zařízení – otevře se jeho nastavení (IP adresa, porty, smazání). Přímý kabel: PC↔switch a switch↔router. Křížený: PC↔router, switch↔switch. Brána = IP rozhraní routeru, ke kterému PC vede kabel.');
    bindNet();
    $$('.ptbar [data-t]').forEach(b => b.onclick = () => { tool = b.dataset.t; pend = null; hideMenu(); hidePop(); drawNet(); status(); });
    if($('#ptclr')) $('#ptclr').onclick = () => { if(sim && sim.run) return; if(devs.length && !confirm('Smazat celou síť z plochy?')) return; devs = []; links = []; pend = null; sim = null; hideMenu(); hidePop(); drawAll(); };
    $('#ping').onclick = () => {
      if(sim && sim.run) return;
      hideMenu(); hidePop(); pend = null; status();
      const r = check(), ok = r.reach === 3;
      log = ['C:\\> ping '+((cfg.PC2 && cfg.PC2.ip) || '?')]; $('#ptlog').textContent = log.join('\n');
      const fin = () => {
        log = log.concat(r.out); const lg = $('#ptlog'); if(lg) lg.textContent = log.join('\n');
        if(!ok){ beep('bad'); return; }
        beep('ok'); toast('Ping prošel!'); addXP(15);
        setTimeout(() => { if(!$('#ptnet')) return; lvl++; if(lvl >= 3) return labDone(11, 'Síť funguje', [[3, 'úrovně']], 20, () => LABS[11].find(l => l.name === 'Mini Packet Tracer').run(11)); build(); render(); window.scrollTo(0,0); }, 1100);
      };
      if(r.path.length) animate(r.path, r.reach, fin); else { sim = null; drawNet(); fin(); }
    };
    onKey = e => {
      if(e.target && e.target.closest && e.target.closest('input')) return;
      if(e.key === 'Escape'){ pend = null; tool = 'move'; hideMenu(); hidePop(); drawNet(); status(); }
      else if((e.key === 'Delete' || e.key === 'Backspace') && pop){ e.preventDefault(); if(pop.d) delDev(pop.d); else if(pop.l) delLink(pop.l); }
    };
    drawAll();
  }
  lvl = 0; build(); render();
});

/* ---------- T12: druhý terminálový scénář (procesy, roury, proměnné) ---------- */
lab(12, 'Terminál 2: roury a proměnné', 'Další úkoly v shellu: roury, head/tail, proměnné prostředí.', n => {
  const out = ['Druhý scénář. Napiš help pro příkazy.']; const done = {}; let ti = 0, cmds = 0; const hist = [];
  const FILES = {'/var/log/syslog':'boot ok\nsshd started\nkernel: usb 1-1 connected\nvsftpd started\nsshd: accepted password for student\ncron: job done', '/etc/passwd':'root:x:0:0:root:/root:/bin/bash\nstudent:x:1000:1000:Student:/home/student:/bin/bash\nftp:x:14:50:FTP:/var/ftp:/sbin/nologin', '/home/student/znamky.txt':'matematika 2\ncestina 1\nhardware 1\nsite 3\nanglictina 2'};
  const ENV = {HOME:'/home/student', USER:'student', SHELL:'/bin/bash', PATH:'/usr/local/bin:/usr/bin:/bin', PWD:'/home/student'};
  const tasks = [
    ['Vypiš hodnotu proměnné HOME.', () => done.home],
    ['Vypiš, kde shell hledá programy (proměnná PATH).', () => done.path],
    ['Vypiš z /var/log/syslog jen řádky obsahující sshd (použij rouru nebo grep).', () => done.sshd],
    ['Vypiš první 2 řádky souboru znamky.txt.', () => done.head2],
    ['Seřaď soubor znamky.txt (sort).', () => done.sort],
    ['Spočítej řádky v /etc/passwd (wc -l).', () => done.wc]
  ];
  function read(p){ if(!p.startsWith('/')) p = '/home/student/' + p; if(FILES[p] == null) throw new Error(p+': soubor neexistuje'); return {p, c:FILES[p]}; }
  function ex(line, input){
    const a = line.trim().split(/\s+/); const c = a[0], g = a.slice(1);
    const expand = s => s.replace(/\$(\w+)/g, (_,v) => ENV[v] != null ? ENV[v] : '');
    switch(c){
      case 'help': return 'echo $PROM, env, cat, grep, head -n N, tail -n N, sort, wc -l, ls, pwd · roura |';
      case 'echo': { const t = expand(g.join(' ')); if(g.join(' ') === '$HOME') done.home = true; if(g.join(' ') === '$PATH') done.path = true; return t; }
      case 'env': case 'printenv': if(!g.length) return Object.keys(ENV).map(k => k+'='+ENV[k]).join('\n'); if(g[0] === 'HOME') done.home = true; if(g[0] === 'PATH') done.path = true; return ENV[g[0]] || '';
      case 'pwd': return ENV.PWD;
      case 'ls': return 'znamky.txt';
      case 'cat': { if(!g.length) return input || ''; return read(g[0]).c; }
      case 'grep': { const pat = (g[0]||'').replace(/['"]/g,''); let txt = input || '', from = ''; if(g[1]){ const r = read(g[1]); txt = r.c; from = r.p; } else if(input === FILES['/var/log/syslog']) from = '/var/log/syslog'; const res = txt.split('\n').filter(l => l.includes(pat)).join('\n'); if(from === '/var/log/syslog' && pat === 'sshd') done.sshd = true; return res; }
      case 'head': case 'tail': { const k = g.indexOf('-n'); const N = k >= 0 ? +g[k+1] : 10; const f = g.filter((x,i) => i !== k && i !== k+1)[0]; let txt = input || '', p = ''; if(f){ const r = read(f); txt = r.c; p = r.p; } else if(input === FILES['/home/student/znamky.txt']) p = '/home/student/znamky.txt'; const ls = txt.split('\n'); const res = (c==='head' ? ls.slice(0,N) : ls.slice(-N)); if(c === 'head' && N === 2 && p === '/home/student/znamky.txt') done.head2 = true; return res.join('\n'); }
      case 'sort': { let txt = input || '', p = ''; if(g[0] && !g[0].startsWith('-')){ const r = read(g[0]); txt = r.c; p = r.p; } else if(input === FILES['/home/student/znamky.txt']) p = '/home/student/znamky.txt'; if(p === '/home/student/znamky.txt') done.sort = true; const ls = txt.split('\n').sort((x,y) => x.localeCompare(y,'cs')); return (g.includes('-r') ? ls.reverse() : ls).join('\n'); }
      case 'wc': { let txt = input || '', p = ''; const f = g.find(x => !x.startsWith('-')); if(f){ const r = read(f); txt = r.c; p = r.p; } else if(input === FILES['/etc/passwd']) p = '/etc/passwd'; const nl = txt ? txt.split('\n').length : 0; if(p === '/etc/passwd' && g.includes('-l')) done.wc = true; return g.includes('-l') ? String(nl) : nl+' '+txt.split(/\s+/).filter(Boolean).length+' '+txt.length; }
      default: throw new Error(c+': příkaz nenalezen');
    }
  }
  function run(line){
    cmds++; out.push('<span class="pr">student@maturita:~$</span> '+esc(line));
    try{ let d; for(const part of line.split('|')) d = ex(part, d); if(d) out.push(esc(d)); }catch(e){ out.push('<span class="er">'+esc(e.message)+'</span>'); beep('bad'); }
    let pr = false; while(ti < tasks.length && tasks[ti][1]()){ ti++; pr = true; }
    if(pr){ beep('ok'); if(ti >= tasks.length) return labDone(12, 'Roury a proměnné zvládnuté', [[cmds, 'příkazů']], 35, () => LABS[12].find(l => l.name === 'Terminál 2: roury a proměnné').run(12)); }
    render();
  }
  function render(){
    labShell(12, 'Terminál 2: roury a proměnné', '<div class="tasks">'+tasks.map((t,k) => '<div class="task'+(k<ti?' done':(k===ti?' cur':''))+'"><span>'+(k<ti?'✓':(k+1))+'</span>'+esc(t[0])+'</div>').join('')+'</div>'+
      '<div class="termwin" id="term"><div class="tout">'+out.slice(-60).join('\n')+'</div><div class="tin"><span class="pr">student@maturita:~$</span><input id="cmd" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Příkaz"></div></div>', 'Roura | posílá výstup jednoho příkazu na vstup dalšího (např. cat soubor | grep slovo).');
    const inp = $('#cmd'); inp.focus({preventScroll:true}); const term = $('#term'); term.scrollTop = term.scrollHeight; term.onclick = () => inp.focus();
    let hi = hist.length;
    inp.onkeydown = e => { if(e.key === 'Enter'){ e.preventDefault(); if(inp.value.trim()){ hist.push(inp.value); run(inp.value); } } else if(e.key === 'ArrowUp'){ e.preventDefault(); if(hi > 0){ hi--; inp.value = hist[hi]; } } };
  }
  render();
});

/* ---------- T13: hysterezní smyčka (kreativní) ---------- */
cre(13, 'Hysterezní smyčka', 'Posunuj magnetické pole hlavy a zapiš do domény jedničku nebo nulu. Uvidíš remanenci i koercitivní sílu.', n => {
  const Hc = 30, W = 14; let H = 0, branch = 'desc', ti = 0, path = [];
  const B = (h, br) => Math.tanh((br === 'desc' ? h + Hc : h - Hc)/W);
  const tasks = [
    {t:'Zapiš jedničku: přesuň pole až do kladné saturace a pak ho vypni (H = 0).', ok:() => branch === 'desc' && H === 0 && path.some(h => h >= 70)},
    {t:'Zapiš nulu: přemagnetuj doménu záporným polem a pole zase vypni.', ok:() => branch === 'asc' && H === 0},
    {t:'Najdi koercitivní sílu: z nuly zvyšuj pole a zastav se přesně v okamžiku, kdy se doména přepne (B přejde přes 0).', ok:() => branch === 'asc' && Math.abs(H - Hc) <= 3}
  ];
  let trail = [];
  function setH(h){ H = h; if(H >= Hc + 40) branch = 'desc'; if(H <= -(Hc + 40)) branch = 'asc'; path.push(H); if(path.length > 400) path.shift(); trail.push([H, B(H, branch)]); if(trail.length > 90) trail.shift(); }
  const BITS = [1,0,0,1,null,1,0,1,0];
  function scene(b){
    const w = 560, hh = 200, cx = 280, dw = 56, x0 = cx - dw * 4.5, mag = Math.abs(H) / 100, dir = H > 0 ? 1 : -1;
    let g = '<defs><marker id="hyAr" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10z" fill="#7fd3ff"/></marker><linearGradient id="hyCore" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3a3f40"/><stop offset=".5" stop-color="#5b6264"/><stop offset="1" stop-color="#2f3435"/></linearGradient></defs>';
    g += '<rect x="0" y="150" width="'+w+'" height="20" fill="#2a3032"/><text x="8" y="164" font-size="9.5" fill="#7f8e8a">podklad plotny (sklo / hliník)</text>';
    g += '<rect x="0" y="118" width="'+w+'" height="32" fill="#1a1f20"/><text x="8" y="112" font-size="9.5" fill="#7f8e8a">magnetická vrstva · stopa</text>';
    BITS.forEach((bit, i) => {
      const x = x0 + i * dw, cur = bit === null, v = cur ? b : bit ? 1 : -1, col = v > 0 ? '#61e38c' : '#ff6150', len = Math.max(6, Math.abs(v) * 38), mx = x + dw / 2;
      g += '<rect x="'+(x+2)+'" y="120" width="'+(dw-4)+'" height="28" rx="3" fill="'+(cur ? 'rgba(127,211,255,.10)' : 'rgba(255,255,255,.03)')+'" stroke="'+(cur ? '#7fd3ff' : '#323a3c')+'" stroke-width="'+(cur ? 1.6 : 1)+'"/>';
      g += '<path d="M'+(mx - v/Math.abs(v||1) * len/2)+' 134H'+(mx + v/Math.abs(v||1) * len/2)+'" stroke="'+col+'" stroke-width="3.2" stroke-linecap="round" opacity="'+(cur ? .5 + Math.abs(v) * .5 : .75)+'"/>';
      g += '<path d="M'+(mx + v/Math.abs(v||1) * len/2)+' 134l'+(-(v>0?1:-1)*7)+' -5v10z" fill="'+col+'" opacity="'+(cur ? .5 + Math.abs(v) * .5 : .75)+'"/>';
      g += '<text x="'+mx+'" y="186" text-anchor="middle" font-size="11" font-weight="600" fill="'+(cur ? '#d9f2ff' : '#7f8e8a')+'">'+(cur ? (b > 0 ? '1' : '0') : bit)+'</text>';
    });
    g += '<path d="M'+(w-70)+' 109h60" stroke="#7f8e8a" stroke-width="1.2" marker-end="url(#hyAr)" opacity=".7"/><text x="'+(w-76)+'" y="112" text-anchor="end" font-size="9.5" fill="#7f8e8a">otáčení plotny</text>';
    g += '<g transform="translate('+cx+' 104) scale(1.45) translate('+(-cx)+' -104)">';
    // siločáry ze štěrbiny
    if(mag > .02) [10, 20, 30].forEach((d, k) => { const op = Math.min(1, mag * 1.6 - k * .15); if(op <= 0) return;
      g += '<path d="M'+(dir > 0 ? cx - 10 : cx + 10)+' 104Q'+cx+' '+(104 + d * 1.25)+' '+(dir > 0 ? cx + 10 : cx - 10)+' 104" fill="none" stroke="#7fd3ff" stroke-width="1.6" opacity="'+op.toFixed(2)+'" marker-end="url(#hyAr)"/>'; });
    // hlava: feritové jádro a cívka
    g += '<path d="M'+(cx-18)+' 104H'+(cx-10)+'V66Q'+(cx-10)+' 54 '+cx+' 54Q'+(cx+10)+' 54 '+(cx+10)+' 66V104H'+(cx+18)+'V62Q'+(cx+18)+' 38 '+cx+' 38Q'+(cx-18)+' 38 '+(cx-18)+' 62Z" fill="url(#hyCore)" stroke="#8a9496" stroke-width="1"/>';
    const coil = mag > .02 ? '#f3cd7e' : '#8a6c34';
    for(let k = 0; k < 6; k++) g += '<ellipse cx="'+(cx - 15 + k * 6)+'" cy="46" rx="2.6" ry="11" fill="none" stroke="'+coil+'" stroke-width="2"'+(mag > .02 ? ' style="filter:drop-shadow(0 0 3px rgba(241,200,115,.7))"' : '')+'/>';
    g += '<path d="M'+(cx-18)+' 40H'+(cx-48)+'M'+(cx+18)+' 40H'+(cx+48)+'" stroke="'+coil+'" stroke-width="2"/>';
    g += '</g><text x="'+(cx-74)+'" y="58" text-anchor="end" font-size="12" fill="var(--silk)">I '+(mag > .02 ? (H > 0 ? '→' : '←') : '= 0')+'</text>';
    g += '<text x="'+(cx+74)+'" y="50" font-size="11.5" fill="var(--copper)">zápisová hlava</text><text x="'+(cx+74)+'" y="66" font-size="11" fill="var(--silk-dim)">H = '+H+'</text>';
    g += '<text x="'+(cx+32)+'" y="100" font-size="9.5" fill="#7fd3ff">štěrbina</text>';
    return '<svg viewBox="0 -4 '+w+' 200" class="hyscene" role="img" aria-label="Zápisová hlava nad stopou disku">'+g+'</svg>';
  }
  function render(){
    const w = 560, h = 260, x = v => w/2 + v*2.5, y = v => h/2 - v*100;
    let up = '', dn = ''; for(let v = -100; v <= 100; v += 4){ up += (up?' L':'M')+x(v)+' '+y(B(v,'asc')); dn += (dn?' L':'M')+x(v)+' '+y(B(v,'desc')); }
    const b = B(H, branch);
    const svg = '<svg viewBox="0 0 '+w+' '+h+'" class="chart" role="img" aria-label="Hysterezní smyčka"><line x1="0" x2="'+w+'" y1="'+h/2+'" y2="'+h/2+'" stroke="var(--copper-dim)"/><line x1="'+w/2+'" x2="'+w/2+'" y1="0" y2="'+h+'" stroke="var(--copper-dim)"/>'+
      '<text x="'+(w-6)+'" y="'+(h/2-6)+'" text-anchor="end" font-size="11" fill="var(--silk-dim)">H (pole hlavy)</text><text x="'+(w/2+6)+'" y="14" font-size="11" fill="var(--silk-dim)">B (magnetizace)</text>'+
      '<rect x="'+x(70)+'" y="0" width="'+(w-x(70))+'" height="'+h+'" fill="rgba(97,227,140,.05)"/><rect x="0" y="0" width="'+x(-70)+'" height="'+h+'" fill="rgba(255,97,80,.05)"/><text x="'+(w-6)+'" y="'+(h-8)+'" text-anchor="end" font-size="10" fill="var(--silk-dim)">saturace +</text><text x="6" y="'+(h-8)+'" font-size="10" fill="var(--silk-dim)">saturace −</text>'+
      (trail.length > 1 ? '<polyline points="'+trail.map(t => x(t[0]).toFixed(1)+','+y(t[1]).toFixed(1)).join(' ')+'" fill="none" stroke="#f3cd7e" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" opacity=".85" style="filter:drop-shadow(0 0 4px rgba(241,200,115,.6))"/>' : '')+
      '<path d="'+up+'" fill="none" stroke="var(--copper)" stroke-width="2" opacity=".55"/><path d="'+dn+'" fill="none" stroke="var(--copper)" stroke-width="2" opacity=".55"/>'+
      '<text x="'+(w/2+6)+'" y="'+(y(B(0,'desc'))-6)+'" font-size="11" fill="var(--led-on)">+Br (remanence = 1)</text><text x="'+(w/2+6)+'" y="'+(y(B(0,'asc'))+16)+'" font-size="11" fill="var(--bad)">−Br (remanence = 0)</text>'+
      '<line x1="'+x(Hc)+'" x2="'+x(Hc)+'" y1="'+(h/2-6)+'" y2="'+(h/2+6)+'" stroke="var(--silk)"/><text x="'+x(Hc)+'" y="'+(h/2+20)+'" text-anchor="middle" font-size="10" fill="var(--silk-dim)">Hc</text><line x1="'+x(-Hc)+'" x2="'+x(-Hc)+'" y1="'+(h/2-6)+'" y2="'+(h/2+6)+'" stroke="var(--silk)"/><text x="'+x(-Hc)+'" y="'+(h/2+20)+'" text-anchor="middle" font-size="10" fill="var(--silk-dim)">−Hc</text>'+
      '<circle cx="'+x(H)+'" cy="'+y(b)+'" r="7" fill="'+(b>0?'var(--led-on)':'var(--bad)')+'" stroke="#fff" stroke-width="1.5"/></svg>';
    const dom = '<p class="hystat mono"><span class="hybit '+(b>0?'one':'zero')+'">'+(b>0?'1':'0')+'</span>zapisovaná doména · B = '+fmt(b,2)+' · H = '+H+' · větev '+(branch==='desc'?'shora (po kladné saturaci)':'zdola (po záporné saturaci)')+'</p>';
    const box = '<div class="hygrid">'+scene(b)+svg+'</div>'+dom;
    if($('#hyst') && $('#hs')){ $('#hyst').innerHTML = box; $('#hlab').textContent = 'Pole zápisové hlavy H: '+H; $('#htask').innerHTML = '<b>Úkol '+(Math.min(ti,tasks.length-1)+1)+'/'+tasks.length+':</b> '+esc(tasks[Math.min(ti,tasks.length-1)].t); return; }
    labShell(13, 'Hysterezní smyčka', '<p id="htask"><b>Úkol '+(Math.min(ti,tasks.length-1)+1)+'/'+tasks.length+':</b> '+esc(tasks[Math.min(ti,tasks.length-1)].t)+'</p><div id="hyst">'+box+'</div>'+
      '<div class="hyctl"><label class="mono small" for="hs" id="hlab">Pole zápisové hlavy H: '+H+'</label><input type="range" id="hs" min="-100" max="100" step="1" value="'+H+'" class="slider hyslider"><div class="hyscale mono"><span>−100 · zápis 0</span><span>0</span><span>zápis 1 · +100</span></div></div>'+
      '<div class="row"><button class="btn ghost" id="h0">Vypnout pole (H = 0)</button></div>', 'Remanence Br = magnetizace, která zůstane po vypnutí pole (trvalý zápis). Koercitivní síla Hc = pole potřebné k přepsání domény.');
    const s = $('#hs'); s.oninput = () => { setH(+s.value); render(); check(); };
    $('#h0').onclick = () => { setH(0); s.value = 0; render(); check(); };
  }
  let checkT = 0;
  function check(){
    clearTimeout(checkT);
    checkT = setTimeout(() => { if(ti < tasks.length && tasks[ti].ok()){ beep('ok'); toast('Splněno!'); ti++; path = []; if(ti >= tasks.length) return labDone(13, 'Hystereze pochopená', [[3, 'úkoly']], 25, () => LABS[13].find(l => l.name === 'Hysterezní smyčka').run(13)); render(); } }, 350);
  }
  render();
});

/* ---------- T15: LFN a clustery ---------- */
lab(15, 'Clustery a dlouhé názvy', 'Kolik místa soubor zabere a kolik položek adresáře má dlouhý název.', calcLab(15, 'Clustery a LFN', () => {
  if(Math.random() < .5){ const cs = [2,4,8,16,32][ri(0,4)], sz = Math.round((Math.random()*60+.3)*10)/10; const k = Math.ceil(sz/cs);
    return mcqOf('Cluster má '+cs+' kB. Soubor má '+fmt(sz,1)+' kB. Kolik místa na disku zabere?', fmt(k*cs,0)+' kB ('+k+' '+(k===1?'cluster':(k<5?'clustery':'clusterů'))+')', [fmt((k+1)*cs,0)+' kB ('+(k+1)+' clusterů)', fmt(Math.max(1,k-1)*cs,0)+' kB ('+Math.max(1,k-1)+' clusterů)', fmt(sz,1)+' kB (přesně velikost souboru)'], 15); }
  let L; do { L = ri(9,60); } while(L % 13 === 0);
  const e = Math.ceil(L/13) + 1;
  return mcqOf('Soubor má dlouhý název o '+L+' znacích (VFAT). Kolik položek adresáře zabere?', String(e), [String(e-1), String(e+1), String(Math.ceil(L/8))], 15);
}, 'Soubor zabere celé clustery (vnitřní fragmentace). VFAT: 13 znaků na jednu LFN položku + 1 položka pro krátký název 8.3.'));

/* ---------- T17: cache simulátor ---------- */
lab(17, 'Cache: hit, nebo miss?', 'Přímo mapovaná cache se 4 řádky. Předpovídej zásahy.', n => {
  const seq = []; while(seq.length < 12){ seq.push(Math.random() < .45 && seq.length ? seq[ri(0, seq.length-1)] : ri(0,15)); }
  const lines = Array(4).fill(null), res = []; let i = 0, good = 0, last = null;
  function diagram(a, ln, tag){
    const bin = a.toString(2).padStart(4,'0'), RY = k => 52 + k * 46;
    let g = '<defs><marker id="caAr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" fill="#f3cd7e"/></marker><marker id="caAr2" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" fill="#ff8a7e"/></marker></defs>';
    g += '<rect x="8" y="96" width="76" height="70" rx="8" class="cab"/><text x="46" y="124" text-anchor="middle" class="cat b">CPU</text><text x="46" y="144" text-anchor="middle" class="cat">čte '+a+'</text>';
    g += '<path d="M84 131H104" class="caw on" marker-end="url(#caAr)"/>';
    g += '<g transform="translate(106 104)"><rect width="128" height="54" rx="6" class="cab"/><rect x="4" y="4" width="58" height="34" rx="4" class="catag"/><rect x="66" y="4" width="58" height="34" rx="4" class="caidx"/>'+
      '<text x="33" y="28" text-anchor="middle" class="cabin">'+bin.slice(0,2)+'</text><text x="95" y="28" text-anchor="middle" class="cabin">'+bin.slice(2)+'</text>'+
      '<text x="33" y="50" text-anchor="middle" class="cat s">tag '+tag+'</text><text x="95" y="50" text-anchor="middle" class="cat s">řádek '+ln+'</text></g>';
    g += '<text x="170" y="92" text-anchor="middle" class="cat s">adresa '+a+' = '+bin+'b</text>';
    g += '<path d="M201 162V'+(RY(ln)+19 > 162 ? RY(ln)+19 : 180)+(RY(ln)+19 > 162 ? '' : 'H260V'+(RY(ln)+19))+'H284" class="caw on" marker-end="url(#caAr)"/>';
    g += '<rect x="286" y="10" width="190" height="236" rx="8" class="cab"/><text x="296" y="28" class="cat h">CACHE</text><text x="330" y="45" text-anchor="middle" class="cat s">V</text><text x="372" y="45" text-anchor="middle" class="cat s">tag</text><text x="432" y="45" text-anchor="middle" class="cat s">data</text>';
    lines.forEach((t, k) => {
      const cur = k === ln, wasHit = last && last.ln === k && last.hit, wasMiss = last && last.ln === k && !last.hit;
      g += '<g class="carow'+(cur ? ' cur' : '')+(wasHit ? ' hit' : '')+(wasMiss ? ' miss' : '')+'"><rect x="294" y="'+RY(k)+'" width="174" height="38" rx="5"/>'+
        '<text x="304" y="'+(RY(k)+24)+'" class="cat s">'+k+'</text><text x="330" y="'+(RY(k)+24)+'" text-anchor="middle" class="cav">'+(t == null ? 0 : 1)+'</text>'+
        '<text x="372" y="'+(RY(k)+24)+'" text-anchor="middle" class="cav">'+(t == null ? '—' : t)+(cur ? '<tspan class="caq"> =?'+tag+'</tspan>' : '')+'</text>'+
        '<text x="432" y="'+(RY(k)+24)+'" text-anchor="middle" class="cat">'+(t == null ? 'prázdný' : 'M['+(t*4+k)+']')+'</text></g>';
    });
    g += '<rect x="500" y="10" width="124" height="236" rx="8" class="cab"/><text x="510" y="30" class="cat h">RAM</text>';
    for(let k = 0; k < 16; k++){ const x = 508 + (k % 4) * 28, y = 42 + Math.floor(k / 4) * 50;
      g += '<rect x="'+x+'" y="'+y+'" width="24" height="42" rx="4" class="cacell'+(k === a ? ' cur' : '')+(last && !last.hit && last.a === k ? ' ld' : '')+'"/><text x="'+(x+12)+'" y="'+(y+26)+'" text-anchor="middle" class="cat s">'+k+'</text>'; }
    if(last && !last.hit){ const x = 508 + (last.a % 4) * 28, y = 42 + Math.floor(last.a / 4) * 50 + 21; g += '<path d="M'+x+' '+y+'C480 '+y+' 490 '+(RY(last.ln)+19)+' 470 '+(RY(last.ln)+19)+'" class="caw miss" marker-end="url(#caAr2)"/><text x="488" y="'+(Math.min(y, RY(last.ln)+19) - 6)+'" text-anchor="middle" class="cat s miss">načteno</text>'; }
    return '<div class="cawrap"><svg class="casvg" viewBox="0 0 632 256" role="img" aria-label="Přímo mapovaná cache">'+g+'</svg></div>';
  }
  function render(){
    if(i >= seq.length) return labDone(17, 'Cache prošlá', [[good+'/'+seq.length, 'správně']], good*2, () => LABS[17].find(l => l.name === 'Cache: hit, nebo miss?').run(17));
    const a = seq[i], ln = a % 4, tag = Math.floor(a/4);
    labShell(17, 'Cache: hit, nebo miss? · '+(i+1)+'/'+seq.length,
      '<p>CPU čte adresu <b>'+a+'</b>. Řádek cache = adresa mod 4 = <b>'+ln+'</b>, tag = adresa div 4 = <b>'+tag+'</b>. Bude to zásah?</p>'+
      '<div class="pgref"><span class="pgl">sekvence adres</span>'+seq.map((x,k) => '<span class="pgt'+(k < i ? (res[k] ? ' h' : ' f') : k === i ? ' cur' : '')+'"><b>'+x+'</b><i>'+(k < i ? (res[k] ? 'hit' : 'miss') : k === i ? '?' : '')+'</i></span>').join('')+'</div>'+
      diagram(a, ln, tag)+
      (last ? '<p class="mono small calast '+(last.hit ? 'ok' : 'bad')+'">minule: adresa '+last.a+' → '+(last.hit ? 'HIT, data byla v cache' : 'MISS, data se načetla z RAM do řádku '+last.ln)+'</p>' : '')+
      '<div class="row"><button class="btn green" id="hit">Cache hit<span class="kbd">1</span></button><button class="btn red" id="miss">Cache miss<span class="kbd">2</span></button></div>', 'Hit = na řádku už je stejný tag. Miss = řádek je prázdný nebo má jiný tag; data se načtou z RAM a řádek se přepíše.');
    const ans = h => { const isHit = lines[ln] === tag; res[i] = isHit; if(h === isHit){ good++; beep('ok'); } else { beep('bad'); toast(isHit ? 'Byl to hit – tag '+tag+' už na řádku '+ln+' je' : 'Byl to miss – na řádku '+ln+' '+(lines[ln]==null?'nic nebylo':'byl tag '+lines[ln])); } last = {a, ln, hit:isHit}; lines[ln] = tag; i++; render(); };
    $('#hit').onclick = () => ans(true); $('#miss').onclick = () => ans(false);
    onKey = e => { if(e.key === '1') ans(true); else if(e.key === '2') ans(false); };
  }
  render();
});

/* ---------- T18 + dílna: postav si PC (kreativní) ---------- */
cre(18, 'Postav si PC', 'Poskládej počítač do skříně: desku, procesor do socketu, chladič, paměti, grafiku, disk a zdroj. Hlídej socket, DDR, TDP a výkon zdroje.', n => {
  const C = {
    cpu:[{n:'Intel Core i5 (LGA 1151, 65 W)', s:'LGA1151', w:65, b:'intel', l:'Core i5'}, {n:'Intel Core i9 (LGA 1151, 95 W)', s:'LGA1151', w:95, b:'intel', l:'Core i9'}, {n:'AMD Ryzen 5 (AM4, 65 W)', s:'AM4', w:65, b:'amd', l:'Ryzen 5'}, {n:'AMD Ryzen 9 (AM4, 105 W)', s:'AM4', w:105, b:'amd', l:'Ryzen 9'}, {n:'Intel Xeon (LGA 2011, 140 W)', s:'LGA2011', w:140, b:'intel', l:'Xeon'}, {n:'Úsporný Intel (LGA 1151, 25 W)', s:'LGA1151', w:25, b:'intel', l:'Core T'}],
    mb:[{n:'Deska Z390 (LGA 1151, DDR4, M.2)', s:'LGA1151', r:'DDR4', m2:true, c:'Z390'}, {n:'Deska H110 (LGA 1151, DDR4, bez M.2)', s:'LGA1151', r:'DDR4', m2:false, c:'H110'}, {n:'Deska B450 (AM4, DDR4, M.2)', s:'AM4', r:'DDR4', m2:true, c:'B450'}, {n:'Deska X79 (LGA 2011, DDR3, bez M.2)', s:'LGA2011', r:'DDR3', m2:false, c:'X79'}],
    ram:[{n:'2× 8 GB DDR4-3200 (Dual Channel)', r:'DDR4', dual:true}, {n:'1× 16 GB DDR4-2666', r:'DDR4', dual:false}, {n:'2× 8 GB DDR3-1600 (Dual Channel)', r:'DDR3', dual:true}],
    cool:[{n:'Pasivní chladič (do 30 W)', max:30, quiet:true, k:'pas'}, {n:'Box chladič s ventilátorem (do 95 W)', max:95, k:'box'}, {n:'Věžový chladič s heatpipe (do 180 W)', max:180, k:'tower'}, {n:'AIO vodní 240 mm (do 200 W)', max:200, k:'aio'}, {n:'Custom vodní okruh (nad 200 W)', max:400, k:'loop'}],
    psu:[{n:'Zdroj 300 W (80 PLUS)', w:300}, {n:'Zdroj 450 W (80 PLUS)', w:450}, {n:'Zdroj 650 W (80 PLUS Gold)', w:650}, {n:'Zdroj 850 W (80 PLUS Gold, 12VHPWR)', w:850}],
    disk:[{n:'NVMe SSD (M.2, PCIe 4.0 x4)', m2:true, ssd:true}, {n:'SATA SSD (SATA III, 600 MB/s)', ssd:true}, {n:'HDD 7200 ot./min (SATA)', ssd:false}],
    gpu:[{n:'Bez grafiky (integrovaná v CPU)', w:0}, {n:'Grafika 75 W (jen ze slotu PCIe)', w:75}, {n:'Grafika 220 W (8pin + 6pin)', w:220}, {n:'Grafika 320 W (12VHPWR)', w:320}]
  };
  const SLOT = {cpu:'Procesor', mb:'Základní deska', ram:'Paměti', cool:'Chlazení', psu:'Zdroj', disk:'Disk', gpu:'Grafika'};
  const TAB = {mb:'Deska', cpu:'Procesor', cool:'Chladič', ram:'Paměti', gpu:'Grafika', disk:'Disk', psu:'Zdroj'};
  const ORDER = ['mb','cpu','cool','ram','gpu','disk','psu'];
  const JOBS = [
    {t:'Tichý kancelářský PC: pasivní chlazení, žádná přídavná grafika, SSD disk.', req:s => [['Pasivní chlazení', s.cool && s.cool.quiet], ['Bez přídavné grafiky', s.gpu && s.gpu.w === 0], ['SSD disk', s.disk && s.disk.ssd]]},
    {t:'Herní PC: grafika aspoň 220 W, NVMe disk, paměti v Dual Channel.', req:s => [['Grafika ≥ 220 W', s.gpu && s.gpu.w >= 220], ['NVMe disk', s.disk && s.disk.m2], ['Dual Channel', s.ram && s.ram.dual]]},
    {t:'Pracovní stanice na rendering: procesor aspoň 100 W TDP, SSD, zdroj s rezervou.', req:s => [['CPU ≥ 100 W TDP', s.cpu && s.cpu.w >= 100], ['SSD disk', s.disk && s.disk.ssd]]}
  ];
  const IC = {
    mb:'<rect x="3" y="3" width="18" height="18" rx="2"/><rect x="7" y="7" width="6" height="6"/><path d="M16 6v8M18.5 6v8M6 17h10"/>',
    cpu:'<rect x="6" y="6" width="12" height="12" rx="1.5"/><rect x="9.5" y="9.5" width="5" height="5"/><path d="M9 3v3M12 3v3M15 3v3M9 18v3M12 18v3M15 18v3M3 9h3M3 12h3M3 15h3M18 9h3M18 12h3M18 15h3"/>',
    cool:'<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="1.8"/><path d="M12 10.2C11 7 12.5 4.8 15 4.6M13.8 12.4c3 .9 4.3 3.2 3.4 5.4M10.4 13c-2.3 2.3-4.9 2.2-6.3.4"/>',
    ram:'<rect x="2.5" y="8" width="19" height="8" rx="1"/><path d="M5.5 10.5h2.5v3H5.5zM10 10.5h2.5v3H10zM14.5 10.5H17v3h-2.5zM11 16v2.5M6 16v2.5M16 16v2.5"/>',
    gpu:'<rect x="2" y="6" width="20" height="11" rx="1.5"/><circle cx="8" cy="11.5" r="3"/><circle cx="16" cy="11.5" r="3"/><path d="M4 17v2.5h8V17"/>',
    disk:'<rect x="4" y="3" width="16" height="18" rx="2"/><circle cx="12" cy="11" r="4.5"/><circle cx="12" cy="11" r="1"/><path d="M15 17.5h2"/>',
    psu:'<rect x="2.5" y="5" width="19" height="14" rx="1.5"/><circle cx="9" cy="12" r="4"/><path d="M6.5 12h5M9 9.5v5M16 9h3M16 12h3M16 15h3"/>',
    job:'<path d="M8 4h8v3H8zM6 5.5H4.5v15h15v-15H18"/><path d="M8 12l2.5 2.5L16 9"/>'
  };
  const ico = (k, c) => '<svg class="bpi'+(c ? ' '+c : '')+'" viewBox="0 0 24 24" aria-hidden="true">'+IC[k]+'</svg>';
  let job = 0, cat = 'mb', fresh = null; const sel = {};
  const pick = k => sel[k] != null ? C[k][sel[k]] : null;

  function rules(){
    const s = {}; Object.keys(C).forEach(k => s[k] = pick(k));
    const r = [];
    r.push(['Socket CPU = socket desky', s.cpu && s.mb ? s.cpu.s === s.mb.s : null, s.cpu && s.mb ? s.cpu.s+' vs '+s.mb.s : '', ['cpu','mb']]);
    r.push(['Paměti odpovídají desce (DDR)', s.ram && s.mb ? s.ram.r === s.mb.r : null, s.ram && s.mb ? s.ram.r+' vs '+s.mb.r : '', ['ram']]);
    r.push(['Chladič zvládne TDP', s.cool && s.cpu ? s.cool.max >= s.cpu.w : null, s.cool && s.cpu ? 'TDP '+s.cpu.w+' W, chladič do '+s.cool.max+' W' : '', ['cool']]);
    r.push(['NVMe disk potřebuje M.2 na desce', s.disk && s.mb ? (!s.disk.m2 || s.mb.m2) : null, s.disk && s.mb && s.disk.m2 && !s.mb.m2 ? 'deska '+s.mb.c+' nemá M.2' : '', ['disk']]);
    const tot = (s.cpu ? s.cpu.w : 0) + (s.gpu ? s.gpu.w : 0) + 75;
    const load = s.psu ? tot / s.psu.w : null;
    r.push(['Zdroj zatížený max. na 75 % (nejlepší účinnost 50–75 %)', s.psu && s.cpu && s.gpu ? load <= .75 : null, s.psu ? 'odběr ≈ '+tot+' W, zatížení '+Math.round(load*100)+' %' : '', ['psu']]);
    const bad = {}; r.forEach(x => { if(x[1] === false) x[3].forEach(k => bad[k] = true); });
    return {s, r, tot, load, bad};
  }

  /* ---------- skříň s deskou (SVG) ---------- */
  function fan(cx, cy, r, op){
    let b = ''; for(let i = 0; i < 7; i++){ const a = i * Math.PI * 2 / 7, x1 = cx + Math.cos(a) * r * .28, y1 = cy + Math.sin(a) * r * .28, x2 = cx + Math.cos(a + .9) * r * .9, y2 = cy + Math.sin(a + .9) * r * .9;
      b += '<path d="M'+x1.toFixed(1)+' '+y1.toFixed(1)+'Q'+(cx + Math.cos(a + .2) * r * .95).toFixed(1)+' '+(cy + Math.sin(a + .2) * r * .95).toFixed(1)+' '+x2.toFixed(1)+' '+y2.toFixed(1)+'"/>'; }
    return '<g class="bpfan"'+(op ? ' opacity="'+op+'"' : '')+'><circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="#0d1112" stroke="#3a4446" stroke-width="1.5"/><g fill="none" stroke="#5d6a6c" stroke-width="2.2" stroke-linecap="round">'+b+'</g><circle cx="'+cx+'" cy="'+cy+'" r="'+(r * .24).toFixed(1)+'" fill="#1d2425" stroke="#4a5557"/></g>';
  }
  const box = (x, y, w, h, fill, stroke, rx, extra) => '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="'+(rx || 2)+'" fill="'+fill+'" stroke="'+stroke+'"'+(extra || '')+'/>';
  const txt = (x, y, t, sz, fill, anchor, extra) => '<text x="'+x+'" y="'+y+'" font-size="'+sz+'" fill="'+fill+'" text-anchor="'+(anchor || 'middle')+'"'+(extra || '')+'>'+t+'</text>';
  function part(k, inner, bad){
    return '<g class="bppart'+(fresh === k ? ' bpnew' : '')+(bad ? ' bpbad' : '')+'" data-k="'+k+'">'+inner+'</g>';
  }
  function badge(x, y){ return '<g class="bpx"><circle cx="'+x+'" cy="'+y+'" r="9" fill="var(--bad)"/><path d="M'+(x-3.5)+' '+(y-3.5)+'l7 7M'+(x+3.5)+' '+(y-3.5)+'l-7 7" stroke="#fff" stroke-width="2" stroke-linecap="round"/></g>'; }
  function hit(k, x, y, w, h, label){
    const on = cat === k;
    return '<g class="bphit'+(on ? ' on' : '')+'" data-k="'+k+'"><rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="6"/>'+(label ? txt(x + w/2, y + h/2 + 4, label, 11, 'currentColor', 'middle', ' class="bphl"') : '')+'</g>';
  }
  function caseSVG(s, bad){
    let g = '';
    // skříň
    g += '<defs><linearGradient id="bpIhs" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e9ecec"/><stop offset=".55" stop-color="#a9b0b2"/><stop offset="1" stop-color="#7d8587"/></linearGradient>'+
      '<linearGradient id="bpGpu" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b3234"/><stop offset="1" stop-color="#15191a"/></linearGradient>'+
      '<linearGradient id="bpPcb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#123a2e"/><stop offset="1" stop-color="#0b261e"/></linearGradient>'+
      '<pattern id="bpMesh" width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="1.2" fill="#273032"/></pattern></defs>';
    g += box(8, 8, 524, 456, '#161b1c', '#3a4345', 16) + box(22, 22, 496, 428, '#0a0d0e', '#222a2b', 10);
    g += '<rect x="30" y="54" width="34" height="96" rx="4" fill="url(#bpMesh)" stroke="#273032"/>' + fan(47, 102, 15, .9);   // zadní ventilátor
    g += [90, 190, 290].map(y => fan(492, y + 16, 19, .55)).join('');                                                          // přední ventilátory
    g += box(22, 366, 496, 84, '#111617', '#262e2f', 6) + txt(270, 444, 'kryt zdroje', 9, '#3b4648');
    // deska
    if(!s.mb){
      g += box(76, 50, 300, 300, 'none', '#3b4648', 8, ' stroke-dasharray="6 6"') + [[86,60],[366,60],[86,340],[366,340],[226,60],[226,340]].map(p => '<circle cx="'+p[0]+'" cy="'+p[1]+'" r="3.5" fill="#2a3233"/>').join('');
    } else {
      let b = box(76, 50, 300, 300, 'url(#bpPcb)', bad.mb ? 'var(--bad)' : '#2c5a49', 6, ' stroke-width="'+(bad.mb ? 2.5 : 1.2)+'"');
      b += '<g stroke="#1f5a45" stroke-width="1.2" fill="none" opacity=".8"><path d="M210 130h18v-40h40M210 110h10v-50M300 200h40v60M120 230h-30v80h40M250 300h60v30M150 180v20h60"/><path d="M330 90h30M330 100h30M330 110h30"/></g>';
      b += box(78, 58, 26, 92, '#3d4648', '#5a6466', 3) + txt(91, 108, 'I/O', 8, '#c9d0d1');
      b += box(112, 58, 98, 14, '#2a3133', '#465052', 3) + box(112, 72, 14, 94, '#2a3133', '#465052', 3);                       // VRM chladiče
      // socket
      const sx = 136, sy = 82;
      b += box(sx, sy, 74, 74, '#1e2425', '#c9a35a', 3, ' stroke-width="1.4"');
      if(s.mb.s === 'AM4'){ let d = ''; for(let i = 0; i < 9; i++) for(let j = 0; j < 9; j++) d += '<circle cx="'+(sx + 9 + i * 7)+'" cy="'+(sy + 9 + j * 7)+'" r="1.1"/>'; b += '<g fill="#0a0d0e">'+d+'</g>'; }
      else { let d = ''; for(let i = 0; i < 10; i++) for(let j = 0; j < 10; j++) if(!(i > 3 && i < 6 && j > 3 && j < 6)) d += '<rect x="'+(sx + 7 + i * 6.2)+'" y="'+(sy + 7 + j * 6.2)+'" width="2.4" height="2.4"/>'; b += '<g fill="#b8924a" opacity=".75">'+d+'</g>'; }
      b += txt(sx + 37, sy + 88, s.mb.s, 9, '#c9a35a');
      // RAM sloty
      const rx = [232, 248, 264, 280];
      b += rx.map((x, i) => box(x, 70, 8, 168, '#15191a', '#3f4a4c', 2) + box(x + 1.5, s.mb.r === 'DDR3' ? 168 : 150, 5, 3, '#0a0d0e', 'none', 0) + txt(x + 4, 250, ['A1','A2','B1','B2'][i], 7.5, '#7f8e8a')).join('') + txt(260, 64, s.mb.r, 9, '#c9a35a');
      b += box(304, 112, 14, 58, '#e8e2cf', '#8f8a7a', 2) + txt(311, 182, 'ATX 24', 7.5, '#7f8e8a');                         // 24pin
      b += box(112, 40, 26, 10, '#e8e2cf', '#8f8a7a', 2);                                                                     // CPU 8pin
      if(s.mb.m2) b += box(120, 200, 112, 10, '#1a1f20', '#4a5557', 2) + '<circle cx="236" cy="205" r="3" fill="#c9a35a"/>' + txt(176, 196, 'M.2', 8.5, '#c9a35a');
      b += box(96, 258, 210, 9, '#15191a', '#4a5557', 2) + txt(201, 254, 'PCIe x16', 8.5, '#c9a35a') + box(96, 300, 64, 7, '#15191a', '#4a5557', 2) + txt(128, 318, 'PCIe x1', 7.5, '#7f8e8a');
      b += box(282, 280, 56, 52, '#2a3133', '#5a6466', 4) + txt(310, 310, s.mb.c, 11, '#e7c983', 'middle', ' font-weight="700"');   // čipset
      b += [0,1,2,3].map(i => box(352, 270 + i * 15, 16, 10, '#202627', '#56a5c4', 2)).join('') + txt(360, 336, 'SATA', 7.5, '#7f8e8a');
      b += '<circle cx="200" cy="318" r="10" fill="#c3c9ca" stroke="#7d8587"/>';
      g += part('mb', b, bad.mb);
    }
    // procesor
    if(s.cpu){
      const c = s.cpu, off = bad.cpu ? -26 : 0;
      g += part('cpu', '<g transform="translate('+off+' '+(bad.cpu ? -18 : 0)+')">'+box(140, 86, 66, 66, '#0f6a4c', '#0b4a35', 3)+box(146, 92, 54, 54, 'url(#bpIhs)', '#6c7476', 4)+
        txt(173, 115, c.b === 'amd' ? 'AMD' : 'intel', c.b === 'amd' ? 10 : 11, '#3b4446', 'middle', ' font-weight="700"')+txt(173, 128, esc(c.l), 8.5, '#3b4446')+txt(173, 139, c.w+' W', 7.5, '#59625f')+'</g>'+(bad.cpu ? badge(204, 70) : ''), bad.cpu);
    }
    // chladič
    if(s.cool){
      const k = s.cool.k; let c = '';
      if(k === 'pas') c = box(124, 74, 98, 90, '#5d6668', '#8a9395', 3) + '<g stroke="#2b3133" stroke-width="2">'+Array.from({length:13}, (_, i) => '<path d="M'+(130 + i * 7)+' 78v82"/>').join('')+'</g>' + txt(173, 176, 'pasivní', 8, '#9aa6a3');
      else if(k === 'box') c = box(129, 75, 88, 88, '#1b2122', '#4a5557', 10) + fan(173, 119, 38);
      else if(k === 'tower') c = box(130, 70, 86, 98, '#9aa2a4', '#c7cdce', 3) + '<g stroke="#5f6769" stroke-width="1.6">'+Array.from({length:12}, (_, i) => '<path d="M132 '+(76 + i * 8)+'h82"/>').join('')+'</g>' + box(114, 66, 14, 106, '#1b2122', '#4a5557', 3) + '<g stroke="#c9a35a" stroke-width="2.4" fill="none"><path d="M150 86v-24M166 86v-24M182 86v-24M198 86v-24"/></g>' + txt(173, 182, 'věž', 8, '#9aa6a3');
      else {
        const loop = k === 'loop', tube = loop ? '#3fd0ff' : '#1d2223', tw = loop ? 5 : 7;
        c = box(110, 26, 300, 22, '#20272a', '#4a5557', 4) + fan(160, 37, 9) + fan(210, 37, 9) + (loop ? fan(260, 37, 9) + fan(310, 37, 9) : '') + txt(380, 41, 'radiátor', 8, '#9aa6a3');
        c += '<path d="M160 112C150 80 130 60 140 48M186 112C200 80 220 70 230 48" fill="none" stroke="'+tube+'" stroke-width="'+tw+'" stroke-linecap="round"'+(loop ? ' opacity=".85"' : '')+'/>';
        if(loop) c += box(418, 120, 26, 120, 'rgba(63,208,255,.25)', '#3fd0ff', 12) + '<rect x="421" y="160" width="20" height="77" rx="9" fill="rgba(63,208,255,.55)"/>' + '<path d="M186 130C260 150 380 140 418 170M431 240C431 300 300 290 210 260" fill="none" stroke="#3fd0ff" stroke-width="5" stroke-linecap="round" opacity=".85"/>' + txt(431, 112, 'nádržka', 8, '#9aa6a3');
        c += '<circle cx="173" cy="119" r="30" fill="#14191a" stroke="'+(loop ? '#3fd0ff' : '#4a5557')+'" stroke-width="2"/><circle cx="173" cy="119" r="18" fill="none" stroke="'+(loop ? '#3fd0ff' : '#c9a35a')+'" stroke-width="2" opacity=".8"/>' + txt(173, 123, 'pumpa', 8, '#9aa6a3');
      }
      g += part('cool', c + (bad.cool ? badge(222, 72) : ''), bad.cool);
    }
    // paměti
    if(s.ram){
      const xs = s.ram.dual ? [248, 280] : [248];
      g += part('ram', xs.map(x => box(x - 1, 72, 10, 164, s.ram.r === 'DDR3' ? '#1d5a3c' : '#2a3133', bad.ram ? 'var(--bad)' : '#c9a35a', 2) + (s.ram.r === 'DDR3' ? [0,1,2,3,4,5,6].map(i => box(x + 1, 80 + i * 21, 6, 13, '#111', 'none', 1)).join('') : box(x + 1, 80, 6, 148, '#c9a35a', 'none', 1, ' opacity=".35"'))).join('') + (bad.ram ? badge(290, 76) : ''), bad.ram);
    }
    // grafika
    if(s.gpu){
      if(s.gpu.w === 0) g += part('gpu', txt(201, 284, 'integrovaná grafika v CPU', 9, '#7f8e8a'));
      else {
        const fans = s.gpu.w >= 320 ? 3 : s.gpu.w >= 220 ? 2 : 1, w = fans === 1 ? 170 : 270, x = 90;
        let c = box(x, 248, w, 58, 'url(#bpGpu)', '#56605f', 6) + box(x, 300, w, 6, '#0f1213', 'none', 0);
        for(let i = 0; i < fans; i++) c += fan(x + w / (fans + 1) * (i + 1), 275, 22);
        if(s.gpu.w >= 320) c += box(x + w - 46, 240, 24, 9, '#e8e2cf', '#8f8a7a', 2);
        else if(s.gpu.w >= 220) c += box(x + w - 64, 240, 22, 9, '#e8e2cf', '#8f8a7a', 2) + box(x + w - 38, 240, 16, 9, '#e8e2cf', '#8f8a7a', 2);
        c += txt(x + w - 8, 300, s.gpu.w+' W', 8, '#c9a35a', 'end');
        g += part('gpu', c);
      }
    }
    // disk
    if(s.disk){
      let c = '';
      if(s.disk.m2){ const fl = bad.disk; c = '<g transform="translate(0 '+(fl ? -40 : 0)+')">'+box(122, 201, 108, 8, '#0f3a2c', fl ? 'var(--bad)' : '#2d6a55', 1.5) + [0,1,2].map(i => box(134 + i * 28, 202, 18, 6, '#1a1e1f', 'none', 1)).join('') + txt(176, 220, 'NVMe', 8, '#c9a35a') + '</g>' + (fl ? badge(236, 160) : ''); }
      else if(s.disk.ssd) c = box(398, 382, 74, 50, '#2a3133', '#7d8587', 4) + txt(435, 411, 'SSD', 11, '#d9dede', 'middle', ' font-weight="700"') + txt(435, 424, '2,5″ SATA', 7.5, '#9aa6a3');
      else c = box(392, 378, 112, 62, '#5f686a', '#9aa2a4', 4) + '<circle cx="436" cy="409" r="24" fill="#8d9698" stroke="#c7cdce"/><circle cx="436" cy="409" r="4" fill="#5f686a"/><path d="M482 386l-30 16" stroke="#2b3133" stroke-width="3" stroke-linecap="round"/>' + txt(488, 434, 'HDD', 8, '#1b2122', 'end', ' font-weight="700"');
      if(!s.disk.m2 && s.mb) c += '<path d="M398 400C380 380 380 300 368 290" fill="none" stroke="#c2412d" stroke-width="3" stroke-linecap="round"/>';
      g += part('disk', c, bad.disk);
    }
    // zdroj
    if(s.psu){
      let c = box(34, 376, 186, 64, '#1d2324', bad.psu ? 'var(--bad)' : '#4a5557', 4, bad.psu ? ' stroke-width="2.5"' : '') + '<circle cx="104" cy="408" r="26" fill="url(#bpMesh)" stroke="#3a4446"/>' + fan(104, 408, 22, .8) +
        txt(176, 404, s.psu.w+' W', 13, '#e7c983', 'middle', ' font-weight="700"') + txt(176, 420, s.psu.w >= 650 ? '80+ Gold' : '80 PLUS', 8, '#9aa6a3');
      if(s.mb) c += '<g fill="none" stroke-linecap="round" stroke-width="5" opacity=".9"><path d="M200 376C210 300 300 260 311 172" stroke="#262c2d"/><path d="M60 376C40 250 70 120 124 46" stroke="#262c2d"/></g>';
      if(s.gpu && s.gpu.w > 75) c += '<path d="M150 376C150 330 '+(s.gpu.w >= 320 ? 300 : 290)+' 300 '+(s.gpu.w >= 320 ? 324 : 312)+' 246" fill="none" stroke="#262c2d" stroke-width="4" stroke-linecap="round"/>';
      g += part('psu', c + (bad.psu ? badge(214, 378) : ''), bad.psu);
    }
    // klikací oblasti
    g += hit('mb', 76, 50, 300, 300, s.mb ? '' : '+ základní deska');
    if(s.mb){
      g += hit(!s.cpu || cat === 'cool' ? 'cpu' : 'cool', 128, 74, 90, 90, s.cpu ? '' : '+ CPU');
      g += hit('ram', 226, 66, 64, 176, s.ram ? '' : '+ RAM');
      g += hit('gpu', 90, 244, 272, 64, s.gpu ? '' : '+ grafika');
    }
    g += hit('psu', 32, 374, 192, 68, s.psu ? '' : '+ zdroj') + hit('disk', 386, 374, 124, 68, s.disk ? '' : '+ disk');
    return '<svg class="bpcase" viewBox="0 0 540 472" role="img" aria-label="Skříň počítače se základní deskou">'+g+'</svg>';
  }

  function gauge(load){
    const R = 62, cx = 80, cy = 78, ang = v => Math.PI * (1 - Math.min(v, 1.25) / 1.25), pt = (v, r) => [(cx + Math.cos(ang(v)) * r).toFixed(1), (cy - Math.sin(ang(v)) * r).toFixed(1)];
    const arc = (a, b, col) => { const p = pt(a, R), q = pt(b, R); return '<path d="M'+p[0]+' '+p[1]+'A'+R+' '+R+' 0 0 1 '+q[0]+' '+q[1]+'" fill="none" stroke="'+col+'" stroke-width="10"/>'; };
    const nd = load == null ? null : pt(load, R - 14);
    return '<svg class="bpgauge" viewBox="0 0 160 96" aria-hidden="true">'+arc(0, .5, '#2c3a35')+arc(.5, .75, 'var(--ok)')+arc(.75, 1, 'var(--warn)')+arc(1, 1.25, 'var(--bad)')+
      [0, .5, .75, 1].map(v => { const a = pt(v, R + 10); return '<text x="'+a[0]+'" y="'+a[1]+'" font-size="8" fill="var(--silk-dim)" text-anchor="middle">'+Math.round(v * 100)+'</text>'; }).join('')+
      (nd ? '<path d="M'+cx+' '+cy+'L'+nd[0]+' '+nd[1]+'" stroke="var(--silk)" stroke-width="3" stroke-linecap="round"/>' : '')+'<circle cx="'+cx+'" cy="'+cy+'" r="5" fill="var(--copper)"/></svg>';
  }

  function render(){
    const {s, r, tot, load, bad} = rules(), J = JOBS[job], jr = J.req(s).map(x => [x[0], x[1] === undefined ? false : x[1]]);
    const all = Object.keys(C).every(k => sel[k] != null), okAll = all && r.every(x => x[1]) && jr.every(x => x[1]);
    const led = v => '<i class="bpled '+(v == null ? '' : v ? 'ok' : 'bad')+'"></i>';
    const chips = (k, o) => ({cpu:[o.s, 'TDP '+o.w+' W'], mb:[o.s, o.r, o.m2 ? 'M.2 ✓' : 'bez M.2'], ram:[o.r, o.dual ? 'Dual Channel' : '1 modul'], cool:['do '+o.max+' W'].concat(o.quiet ? ['tichý'] : []),
      psu:[o.w+' W'], disk:[o.m2 ? 'M.2 NVMe' : 'SATA', o.ssd ? 'SSD' : 'HDD'], gpu:[o.w ? o.w+' W' : 'iGPU']}[k]);
    labShell(18, 'Postav si PC · zakázka '+(job+1)+'/'+JOBS.length,
      '<div class="bpjob">'+ico('job')+'<div><b>Zakázka '+(job+1)+'</b><span>'+esc(J.t)+'</span></div></div>'+
      '<div class="bpgrid"><div class="bpleft">'+caseSVG(s, bad)+'</div>'+
      '<div class="bpright"><div class="bptabs">'+ORDER.map(k => '<button class="bptab'+(cat === k ? ' on' : '')+'" data-k="'+k+'">'+ico(k)+'<span>'+TAB[k]+'</span>'+led(sel[k] == null ? null : !bad[k])+'</button>').join('')+'</div>'+
        '<div class="bpshelf"><div class="bpshh">'+ico(cat)+'<b>'+SLOT[cat]+'</b>'+(sel[cat] != null ? '<button class="bpout" id="bpout">Vyndat</button>' : '')+'</div>'+
        C[cat].map((o, i) => '<button class="bpcard'+(sel[cat] === i ? ' on'+(bad[cat] ? ' bad' : '') : '')+'" data-i="'+i+'">'+ico(cat, 'big')+'<span class="bpcn">'+esc(o.n.replace(/\s*\(.*\)$/, ''))+'</span><span class="bpch">'+chips(cat, o).map(c => '<em>'+esc(c)+'</em>').join('')+'</span>'+(sel[cat] === i ? '<span class="bpin">vloženo</span>' : '')+'</button>').join('')+'</div>'+
      '</div></div>'+
      '<div class="bpchecks"><div><h3>Kontrola kompatibility</h3>'+r.map(x => '<div class="bprow">'+led(x[1])+'<span>'+esc(x[0])+(x[2] ? ' <em>'+esc(x[2])+'</em>' : '')+'</span></div>').join('')+
        '<h3>Požadavky zakázky</h3>'+jr.map(x => '<div class="bprow">'+led(x[1] == null ? null : !!x[1])+'<span>'+esc(x[0])+'</span></div>').join('')+'</div>'+
        '<div class="bppsu">'+gauge(load)+'<div class="bppl"><b>'+(s.psu ? Math.round(load * 100)+' %' : '—')+'</b><span>'+(s.psu ? 'odběr ≈ '+tot+' W z '+s.psu.w+' W' : 'zatížení zdroje')+'</span></div></div></div>'+
      '<div class="row"><button class="btn" id="go"'+(okAll ? '' : ' disabled')+'>'+(okAll ? 'Předat zákazníkovi' : 'Sestava zatím nevyhovuje')+'</button></div>',
      'Klikni na místo ve skříni nebo na záložku a vyber díl. Spotřeba ≈ TDP procesoru + grafika + 75 W (deska, paměti, disky, ventilátory). Podle podkladů má zdroj nejlepší účinnost při zatížení 50–75 %.');
    fresh = null;
    $$('.bpcase .bphit').forEach(h => h.onclick = () => { cat = h.dataset.k; beep('tick'); render(); });
    $$('.bptab').forEach(b => b.onclick = () => { cat = b.dataset.k; render(); });
    $$('.bpcard').forEach(b => b.onclick = () => {
      const i = +b.dataset.i; if(sel[cat] === i) return;
      sel[cat] = i; fresh = cat; beep('tick');
      const nx = ORDER.find(k => sel[k] == null); if(nx) cat = nx;
      render();
    });
    if($('#bpout')) $('#bpout').onclick = () => { delete sel[cat]; beep('tick'); render(); };
    $('#go').onclick = () => { beep('ok'); addXP(20); job++; if(job >= JOBS.length) return labDone(18, 'Všechny zakázky předány', [[JOBS.length, 'sestav']], 30, () => LABS[18].find(l => l.name === 'Postav si PC').run(18)); toast('Zákazník je spokojený!'); Object.keys(sel).forEach(k => delete sel[k]); cat = 'mb'; render(); window.scrollTo(0, 0); };
  }
  render();
});

/* ---------- T19/T20: výpočty rozhraní ---------- */
lab(20, 'Rychlosti ATA a SATA', 'Spočítej přenosovou rychlost z taktu a kódování.', calcLab(20, 'Rychlosti ATA a SATA', () => {
  if(Math.random() < .5){ const m = [[16.67,'ATA 66',66],[25,'ATA 100',100],[33.3,'ATA 133',133]][ri(0,2)]; return mcqOf(m[1]+': takt '+fmt(m[0],2)+' MHz, přenos na obou hranách (DDR), šířka 16 bitů. Rychlost?', m[2]+' MB/s', [Math.round(m[2]/2)+' MB/s', m[2]*2+' MB/s', Math.round(m[0]*2)+' MB/s'], 20); }
  const g = [[1.5,'SATA I'],[3,'SATA II'],[6,'SATA III']][ri(0,2)]; return mcqOf(g[1]+' má linkovou rychlost '+fmt(g[0],1)+' Gb/s a kódování 8b/10b. Kolik je to MB/s?', fmt(g[0]*100,0)+' MB/s', [fmt(g[0]*125,0)+' MB/s', fmt(g[0]*80,0)+' MB/s', fmt(g[0]*50,0)+' MB/s'], 20);
}, 'ATA: efektivní frekvence (2 × takt) × 2 B. SATA: 10 bitů na bajt → Gb/s × 100 = MB/s.'));

/* ---------- Kreativní AI: vysvětli to jinak ---------- */
function runCreativeAI(n){
  const t = T[n]; let busy = false, ctl = null;
  const STY = [['story','Příběh','Krátký příběh, kde jsou pojmy postavy nebo místa.'],['rap','Rap','Rapový text se čtyřmi slokami, rýmy pomáhají zapamatovat si pojmy.'],['life','Přirovnání k životu','Vysvětlení přes věci z běžného života (kuchyně, doprava, škola).'],['kid','Pro desetiletého','Úplně jednoduché vysvětlení bez odborných slov, pak jedna odborná věta.'],['mnemo','Mnemotechnika','Pomůcky, zkratky a básničky na zapamatování pořadí a čísel.'],['comic','Komiks','Scénář komiksu na 4 obrázky s dialogy.']];
  let sty = 0, sub = 0;
  async function go(){
    await AI.ready;
    if(!AI.mode) return shell(aiUnavailableHTML());
    if(AI.mode === 'electron' && AI.needKey){ shell(keyFormHTML()); bindKeyForm(() => runCreativeAI(n)); return; }
    busy = true; render('Přemýšlím…');
    const o = t.open[sub] || {q:t.outline[0], k:t.outline};
    const sys = 'Jsi kreativní a přesný učitel IT pro středoškoláky. Píšeš česky, vtipně, ale fakta musí být přesná podle podkladů. Nejvýše 220 slov. Bez úvodu typu „Jasně!“. Na konci přidej řádek „Shrnutí:“ s 3 nejdůležitějšími fakty.';
    const msg = 'Maturitní otázka '+n+': '+t.t+'\nPodotázka: '+o.q+'\nKlíčové body: '+o.k.join('; ')+'\n\nStyl: '+STY[sty][1]+' – '+STY[sty][2]+(RAW[n] ? '\n\nVýtah z podkladů:\n"""\n'+rawExcerpt(n, o.q+' '+o.k.join(' '), 3500)+'\n"""' : '');
    ctl = new AbortController();
    try{ await aiAsk(sys, [{role:'user', content:msg}], s => { const p = $('#cout'); if(p) p.textContent = s; }, ctl.signal); busy = false; const txt = $('#cout') ? $('#cout').textContent : ''; render(txt); addXP(5); }
    catch(e){ busy = false; render(e && e.code === 'cancelled' ? (e.text || '') : aiErrText(e)); }
  }
  function shell(inner){ labShell(n, 'Vysvětli mi to jinak (AI)', inner, 'AI napíše výklad ve zvoleném stylu podle tvých podkladů. Výsledek si můžeš zkopírovat.'); }
  function render(text){
    shell('<p class="muted">Vyber podotázku a styl. Hodí se na věci, které ti nejdou do hlavy.</p>'+
      '<div class="row" style="margin:8px 0"><select id="sub" class="sel">'+t.open.map((o,i) => '<option value="'+i+'"'+(i===sub?' selected':'')+'>'+esc(o.q)+'</option>').join('')+'</select></div>'+
      '<div class="cats">'+STY.map((s,i) => '<button class="btn '+(i===sty?'':'ghost')+' sty" data-i="'+i+'">'+s[1]+'</button>').join('')+'</div>'+
      '<div class="row" style="margin-top:12px"><button class="btn" id="gen"'+(busy?' disabled':'')+'>Vytvořit</button>'+(busy?'<button class="btn red" id="stop">Zastavit</button>':'')+(text && !busy?'<button class="btn ghost" id="copy">Zkopírovat</button>':'')+'</div>'+
      '<div class="aiexp" id="cout">'+esc(text || 'Výsledek se objeví tady.')+'</div>');
    $('#sub').onchange = e => { sub = +e.target.value; };
    $$('.sty').forEach(b => b.onclick = () => { sty = +b.dataset.i; render(text); });
    $('#gen').onclick = go;
    if($('#stop')) $('#stop').onclick = () => ctl && ctl.abort();
    if($('#copy')) $('#copy').onclick = () => { const v = $('#cout').textContent; try{ navigator.clipboard.writeText(v).then(() => toast('Zkopírováno'), () => toast('Kopírování nejde – označ text ručně')); }catch(e){ toast('Kopírování nejde – označ text ručně'); } };
  }
  render('');
}

/* ---------- T5: digitalizace signálu (kreativní) ---------- */
cre(5, 'Digitalizuj signál', 'Nastav vzorkovací frekvenci a počet bitů převodníku a sleduj vzorkování, kvantování, kvantizační chybu i aliasing.', n => {
  const F = 300, WIN = 0.01, UREF = 5;
  const SIG = {
    sin:{t:'sinus 300 Hz', fmax:F, f:t => 2.5 + 2.2*Math.sin(2*Math.PI*F*t)},
    tri:{t:'trojúhelník 300 Hz', fmax:F, f:t => { const p = ((t*F) % 1 + 1) % 1; return 2.5 + 2.2*(p < .5 ? 4*p - 1 : 3 - 4*p); }},
    mix:{t:'složený 300 + 900 Hz', fmax:3*F, f:t => 2.5 + 1.6*Math.sin(2*Math.PI*F*t) + .6*Math.sin(2*Math.PI*3*F*t)}
  };
  const TASKS = [
    {t:'Sinus 300 Hz: nastav nejnižší vzorkovací frekvenci, která ještě splní Nyquistův teorém (fs > 2 · f).', ok:() => sig === 'sin' && fs === 700,
      no:() => sig !== 'sin' ? 'Přepni signál na sinus.' : fs <= 600 ? 'fs = '+fs+' Hz je moc málo – pro 300 Hz potřebuješ víc než 600 Hz.' : 'Funguje to, ale jde to i s nižší frekvencí.'},
    {t:'Převodník má Uref = 5 V. Zvol nejmenší počet bitů, při kterém je kvantizační krok (LSB) menší než 0,1 V.', ok:() => bits === 6,
      no:() => UREF / 2**bits >= .1 ? 'LSB = '+fmt(UREF / 2**bits, 3)+' V – ještě je moc velký.' : 'LSB je dost malý, ale stačí i méně bitů.'},
    {t:'Ukaž aliasing: nastav fs tak, aby se sinus 300 Hz po vzorkování jevil jako signál 100 Hz.', ok:() => sig === 'sin' && (fs === 200 || fs === 400),
      no:() => sig !== 'sin' ? 'Přepni signál na sinus.' : 'Při fs = '+fs+' Hz vypadá signál jako '+alias(fs)+' Hz.'}
  ];
  let sig = 'sin', fs = 1500, bits = 3, ti = 0;
  const alias = f => Math.abs(F - f * Math.round(F / f));
  const X = t => 44 + t / WIN * 586, Y = v => 262 - v / UREF * 236;
  function samples(){ const out = []; for(let k = 0; k / fs <= WIN + 1e-9; k++){ const t = k / fs, v = SIG[sig].f(t), lsb = UREF / 2**bits, q = Math.max(0, Math.min(2**bits - 1, Math.round(v / lsb))); out.push({k, t, v, q, vq:q*lsb}); } return out; }
  function plot(){
    const S = samples(), L = 2**bits, lsb = UREF / L, under = fs <= 2*SIG[sig].fmax;
    let g = '<rect x="44" y="26" width="586" height="236" class="dgbg"/>';
    if(L <= 64) for(let q = 0; q < L; q++) g += '<path d="M44 '+Y(q*lsb).toFixed(1)+'H630" class="dglvl"/>';
    for(let v = 0; v <= 5; v++) g += '<text x="38" y="'+(Y(v)+4)+'" text-anchor="end" class="dgt">'+v+' V</text>';
    for(let m = 0; m <= 10; m += 2) g += '<text x="'+X(m/1000)+'" y="280" text-anchor="middle" class="dgt">'+m+' ms</text>';
    let a = ''; for(let i = 0; i <= 500; i++){ const t = WIN * i / 500; a += (i ? 'L' : 'M')+X(t).toFixed(1)+' '+Y(SIG[sig].f(t)).toFixed(1); }
    g += '<path d="'+a+'" class="dgan"/>';
    let st = ''; S.forEach((s, i) => { const x0 = X(s.t), x1 = X(Math.min(WIN, S[i+1] ? S[i+1].t : WIN)); st += (i ? 'L'+x0.toFixed(1)+' '+Y(s.vq).toFixed(1) : 'M'+x0.toFixed(1)+' '+Y(s.vq).toFixed(1))+'H'+x1.toFixed(1); });
    g += '<path d="'+st+'" class="dgst"/>';
    if(under && sig === 'sin'){ const m = Math.round(F / fs), fa = F - m*fs; let r = ''; for(let i = 0; i <= 500; i++){ const t = WIN * i / 500; r += (i ? 'L' : 'M')+X(t).toFixed(1)+' '+Y(2.5 + 2.2*Math.sin(2*Math.PI*fa*t)).toFixed(1); } g += '<path d="'+r+'" class="dgal"/>'; }
    S.forEach(s => { g += '<path d="M'+X(s.t).toFixed(1)+' 262V'+Y(s.v).toFixed(1)+'" class="dgstem"/><circle cx="'+X(s.t).toFixed(1)+'" cy="'+Y(s.v).toFixed(1)+'" r="3.6" class="dgpt"/>'; });
    g += '<g class="dgleg"><path d="M60 14h18" class="dgan"/><text x="82" y="18" class="dgt">analogový signál</text><circle cx="196" cy="14" r="3.6" class="dgpt"/><text x="204" y="18" class="dgt">vzorky</text><path d="M262 14h18" class="dgst"/><text x="284" y="18" class="dgt">kvantovaný výstup</text>'+
      (under && sig === 'sin' ? '<path d="M412 14h18" class="dgal"/><text x="434" y="18" class="dgt al">alias '+alias(fs)+' Hz</text>' : '')+'</g>';
    return '<svg class="dgsvg" viewBox="0 0 640 290" role="img" aria-label="Vzorkování a kvantování signálu">'+g+'</svg>';
  }
  function info(){
    const S = samples(), lsb = UREF / 2**bits, under = fs <= 2*SIG[sig].fmax, err = Math.max(...S.map(s => Math.abs(s.v - s.vq)));
    const row = (k, v, c) => '<div class="dgi'+(c ? ' '+c : '')+'"><span>'+k+'</span><b>'+v+'</b></div>';
    return '<div class="dginfo">'+row('vzorkovací frekvence', fs+' Hz')+row('Nyquist (2 · f<sub>max</sub>)', 2*SIG[sig].fmax+' Hz', under ? 'bad' : 'ok')+row('vzorků na periodu 300 Hz', fmt(fs / F, 2))+
      row('úrovní (2<sup>n</sup>)', 2**bits)+row('kvantizační krok LSB', fmt(lsb, 3)+' V')+row('max. chyba (LSB/2)', fmt(lsb/2, 3)+' V')+row('datový tok', fmt(fs*bits/1000, 1)+' kb/s')+row('odstup S/N ≈ 6,02 n + 1,76', fmt(6.02*bits + 1.76, 1)+' dB')+'</div>'+
      (under ? '<p class="dgwarn">⚠ fs ≤ 2 · f<sub>max</sub> – vzorky nestačí, signál nejde správně zrekonstruovat'+(sig === 'sin' ? ' a jeví se jako '+alias(fs)+' Hz (aliasing)' : '')+'.</p>' : '<p class="dgok">✓ Nyquistův teorém splněn – signál jde ze vzorků zrekonstruovat.</p>')+
      '<div class="tblwrap"><table class="tbl dgtbl"><tr><th>vzorek</th><th>čas</th><th>napětí</th><th>kód</th><th>výstup</th><th>chyba</th></tr>'+
      S.slice(0, 6).map(s => '<tr><td>'+s.k+'</td><td>'+fmt(s.t*1000, 2)+' ms</td><td>'+fmt(s.v, 3)+' V</td><td class="mono">'+s.q.toString(2).padStart(bits, '0')+'</td><td>'+fmt(s.vq, 3)+' V</td><td>'+fmt(Math.abs(s.v - s.vq), 3)+' V</td></tr>').join('')+'</table></div>'+
      '<p class="muted small">Největší chyba v okně: '+fmt(err, 3)+' V</p>';
  }
  function update(){ const p = $('#dgplot'), i = $('#dginfo'); if(!p) return; p.innerHTML = plot(); i.innerHTML = info(); $('#dgfsv').textContent = fs+' Hz'; $('#dgbv').textContent = bits+' b'; }
  function render(){
    labShell(5, 'Digitalizuj signál', '<p class="dgtask">'+(ti < TASKS.length ? '<b>Úkol '+(ti+1)+'/'+TASKS.length+':</b> '+esc(TASKS[ti].t) : '<b>Všechny úkoly splněné.</b> Zkoušej dál, nebo dokonči.')+'</p>'+
      '<div class="seg ledseg dgseg">'+Object.keys(SIG).map(k => '<button class="'+(k === sig ? 'on' : '')+'" data-s="'+k+'">'+SIG[k].t+'</button>').join('')+'</div>'+
      '<div class="dgwrap" id="dgplot">'+plot()+'</div>'+
      '<div class="dgctl"><label><span>vzorkovací frekvence f<sub>s</sub></span><input type="range" id="dgfs" class="slider" min="200" max="4000" step="100" value="'+fs+'"><b id="dgfsv">'+fs+' Hz</b></label>'+
      '<label><span>rozlišení převodníku n</span><input type="range" id="dgb" class="slider" min="1" max="8" step="1" value="'+bits+'"><b id="dgbv">'+bits+' b</b></label></div>'+
      '<div id="dginfo">'+info()+'</div>'+
      '<div class="row" style="margin-top:12px">'+(ti < TASKS.length ? '<button class="btn" id="dgchk">Ověřit úkol</button>' : '<button class="btn" id="dgfin">Dokončit</button>')+'</div>',
      'Vzorkování = odběr hodnot v čase, kvantování = zaokrouhlení na jednu z 2ⁿ úrovní, kódování = zápis úrovně binárně. LSB = Uref / 2ⁿ.');
    $$('.dgseg button').forEach(b => b.onclick = () => { sig = b.dataset.s; beep('tick'); render(); });
    $('#dgfs').oninput = e => { fs = +e.target.value; update(); };
    $('#dgb').oninput = e => { bits = +e.target.value; update(); };
    if($('#dgchk')) $('#dgchk').onclick = () => { const T = TASKS[ti]; if(T.ok()){ beep('ok'); toast('Úkol splněn!'); addXP(10); ti++; render(); } else { beep('bad'); toast(T.no()); } };
    if($('#dgfin')) $('#dgfin').onclick = () => labDone(5, 'Signál zdigitalizovaný', [[TASKS.length, 'úkoly']], 25, () => LABS[5].find(l => l.name === 'Digitalizuj signál').run(5));
  }
  render();
});

/* ---------- T4: diferenciální pár (kreativní) ---------- */
cre(4, 'Diferenciální pár proti rušení', 'Pošli bity po kabelu, do kterého se indukuje rušení. Porovnej přenos jedním vodičem proti zemi a diferenciálním párem a zjisti, proč se vodiče kroutí.', n => {
  const BITS = [1,0,1,1,0,0,1,0,1,1,0,1,0,0,1,0], SPB = 24, NS = BITS.length * SPB;
  let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const smooth = (a, w) => a.map((_, i) => { let s = 0, c = 0; for(let j = -w; j <= w; j++){ const k = i + j; if(k >= 0 && k < a.length){ s += a[k]; c++; } } return s / c; });
  const norm = a => { const m = Math.max(...a.map(Math.abs)); return a.map(x => x / m); };
  const NC = norm(smooth(Array.from({length:NS}, (_, i) => .7*Math.sin(2*Math.PI*i/(SPB*2.7)) + .5*Math.sin(2*Math.PI*i/(SPB*.9) + 1) + (rnd()*2 - 1)*.6), 3));
  const NI = norm(smooth(Array.from({length:NS}, (_, i) => .8*Math.sin(2*Math.PI*i/(SPB*1.7) + 2) + (rnd()*2 - 1)*.7), 3));
  const TASKS = [
    {t:'Jeden vodič proti zemi (nesymetricky): zvyš rušení, až přijímač začne chybovat.', ok:r => mode === 'se' && r.err > 0, no:() => mode !== 'se' ? 'Přepni na „jeden vodič proti zemi“.' : 'Rušení je zatím malé – zvyš ho.'},
    {t:'Přepni na diferenciální pár (kroucená dvojlinka) a ukaž, že ani při rušení aspoň 2 V nevznikne chyba.', ok:r => mode === 'diff' && twist && noise >= 2 && r.err === 0, no:r => mode !== 'diff' ? 'Přepni na diferenciální pár.' : !twist ? 'Zapni kroucení vodičů.' : 'Nastav rušení aspoň na 2 V.'},
    {t:'Proč se vodiče kroutí? U diferenciálního páru kroucení vypni a najdi rušení, při kterém začne chybovat i on.', ok:r => mode === 'diff' && !twist && r.err > 0, no:() => mode !== 'diff' ? 'Přepni na diferenciální pár.' : twist ? 'Vypni kroucení vodičů.' : 'Zvyš rušení.'}
  ];
  let mode = 'se', noise = .6, twist = true, ti = 0;
  function sim(){
    const a = [], b = [], rx = [], dec = [];
    for(let i = 0; i < NS; i++){
      const s = BITS[Math.floor(i / SPB)];
      if(mode === 'se'){ a.push(3.3*s - noise*NC[i]); b.push(0); rx.push(a[i]); }
      else { const nm = twist ? NC[i] : .55*NC[i] + .45*NI[i]; a.push(1.2 + .2*(2*s - 1) + noise*NC[i]); b.push(1.2 - .2*(2*s - 1) + noise*nm); rx.push(a[i] - b[i]); }
    }
    const th = mode === 'se' ? 1.65 : 0; let err = 0, margin = Infinity;
    BITS.forEach((s, k) => { const v = rx[k*SPB + SPB/2], r = v > th ? 1 : 0; dec.push(r); if(r !== s) err++; margin = Math.min(margin, (s ? v - th : th - v)); });
    return {a, b, rx, dec, err, th, margin};
  }
  function lane(arr, y0, h, lo, hi, cls, label, th){
    const X = i => 70 + i / (NS - 1) * 560, Y = v => y0 + h - (Math.max(lo, Math.min(hi, v)) - lo) / (hi - lo) * h;
    let d = ''; arr.forEach((v, i) => d += (i ? 'L' : 'M')+X(i).toFixed(1)+' '+Y(v).toFixed(1));
    let g = '<rect x="70" y="'+y0+'" width="560" height="'+h+'" class="dpbg"/><text x="62" y="'+(y0 + h/2 + 4)+'" text-anchor="end" class="dpt">'+label+'</text>';
    if(th != null) g += '<path d="M70 '+Y(th).toFixed(1)+'H630" class="dpth"/><text x="634" y="'+(Y(th)+3).toFixed(1)+'" class="dpt s">práh</text>';
    return g + '<path d="'+d+'" class="dpw '+cls+'"/>';
  }
  function scene(r){
    let g = '';
    const wave = twist ? 'M140 40 C155 26,170 54,185 40 S215 26,230 40 S260 54,275 40 S305 26,320 40 S350 54,365 40 S395 26,410 40 S440 54,455 40 S485 26,500 40' : 'M140 34H500';
    const wave2 = twist ? 'M140 40 C155 54,170 26,185 40 S215 54,230 40 S260 26,275 40 S305 54,320 40 S350 26,365 40 S395 54,410 40 S440 26,455 40 S485 54,500 40' : 'M140 46H500';
    g += '<rect x="20" y="20" width="110" height="40" rx="6" class="dpbox"/><text x="75" y="44" text-anchor="middle" class="dpt">vysílač</text><rect x="510" y="20" width="110" height="40" rx="6" class="dpbox"/><text x="565" y="44" text-anchor="middle" class="dpt">přijímač</text>';
    if(mode === 'se') g += '<path d="M140 34H500" class="dpcab a"/><path d="M140 52H500" class="dpcab gnd"/><text x="320" y="70" text-anchor="middle" class="dpt s">signál + zem (GND)</text>';
    else g += '<path d="'+wave+'" class="dpcab a"/><path d="'+wave2+'" class="dpcab b"/><text x="320" y="72" text-anchor="middle" class="dpt s">'+(twist ? 'kroucená dvojlinka D+ / D−' : 'rovné vodiče D+ / D− vedle sebe')+'</text>';
    if(noise > 0) g += '<path d="M300 4l-8 12h7l-6 12 14-16h-7l6-8z" class="dpzap" opacity="'+Math.min(1, .3 + noise/3)+'"/><text x="318" y="14" class="dpt s zap">rušení '+fmt(noise, 1)+' V</text>';
    const L = mode === 'se'
      ? lane(r.a, 92, 64, -3.5, 7, 'a', 'vodič', null) + lane(r.rx, 176, 64, -3.5, 7, 'rx', 'přijímač', r.th)
      : lane(r.a, 92, 52, -2.5, 5, 'a', 'D+', null) + lane(r.b, 160, 52, -2.5, 5, 'b', 'D−', null) + lane(r.rx, 228, 52, -1.6, 1.6, 'rx', 'D+ − D−', r.th);
    const yb = mode === 'se' ? 262 : 300;
    let bits = ''; BITS.forEach((s, k) => { const x = 70 + (k + .5) * 560 / BITS.length, bad = r.dec[k] !== s; bits += '<text x="'+x.toFixed(1)+'" y="'+yb+'" text-anchor="middle" class="dpbit">'+s+'</text><text x="'+x.toFixed(1)+'" y="'+(yb + 18)+'" text-anchor="middle" class="dpbit'+(bad ? ' bad' : ' ok')+'">'+r.dec[k]+'</text>'; });
    bits += '<text x="62" y="'+yb+'" text-anchor="end" class="dpt s">odesláno</text><text x="62" y="'+(yb + 18)+'" text-anchor="end" class="dpt s">přijato</text>';
    return '<svg class="dpsvg" viewBox="0 0 660 '+(yb + 30)+'" role="img" aria-label="Přenos signálu po kabelu s rušením">'+g+L+bits+'</svg>';
  }
  function update(){
    const r = sim(), p = $('#dpplot'); if(!p) return;
    p.innerHTML = scene(r);
    $('#dpstat').innerHTML = '<span class="'+(r.err ? 'bad' : 'ok')+'">chybných bitů: <b>'+r.err+'/'+BITS.length+'</b></span><span>nejmenší rezerva u prahu: <b>'+fmt(r.margin, 2)+' V</b></span><span>'+(mode === 'se' ? 'úrovně 0 V / 3,3 V' : 'úrovně ±0,2 V kolem 1,2 V (rozdíl ±0,4 V)')+'</span>';
    $('#dpnv').textContent = fmt(noise, 1)+' V';
    return r;
  }
  function render(){
    labShell(4, 'Diferenciální pár proti rušení', '<p class="dgtask">'+(ti < TASKS.length ? '<b>Úkol '+(ti+1)+'/'+TASKS.length+':</b> '+esc(TASKS[ti].t) : '<b>Všechny úkoly splněné.</b>')+'</p>'+
      '<div class="dpctl"><div class="seg ledseg"><button class="'+(mode === 'se' ? 'on' : '')+'" data-m="se">jeden vodič proti zemi</button><button class="'+(mode === 'diff' ? 'on' : '')+'" data-m="diff">diferenciální pár</button></div>'+
      '<label class="dptw'+(mode === 'diff' ? '' : ' off')+'"><input type="checkbox" id="dptw"'+(twist ? ' checked' : '')+(mode === 'diff' ? '' : ' disabled')+'> kroucené vodiče</label></div>'+
      '<div class="dgctl"><label><span>indukované rušení</span><input type="range" id="dpn" class="slider" min="0" max="3" step="0.1" value="'+noise+'"><b id="dpnv"></b></label></div>'+
      '<div class="dgwrap" id="dpplot"></div><p class="dpstat" id="dpstat"></p>'+
      '<div class="row" style="margin-top:10px">'+(ti < TASKS.length ? '<button class="btn" id="dpchk">Ověřit úkol</button>' : '<button class="btn" id="dpfin">Dokončit</button>')+'</div>',
      'Přijímač diferenciálního páru vyhodnocuje rozdíl D+ − D−. Rušení, které se indukuje do obou vodičů stejně (souhlasné), se odečte. Kroucení zajistí, že oba vodiče chytí stejné rušení.');
    update();
    $$('.dpctl .seg button').forEach(b => b.onclick = () => { mode = b.dataset.m; beep('tick'); render(); });
    if($('#dptw')) $('#dptw').onchange = e => { twist = e.target.checked; update(); };
    $('#dpn').oninput = e => { noise = +e.target.value; update(); };
    if($('#dpchk')) $('#dpchk').onclick = () => { const r = sim(), T = TASKS[ti]; if(T.ok(r)){ beep('ok'); toast('Úkol splněn!'); addXP(10); ti++; render(); } else { beep('bad'); toast(T.no(r)); } };
    if($('#dpfin')) $('#dpfin').onclick = () => labDone(4, 'Rušení přemoženo', [[TASKS.length, 'úkoly']], 25, () => LABS[4].find(l => l.name === 'Diferenciální pár proti rušení').run(4));
  }
  render();
});

/* ---------- T14: Secure Boot a TPM (kreativní) ---------- */
cre(14, 'Secure Boot a TPM', 'Spusť počítač přes řetěz UEFI → zavaděč → jádro → BitLocker. Zapínej Secure Boot a CSM, podstrč bootkit a sleduj, jak TPM pozná změnu.', n => {
  const LD = {
    wbm:{t:'Windows Boot Manager', s:'podpis Microsoft (klíč v db)', signed:true},
    shim:{t:'GRUB přes shim (Linux)', s:'podpis Microsoft UEFI CA (db)', signed:true},
    kit:{t:'Zavaděč s bootkitem', s:'bez platného podpisu', signed:false},
    old:{t:'Starý zavaděč z černé listiny', s:'podpis Microsoft, ale hash je v dbx', signed:true, dbx:true}
  };
  const TASKS = [
    {t:'Bezpečný start: nabootuj Windows se zapnutým Secure Bootem a BitLockerem tak, aby TPM uvolnil klíč k disku.', ok:r => r.end === 'ok' && r.sb && r.bl && r.ld === 'wbm'},
    {t:'Útok: podstrč zavaděč s bootkitem při zapnutém Secure Bootu. Co se stane?', ok:r => r.end === 'blocked' && r.ld === 'kit'},
    {t:'Vypni Secure Boot a spusť bootkit se zapnutým BitLockerem. Pozná to TPM?', ok:r => r.end === 'recovery' && r.ld === 'kit' && !r.sb},
    {t:'Zapni CSM (legacy režim) a zkus nabootovat. Co se stane se Secure Bootem?', ok:r => r.csm}
  ];
  let sb = true, csm = false, bl = true, ld = 'wbm', ti = 0, run = null, busy = false;
  const H = s => { let h = 0x811c9dc5; for(let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h.toString(16).toUpperCase().padStart(8, '0'); };
  const ext = (pcr, m) => H(pcr + '|' + m);
  const Z = '00000000';
  const pcrs = (sbOn, csmOn, l) => ({p0:ext(Z, 'UEFI 2.7 firmware'), p4:ext(Z, csmOn ? 'MBR legacy' : 'efi:' + l), p7:ext(Z, 'SecureBoot=' + (sbOn ? 1 : 0))});
  const SEALED = pcrs(true, false, 'wbm');
  function simulate(){
    const eff = sb && !csm, st = [], P = {p0:Z, p4:Z, p7:Z};
    st.push({id:'fw', t:'UEFI firmware', s:'ok', m:csm ? 'CSM zapnutý: firmware emuluje BIOS a bootuje z MBR – Secure Boot nejde použít' : 'POST, inicializace HW; Secure Boot '+(eff ? 'zapnutý' : 'vypnutý')});
    P.p0 = ext(Z, 'UEFI 2.7 firmware'); P.p7 = ext(Z, 'SecureBoot=' + (eff ? 1 : 0));
    const L = LD[ld];
    let end = 'ok';
    if(eff && (!L.signed || L.dbx)){
      st.push({id:'ld', t:L.t, s:'blocked', m:L.dbx ? 'Hash zavaděče je v databázi zakázaných (dbx) – Secure Boot ho nespustí' : 'Chybí platný digitální podpis – Secure Boot spuštění zastavil'});
      end = 'blocked';
    } else {
      st.push({id:'ld', t:csm ? 'Zavaděč z MBR (legacy)' : L.t, s:!L.signed && !csm ? 'warn' : 'ok', m:csm ? 'Legacy boot: zaváděcí kód z MBR, podpisy se nekontrolují' : eff ? 'Podpis ověřen: '+L.s : 'Secure Boot vypnutý – podpis se nekontroluje ('+L.s+')'});
      P.p4 = ext(Z, csm ? 'MBR legacy' : 'efi:' + ld);
      st.push({id:'krn', t:ld === 'shim' ? 'Jádro Linuxu' : 'Jádro Windows + ovladače', s:ld === 'kit' && !csm ? 'warn' : 'ok', m:ld === 'kit' && !csm ? 'Jádro běží, ale bootkit se zavedl dřív a antivirus ho nevidí' : 'Zavaděč ověřil a spustil jádro'});
      if(bl && ld !== 'shim'){
        const ok = P.p0 === SEALED.p0 && P.p4 === SEALED.p4 && P.p7 === SEALED.p7;
        st.push({id:'bl', t:'BitLocker + TPM', s:ok ? 'ok' : 'blocked', m:ok ? 'Registry PCR odpovídají zapečetěným hodnotám → TPM uvolnil klíč, disk je odemčený' : 'PCR se liší od zapečetěných hodnot → TPM klíč neuvolní → zadej 48místný obnovovací klíč BitLockeru'});
        if(!ok) end = 'recovery';
      } else st.push({id:'bl', t:bl ? 'BitLocker' : 'Disk bez šifrování', s:'ok', m:bl ? 'Linux disk BitLockerem nešifruje' : 'BitLocker je vypnutý – disk není šifrovaný, TPM nic nekontroluje'});
    }
    return {st, P, end, sb:eff, bl, ld, csm};
  }
  function chain(){
    const stages = ['fw','ld','krn','bl'], names = {fw:'UEFI firmware', ld:'Zavaděč', krn:'Jádro OS', bl:'BitLocker / TPM'};
    const shown = run ? run.r.st.slice(0, run.k) : [];
    return '<div class="sbchain">'+stages.map((id, i) => { const s = shown.find(x => x.id === id); const st = s ? s.s : run && run.k > i ? 'skip' : 'wait';
      return (i ? '<i class="sbar'+(s ? ' on' : '')+'">→</i>' : '')+'<div class="sbst '+st+'"><b>'+esc(s ? s.t : names[id])+'</b><span>'+(s ? esc(s.m) : st === 'skip' ? 'nespustilo se' : 'čeká')+'</span><em>'+({ok:'✓', warn:'!', blocked:'✗', wait:'·', skip:'—'})[st]+'</em></div>'; }).join('')+'</div>';
  }
  function pcrPanel(){
    const P = run && run.k >= 1 ? run.r.P : {p0:'—', p4:'—', p7:'—'};
    const row = (k, lbl) => { const v = P[k], s = SEALED[k], m = run && run.k >= 2 && v === s; return '<tr><td>PCR'+k.slice(1)+'</td><td>'+lbl+'</td><td class="mono '+(run && run.k >= 2 ? (m ? 'ok' : 'bad') : '')+'">'+v+'</td><td class="mono">'+s+'</td></tr>'; };
    return '<div class="sbpcr"><h4>TPM – registry PCR</h4><table class="tbl"><tr><th></th><th>měří</th><th>teď</th><th>zapečetěno</th></tr>'+row('p0', 'firmware')+row('p4', 'zavaděč')+row('p7', 'politika Secure Boot')+'</table>'+
      '<p class="muted small">PCR se nedá přepsat, jen „rozšířit“: PCR = hash(PCR + měření). Klíč BitLockeru je zapečetěný k hodnotám PCR při bezpečném startu.</p></div>';
  }
  function screen(){
    if(!run || run.k < run.r.st.length) return '<div class="sbscr wait">'+(run ? 'Startuji…' : 'Nastav firmware a stiskni Zapnout.')+'</div>';
    const e = run.r.end;
    return e === 'blocked' ? '<div class="sbscr bad"><b>Secure Boot Violation</b><span>Neplatný podpis zavaděče. Systém se nespustí.</span></div>'
      : e === 'recovery' ? '<div class="sbscr rec"><b>Obnovení nástroje BitLocker</b><span>Zadejte obnovovací klíč pro tuto jednotku (48 číslic).</span></div>'
      : ld === 'kit' ? '<div class="sbscr warn"><b>Systém nabootoval</b><span>…ale v paměti běží bootkit. Nic to neodhalilo.</span></div>'
      : '<div class="sbscr ok"><b>'+(ld === 'shim' ? 'Linux se spouští' : 'Windows se spouští')+'</b><span>'+(bl && ld !== 'shim' ? 'Disk odemčený klíčem z TPM.' : 'Start proběhl.')+'</span></div>';
  }
  const tog = (id, on, lbl, dis) => '<button class="sbtog'+(on ? ' on' : '')+'" id="'+id+'"'+(dis ? ' disabled' : '')+'><i></i>'+lbl+'</button>';
  function render(){
    labShell(14, 'Secure Boot a TPM', '<p class="dgtask">'+(ti < TASKS.length ? '<b>Úkol '+(ti+1)+'/'+TASKS.length+':</b> '+esc(TASKS[ti].t) : '<b>Všechny úkoly splněné.</b>')+'</p>'+
      '<div class="sbx"><div class="sbfw"><h4>Nastavení UEFI</h4>'+tog('sbsb', sb && !csm, 'Secure Boot', csm)+tog('sbcsm', csm, 'CSM (legacy BIOS)')+tog('sbbl', bl, 'BitLocker s TPM')+
        '<h4>Zavaděč na disku</h4>'+Object.keys(LD).map(k => '<label class="sbld'+(ld === k ? ' on' : '')+'"><input type="radio" name="sbld" value="'+k+'"'+(ld === k ? ' checked' : '')+'><b>'+esc(LD[k].t)+'</b><span>'+esc(LD[k].s)+'</span></label>').join('')+
        '<button class="btn" id="sbgo"'+(busy ? ' disabled' : '')+'>⏻ Zapnout počítač</button></div>'+
      '<div class="sbmain">'+chain()+'<div class="sbbot">'+screen()+pcrPanel()+'</div></div></div>'+
      (ti >= TASKS.length ? '<div class="row" style="margin-top:12px"><button class="btn" id="sbfin">Dokončit</button></div>' : ''),
      'Secure Boot kontroluje podpisy podle databází ve firmwaru (PK, KEK, db povolené, dbx zakázané). TPM měří každou fázi do registrů PCR – BitLocker dostane klíč jen při stejných hodnotách jako při bezpečném startu.');
    $('#sbsb').onclick = () => { if(busy) return; sb = !sb; run = null; render(); };
    $('#sbcsm').onclick = () => { if(busy) return; csm = !csm; run = null; render(); };
    $('#sbbl').onclick = () => { if(busy) return; bl = !bl; run = null; render(); };
    $$('input[name="sbld"]').forEach(r => r.onchange = () => { if(busy) return; ld = r.value; run = null; render(); });
    $('#sbgo').onclick = boot;
    if($('#sbfin')) $('#sbfin').onclick = () => labDone(14, 'Bootovací řetěz pochopený', [[TASKS.length, 'úkoly']], 30, () => LABS[14].find(l => l.name === 'Secure Boot a TPM').run(14));
  }
  function boot(){
    if(busy) return;
    busy = true; run = {r:simulate(), k:0}; beep('tick'); render();
    const step = () => {
      if(!$('#sbgo')){ busy = false; return; }
      run.k++; beep(run.r.st[run.k - 1].s === 'blocked' ? 'bad' : 'tick');
      if(run.k < run.r.st.length){ render(); setTimeout(step, 650); return; }
      busy = false;
      if(ti < TASKS.length && TASKS[ti].ok(run.r)){ ti++; addXP(10); beep('ok'); toast('Úkol splněn!'); }
      render();
    };
    setTimeout(step, 500);
  }
  render();
});

/* ---------- štítek „mimo PDF“ u laboratoří, které nevycházejí z podkladů ---------- */
(function(){
  const XL = new Set(['Diferenciální pár proti rušení','Secure Boot a TPM','Rozsviť LED přes registry','Zapnutí LED v kódu','Naprogramuj procesor','LED matice 8×8','Cache: hit, nebo miss?','Geometrie a adresace','Postav si PC','Terminál 2: roury a proměnné','Bubble sort krok za krokem','Postup práce se souborem','Formátové specifikátory']);
  Object.keys(LABS).forEach(k => LABS[k].forEach(l => { if(XL.has(l.name) || (T[k] && T[k].x)) l.x = true; }));
})();
