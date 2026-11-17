/* ================= OBRÁZKY Z PDF ================= */
function imgsOf(n){ return (IMG && IMG[n]) || []; }
/* obrázek z PDF má číslo strany (p), nakreslené schéma podle podkladů má popisek (cap) */
function imgWhere(im){ return im.p ? 'strana ' + im.p + ' v PDF' : 'schéma podle podkladů: ' + (im.cap || ''); }
function imgAlt(n, im){ return im.p ? 'Obrázek z PDF k otázce ' + n + ', strana ' + im.p : 'Schéma k otázce ' + n + ': ' + (im.cap || ''); }
function lightbox(n, i){
  const list = imgsOf(n); if(!list.length) return;
  const lb = document.createElement('div'); lb.className = 'lbx'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-label', 'Obrázek z PDF');
  const draw = () => { lb.innerHTML = '<figure><img src="' + list[i].s + '" alt="' + esc(imgAlt(n, list[i])) + '"><figcaption>' + esc(n + '. ' + T[n].t) + ' · ' + esc(imgWhere(list[i])) + ' · ' + (i+1) + '/' + list.length + '</figcaption></figure>' +
    '<button class="lbx-x" aria-label="Zavřít">✕</button>' + (list.length > 1 ? '<button class="lbx-p" aria-label="Předchozí">‹</button><button class="lbx-n" aria-label="Další">›</button>' : ''); bind(); };
  const close = () => { lb.remove(); document.removeEventListener('keydown', key, true); };
  const key = e => { if(e.key === 'Escape'){ e.stopPropagation(); close(); } else if(e.key === 'ArrowRight'){ e.stopPropagation(); i = (i+1) % list.length; draw(); } else if(e.key === 'ArrowLeft'){ e.stopPropagation(); i = (i-1+list.length) % list.length; draw(); } };
  function bind(){
    lb.querySelector('.lbx-x').onclick = close;
    if(lb.querySelector('.lbx-n')){ lb.querySelector('.lbx-n').onclick = e => { e.stopPropagation(); i = (i+1) % list.length; draw(); }; lb.querySelector('.lbx-p').onclick = e => { e.stopPropagation(); i = (i-1+list.length) % list.length; draw(); }; }
  }
  lb.onclick = e => { if(e.target === lb) close(); };
  document.addEventListener('keydown', key, true); document.body.appendChild(lb); draw();
}
function galleryHTML(n, title){
  const list = imgsOf(n); if(!list.length) return '';
  return '<div class="section"><h2>' + (title || 'Obrázky z tvých PDF') + '</h2><div class="gal">' + list.map((im, i) => '<button class="gal-i" data-gn="' + n + '" data-gi="' + i + '"><img src="' + im.s + '" alt="" loading="lazy" decoding="async"><span>' + (im.p ? 'str. ' + im.p : 'schéma') + '</span></button>').join('') + '</div></div>';
}
function bindGallery(){ view.querySelectorAll('.gal-i').forEach(b => b.onclick = () => lightbox(+b.dataset.gn, +b.dataset.gi)); }

/* Kvíz: ze které otázky je obrázek? */
function runImageQuiz(){
  const pool = []; Object.keys(IMG || {}).forEach(n => imgsOf(n).forEach((im, i) => pool.push({n:+n, i})));
  const set = shuffle(pool).slice(0, 10);
  runQuiz({title:'Poznej obrázek', total:set.length, lives:null, record:false, next:k => {
    const it = set[k], others = shuffle(NUMS.filter(x => x !== it.n)).slice(0, 3);
    const opts = shuffle([it.n, ...others].map(x => x + '. ' + T[x].t));
    const ans = it.n + '. ' + T[it.n].t;
    return {id:null, n:it.n, text:'Ze které maturitní otázky je tento obrázek?', img:imgsOf(it.n)[it.i].s, opts, correct:opts.indexOf(ans), ans};
  }, back:() => go(''), again:() => runImageQuiz()});
}
