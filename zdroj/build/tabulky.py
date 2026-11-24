"""Tabulky z PDF podkladů → Markdown tabulky v zdroj/raw/N.txt.

pdftotext bez -layout vypíše každou buňku tabulky na samostatný řádek, takže tabulka ve čtečce
vypadá jako dlouhý sloupec slov. Tenhle skript najde tabulky v textu s rozložením (pdftotext -layout),
poskládá řádky a buňky a v raw textu nahradí rozsypané buňky řádky „| a | b | c |“.
Čtečka (rawParas v extra.js) je pak vykreslí jako <table>.

Použití:  python3 zdroj/build/tabulky.py zdroj materialy [--dry]
Skript je idempotentní – tabulku, která už v raw textu je, znovu nepřidá.
"""
import re, subprocess, sys, os

def pages(pdf):
    out = subprocess.run(['pdftotext', '-layout', pdf, '-'], capture_output=True, text=True).stdout
    return out.split('\f')

SEG = re.compile(r'\S(?:.*?\S)?(?=\s{3,}|$)')   # úsek textu oddělený aspoň 3 mezerami

def segs(line):
    return [(m.start(), m.end(), m.group(0)) for m in SEG.finditer(line)]

def tables_on_page(text):
    lines = text.split('\n'); out = []; i = 0
    while i < len(lines):
        s = segs(lines[i])
        if len(s) < 2 or any(len(x[2]) > 60 for x in s):
            i += 1; continue
        # kandidát na záhlaví tabulky: sloupce podle středů úseků
        cols = [(a + b) / 2 for a, b, _ in s]
        rows, cur, j, blank = [], None, i, 0
        def col_of(a, b):
            c = (a + b) / 2; return min(range(len(cols)), key=lambda k: abs(cols[k] - c))
        while j < len(lines):
            ln = lines[j]
            if not ln.strip():
                blank += 1
                if cur is not None: rows.append(cur); cur = None
                if blank > 2: break
                j += 1; continue
            blank = 0
            ss = segs(ln)
            # konec tabulky: dlouhý souvislý řádek textu (odstavec) nebo moc úseků
            if (len(ss) == 1 and len(ss[0][2]) > 60) or len(ss) > len(cols) or any(len(x[2]) > 60 for x in ss): break
            # nový řádek tabulky (po prázdném řádku) má aspoň dvě buňky – samotný úsek je už nadpis nebo text pod tabulkou
            if cur is None and rows and len(ss) == 1: break
            if cur is None: cur = [''] * len(cols)
            for a, b, t in ss:
                k = col_of(a, b)
                cur[k] = (cur[k][:-1] + t) if cur[k].endswith('-') and t[:1].islower() else (cur[k] + ' ' + t).strip()   # „pull-“ + „upem“ → „pullupem“
            j += 1
        if cur is not None: rows.append(cur)
        rows = [r for r in rows if any(r)]
        full = [r for r in rows if sum(1 for c in r if c) >= 2]
        outline = sum(1 for r in rows if re.fullmatch(r'\d{1,2}|[a-z]\)', r[0] or '')) >= len(rows) / 2   # osnova „01 …“ / „a) …“ není tabulka
        if len(rows) >= 3 and len(full) >= len(rows) * .7 and len(cols) >= 2 and not outline:
            out.append(rows); i = j
        else:
            i += 1
    return out

def norm(s): return re.sub(r'\s+', ' ', s).strip()
def key(s): return re.sub(r'[^0-9a-záčďéěíňóřšťúůýž]+', '', s.lower())   # volné porovnání: jen písmena a číslice (dělení slov a symboly se v PDF liší)

def place(raw_lines, rows):
    """Najde v raw řádcích úsek s buňkami tabulky (řádek po řádku) a vrátí (od, do, řádky tabulky s textem z raw).
    Rozložení (-layout) dává jen strukturu – jeho text může mít rozbité ligatury (fi → „(“), proto se text buněk bere z raw."""
    from difflib import SequenceMatcher
    pos_rc = [(ri, ci) for ri, r in enumerate(rows) for ci, c in enumerate(r) if c]
    cells = [key(rows[ri][ci]) for ri, ci in pos_rc]
    for st in range(len(raw_lines)):
        if SequenceMatcher(None, key(raw_lines[st]), cells[0][:len(key(raw_lines[st])) + 2]).ratio() < .8: continue
        pos, texts = st, []
        for ck in cells:
            while pos < len(raw_lines) and not key(raw_lines[pos]) and '\f' not in raw_lines[pos]: pos += 1   # prázdné řádky mezi buňkami
            best, acc, used, p = None, '', [], pos
            while p < len(raw_lines) and '\f' not in raw_lines[p] and len(acc) <= len(ck) * 1.3 + 4:
                k = key(raw_lines[p])
                if not k: break
                acc += k; used.append(p); p += 1
                r = SequenceMatcher(None, acc, ck).ratio()
                if r >= (.66 if len(ck) < 10 else .8) and (best is None or r > best[0]): best = (r, p, list(used))
                if acc == ck: break
            if not best: break
            pos = best[1]; texts.append(' '.join(norm(raw_lines[i]) for i in best[2]))
        if len(texts) == len(cells):
            out = [[''] * len(r) for r in rows]
            for (ri, ci), t in zip(pos_rc, texts): out[ri][ci] = t
            return st, pos, out
    return None

def md(rows):
    esc = lambda c: c.replace('|', '/')
    return ['| ' + ' | '.join(esc(c) for c in r) + ' |' for r in rows]

def main():
    base, mat = sys.argv[1], sys.argv[2]; dry = '--dry' in sys.argv
    total = placed = 0
    for n in range(1, 21):
        pdf = os.path.join(mat, '%02d.pdf' % n); rf = os.path.join(base, 'raw', '%d.txt' % n)
        if not (os.path.exists(pdf) and os.path.exists(rf)): continue
        raw = open(rf, encoding='utf-8').read(); lines = raw.split('\n'); changed = False
        for pi, ptxt in enumerate(pages(pdf)):
            for rows in tables_on_page(ptxt):
                total += 1
                if pi == 0 and any(re.match(r'\d{2}\b', r[0] or '') for r in rows): continue   # osnova na titulní straně („03 NCQ…“, „01–04 ZÁKLADY“)
                if any(l.startswith('| ' + norm(rows[0][0])) for l in lines): continue
                span = place(lines, rows)
                if not span:
                    if dry: print('  U%d str.%d: tabulka %d×%d v raw nenalezena: %s' % (n, pi + 1, len(rows), len(rows[0]), ' | '.join(rows[0])[:80]))
                    continue
                placed += 1; a, b, rows = span
                if dry: print('U%d str.%d: %d×%d  %s' % (n, pi + 1, len(rows), len(rows[0]), ' | '.join(rows[0])[:90]))
                lines[a:b] = md(rows); changed = True
        if changed and not dry: open(rf, 'w', encoding='utf-8').write('\n'.join(lines))
    print('tabulek nalezeno', total, 'umístěno', placed)

if __name__ == '__main__':
    main()
