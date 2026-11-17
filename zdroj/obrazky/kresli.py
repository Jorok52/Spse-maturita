"""Nakreslená schémata k otázkám, které v PDF mají málo obrázků (U11, U13, U15, U17).
Fakta jsou jen z podkladů (zdroj/raw/NN.txt). Spuštění: python3 zdroj/obrazky/kresli.py
Vytvoří SVG soubory a obrazky.json, které build přidá do galerie a do kvízu „Poznej obrázek“."""
import json, math, os
from html import escape

D = os.path.dirname(os.path.abspath(__file__))
BG, PANEL, LINE = '#0f1715', '#17211e', '#2c3a35'
GOLD, GOLD2, SILK, DIM = '#d0a24b', '#f1c873', '#efebdd', '#a7b9ae'
GREEN, RED, CYAN, VIOLET, ORANGE = '#61e38c', '#ff7a6b', '#7fd3ff', '#c39bff', '#ffb340'
FONT = "IBM Plex Sans, Segoe UI, DejaVu Sans, Arial, sans-serif"
MONO = "IBM Plex Mono, Consolas, DejaVu Sans Mono, monospace"

def T(x, y, s, size=17, fill=SILK, w=400, a='start', mono=False, op=None):
    o = f' opacity="{op}"' if op else ''
    return f'<text x="{x:.1f}" y="{y:.1f}" font-size="{size}" fill="{fill}" font-weight="{w}" text-anchor="{a}"{" font-family=" + chr(34) + MONO + chr(34) if mono else ""}{o}>{escape(str(s))}</text>'
def R(x, y, w, h, fill, stroke=None, rx=8, sw=1.5, op=None, dash=None):
    st = f' stroke="{stroke}" stroke-width="{sw}"' if stroke else ''
    o = f' opacity="{op}"' if op else ''
    d = f' stroke-dasharray="{dash}"' if dash else ''
    return f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" rx="{rx}" fill="{fill}"{st}{o}{d}/>'
def L(x1, y1, x2, y2, c=DIM, sw=1.5, dash=None, arrow=False):
    d = f' stroke-dasharray="{dash}"' if dash else ''
    m = ' marker-end="url(#ar)"' if arrow else ''
    return f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="{c}" stroke-width="{sw}"{d}{m}/>'
def P(d, c=DIM, sw=1.5, fill='none', arrow=False, dash=None):
    m = ' marker-end="url(#ar)"' if arrow else ''
    ds = f' stroke-dasharray="{dash}"' if dash else ''
    return f'<path d="{d}" stroke="{c}" stroke-width="{sw}" fill="{fill}"{m}{ds}/>'
def brace(x1, x2, y, label, c=DIM, size=15):
    m = (x1 + x2) / 2
    return P(f'M{x1} {y} v8 H{m - 8} l8 8 l8 -8 H{x2} v-8', c, 1.5) + T(m, y + 34, label, size, c, 600, 'middle')
def svg(w, h, title, sub, body):
    head = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" font-family="{FONT}">'
            f'<title>{escape(title)}</title><defs><marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">'
            f'<path d="M0 0L10 5L0 10z" fill="{GOLD2}"/></marker></defs>'
            f'<rect width="{w}" height="{h}" rx="18" fill="{BG}"/><rect x="1" y="1" width="{w - 2}" height="{h - 2}" rx="17" fill="none" stroke="{GOLD}" stroke-opacity=".45"/>')
    head += T(36, 48, title, 26, SILK, 700) + (T(36, 74, sub, 15, DIM) if sub else '')
    return head + body + '</svg>'

OUT = {}
def save(n, name, cap, s):
    open(os.path.join(D, name), 'w', encoding='utf-8').write(s)
    OUT.setdefault(str(n), []).append({'f': name, 'cap': cap})

# ---------------------------------------------------------------- U15 · logický disk FAT
def fat_layout():
    W, H = 960, 430
    b = ''
    x, y, h = 36, 120, 104
    seg = [('Boot Record', 'zaváděcí záznam', 134, GOLD), ('FAT 1', 'alokační tabulka', 128, CYAN), ('FAT 2', 'záloha FAT 1', 128, CYAN),
           ('Root Directory', 'hlavní adresář', 152, VIOLET)]
    for name, sub, w, c in seg:
        b += R(x, y, w - 6, h, PANEL, c, 8, 2) + T(x + (w - 6) / 2, y + 44, name, 16, c, 700, 'middle') + T(x + (w - 6) / 2, y + 70, sub, 13.5, DIM, 400, 'middle')
        x += w
    dx = x; dw = 924 - x
    b += R(dx, y, dw, h, PANEL, GREEN, 8, 2) + T(dx + dw / 2, y + 28, 'Datová oblast', 18, GREEN, 700, 'middle')
    cw = (dw - 20) / 8
    for i in range(8):
        cx = dx + 10 + i * cw
        b += R(cx + 2, y + 44, cw - 4, 46, '#123326', GREEN, 5, 1) + T(cx + cw / 2, y + 74, i + 2 if i < 7 else '…', 16, SILK, 600, 'middle', True)
    b += brace(36, dx - 6, y + h + 10, 'Organizační oblast (system area)', GOLD2)
    b += brace(dx, 924, y + h + 10, 'Datová oblast – clustery', GREEN)
    notes = [(36, 'Boot Record: typ souborového systému, rozložení disku, počet sektorů v clusteru.'),
             (36, 'FAT 1 a FAT 2: které clustery jsou volné, obsazené, vadné a jak na sebe navazují; FAT 2 je záloha.'),
             (36, 'Root Directory (FAT12/16): hned za FAT 2, pevná velikost. U FAT32 je přesunutý do datové oblasti.'),
             (36, 'Clustery se číslují od 2 – čísla 0 a 1 jsou rezervovaná. Strukturu vytvoří logické formátování (format).')]
    yy = 300
    for nx, s in notes:
        b += f'<circle cx="{nx + 6}" cy="{yy - 5}" r="3.5" fill="{GOLD}"/>' + T(nx + 18, yy, s, 15.5, SILK)
        yy += 30
    save(15, 'u15-fat-disk.svg', 'Logický disk FAT – boot record, FAT 1, FAT 2, root, data',
         svg(W, H, 'Logický disk se systémem FAT (FAT12 / FAT16)', 'Organizační oblast a datová oblast – tak ji vytvoří logické formátování', b))

# ---------------------------------------------------------------- U15 · řetězec clusterů
def fat_chain():
    W, H = 960, 600
    b = ''
    # položka v adresáři
    b += R(36, 110, 250, 196, PANEL, VIOLET, 10, 2) + T(56, 140, 'Položka v adresáři', 17, VIOLET, 700)
    rows = [('Název', 'ZPRAVA.TXT'), ('Velikost', '9 800 B'), ('Atributy', 'A (archive)'), ('1. cluster', '5')]
    for i, (k, v) in enumerate(rows):
        yy = 176 + i * 32
        b += T(56, yy, k, 15, DIM) + T(266, yy, v, 16, GOLD2 if k == '1. cluster' else SILK, 600, 'end', True)
    b += R(48, 252, 226, 30, 'none', GOLD2, 6, 1.5)
    # tabulka FAT
    fx, fy, rh = 340, 104, 38
    b += T(fx, fy - 8, 'FAT tabulka (FAT16)', 17, CYAN, 700)
    vals = [(2, '0003h', 'další: 3'), (3, 'FFFFh', 'EOF'), (4, '0000h', 'volný'), (5, '0006h', 'další: 6'), (6, '0009h', 'další: 9'),
            (7, 'FFF7h', 'vadný'), (8, '0000h', 'volný'), (9, 'FFFFh', 'EOF – konec'), (10, '0000h', 'volný')]
    chain = {5, 6, 9}
    for i, (c, v, m) in enumerate(vals):
        yy = fy + i * rh
        col = GOLD2 if c in chain else (RED if v == 'FFF7h' else (DIM if v == '0000h' else SILK))
        b += R(fx, yy, 210, rh - 4, '#1c2a26' if c in chain else PANEL, GOLD2 if c in chain else LINE, 6, 1.5 if c in chain else 1)
        b += T(fx + 12, yy + 23, f'cluster {c}', 14.5, DIM, 400, 'start', True) + T(fx + 124, yy + 23, v, 16, col, 600, 'start', True)
        b += T(fx + 262, yy + 23, m, 14, col, 400)
    # šipky řetězce
    def ry(c): return fy + (c - 2) * rh + 17
    b += P(f'M286 266 C330 266 340 {ry(5)} {fx - 4} {ry(5)}', GOLD2, 2, arrow=True)
    b += P(f'M{fx + 210} {ry(5)} C{fx + 236} {ry(5)} {fx + 236} {ry(6)} {fx + 214} {ry(6)}', GOLD2, 1.8, arrow=True)
    b += P(f'M{fx + 210} {ry(6)} C{fx + 252} {ry(6)} {fx + 252} {ry(9)} {fx + 214} {ry(9)}', GOLD2, 1.8, arrow=True)
    # datová oblast
    dx, dy = 36, 360
    b += T(dx, dy - 10, 'Datová oblast', 17, GREEN, 700)
    for i, c in enumerate(range(2, 11)):
        cx = dx + (i % 3) * 102; yy = dy + (i // 3) * 62
        v = vals[i][1]
        fill, st, lab = ('#3a2f12', GOLD2, 'ZPRAVA') if c in chain else (('#3a1814', RED, 'vadný') if v == 'FFF7h' else (('#1a2421', LINE, 'volný') if v == '0000h' else ('#12302a', GREEN, 'jiný soubor')))
        b += R(cx, yy, 94, 52, fill, st, 6, 1.5) + T(cx + 10, yy + 21, c, 15, SILK, 700, 'start', True) + T(cx + 47, yy + 42, lab, 12.5, st if c not in chain else GOLD2, 600, 'middle')
    # legenda
    lx, ly = 718, 120
    b += R(lx - 14, ly - 28, 220, 214, PANEL, LINE, 10, 1) + T(lx, ly, 'Hodnoty ve FAT', 16, GOLD, 700)
    leg = [('0000h', 'cluster je volný', DIM), ('XXXXh', 'číslo dalšího clusteru', SILK), ('FFF7h', 'vadný cluster', RED), ('FFF8h–FFFFh', 'EOF – konec souboru', GOLD2)]
    for i, (k, v, c) in enumerate(leg):
        b += T(lx, ly + 36 + i * 38, k, 15.5, c, 600, 'start', True) + T(lx, ly + 54 + i * 38, v, 13.5, DIM)
    b += T(704, 380, 'Soubor ZPRAVA.TXT leží', 16, SILK, 600) + T(704, 404, 'v clusterech 5 → 6 → 9.', 16, GOLD2, 600)
    b += T(704, 438, 'Každý cluster má ve FAT', 15, DIM) + T(704, 460, 'právě jeden záznam; řetězec', 15, DIM) + T(704, 482, 'určuje pořadí částí souboru', 15, DIM) + T(704, 504, '– tady je fragmentovaný.', 15, DIM)
    save(15, 'u15-fat-retezec.svg', 'Řetězec clusterů ve FAT (5 → 6 → 9, EOF)',
         svg(W, H, 'Řetězec clusterů ve FAT', 'Položka v adresáři ukáže 1. cluster, FAT tabulka pak cestu k dalším', b))

# ---------------------------------------------------------------- U15 · NTFS
def ntfs():
    W, H = 960, 700
    b = ''
    x, y, h = 36, 112, 92
    seg = [('Boot', '$BOOT', 84, GOLD), ('MFT', 'tabulka souborů', 150, CYAN), ('rezerva MFT', '≈ 12 % disku', 150, CYAN),
           ('uživatelská data', '', 190, GREEN), ('$MFTMirr', 'střed disku', 110, VIOLET), ('uživatelská data', '', 0, GREEN)]
    for name, sub, w, c in seg:
        if not w: w = 924 - x
        dash = '6 4' if name == 'rezerva MFT' else None
        b += R(x, y, w - 6, h, PANEL if name != 'rezerva MFT' else BG, c, 8, 2, dash=dash)
        b += T(x + (w - 6) / 2, y + 40 + (0 if sub else 8), name, 16.5, c, 700, 'middle')
        if sub: b += T(x + (w - 6) / 2, y + 64, sub, 13.5, DIM, 400, 'middle')
        x += w
    b += T(36, 236, 'MFT leží ihned za boot sektorem. Boot sektor ($BOOT) obsahuje přesné umístění MFT i její kopie $MFTMirr.', 15, SILK)
    b += T(36, 260, 'Rezerva cca 12 % zůstává volná, aby MFT mohla růst bez fragmentace. Kopie prvních 16 záznamů je uprostřed disku.', 15, SILK)
    # MFT záznamy
    b += T(36, 304, 'MFT – Master File Table: každý soubor i složka = 1 záznam pevné délky', 18, CYAN, 700)
    b += T(36, 328, 'Prvních 16 záznamů = metasoubory: skryté systémové soubory, začínají $. Záznam 0 popisuje samotnou MFT.', 14.5, DIM)
    meta = [('$MFT', 'hlavní databáze souborů'), ('$MFTMirr', 'kopie prvních 16 záznamů'), ('$LogFile', 'transakční log, obnova po havárii'),
            ('$Volume', 'sériové číslo a čas vytvoření'), ('$AttrDef', 'definice atributů'), ('$Bitmap', 'obsazení clusterů 1 / 0'),
            ('.', 'kořenový adresář'), ('$Boot', 'boot sektor'), ('$BadClus', 'seznam vadných clusterů'),
            ('$Quota', 'kvóty uživatelů'), ('$UpCase', 'převod malých → velkých písmen')]
    for i, (k, v) in enumerate(meta):
        cx = 36 + (i % 2) * 450; yy = 352 + (i // 2) * 52
        b += R(cx, yy, 438, 44, PANEL, LINE, 7, 1) + T(cx + 14, yy + 28, k, 16, GOLD2, 700, 'start', True) + T(cx + 128, yy + 28, v, 14.5, SILK)
    b += R(36 + 450, 352 + 5 * 52, 438, 44, BG, GREEN, 7, 1.5, dash='5 4') + T(36 + 450 + 219, 352 + 5 * 52 + 28, 'další záznamy: soubory a složky uživatele', 14.5, GREEN, 600, 'middle')
    save(15, 'u15-ntfs.svg', 'NTFS – MFT, rezerva 12 %, $MFTMirr, metasoubory',
         svg(W, H, 'Vnitřní struktura svazku NTFS', 'NTFS je databázová struktura: MFT + metasoubory', b))

# ---------------------------------------------------------------- U11 · IP adresa a maska
def ip_mask():
    W, H = 960, 560
    b = ''
    ip = [192, 168, 1, 10]; mask = [255, 255, 255, 0]
    ox, oy, ow = 120, 132, 196
    b += T(36, oy + 34, 'IP', 17, DIM, 700) + T(36, oy + 124, 'maska', 17, DIM, 700)
    for i in range(4):
        x = ox + i * (ow + 10); net = i < 3
        c = CYAN if net else GREEN
        b += R(x, oy, ow, 58, PANEL, c, 8, 2) + T(x + ow / 2, oy + 27, ip[i], 22, SILK, 700, 'middle', True) + T(x + ow / 2, oy + 48, format(ip[i], '08b'), 16, c, 600, 'middle', True)
        b += R(x, oy + 90, ow, 58, PANEL, c, 8, 1.5) + T(x + ow / 2, oy + 117, mask[i], 22, SILK, 700, 'middle', True) + T(x + ow / 2, oy + 138, format(mask[i], '08b'), 16, c, 600, 'middle', True)
        if i < 3: b += T(x + ow + 5, oy + 34, '.', 22, DIM, 700, 'middle')
    b += T(ox, oy - 16, '192.168.1.10/24  →  prefix /24 = prvních 24 bitů je síťová část', 17, GOLD2, 600)
    b += brace(ox, ox + 3 * (ow + 10) - 10, oy + 160, 'síťová část (NET ID) – 24 jedniček v masce', CYAN)
    b += brace(ox + 3 * (ow + 10), ox + 4 * ow + 30, oy + 160, 'část hostitele – 8 nul', GREEN)
    rows = [('Adresa sítě', 'IP AND maska', '192.168.1.0', CYAN), ('Broadcast', 'část hostitele samé jedničky', '192.168.1.255', ORANGE),
            ('Počet hostitelů', '2⁸ − 2 (bez adresy sítě a broadcastu)', '254', GREEN), ('Wildcard maska', 'bitová negace masky', '0.0.0.255', VIOLET)]
    for i, (k, how, v, c) in enumerate(rows):
        yy = 392 + i * 40
        b += R(36, yy - 26, 888, 34, PANEL, LINE, 6, 1) + T(52, yy - 3, k, 16, c, 700) + T(250, yy - 3, how, 15, DIM) + T(908, yy - 3, v, 17, SILK, 700, 'end', True)
    save(11, 'u11-ip-maska.svg', 'IPv4 adresa a maska – síť, broadcast, hosté',
         svg(W, H, 'IPv4 adresa, maska a prefix', 'Maska je souvislý blok jedniček (síť) následovaný nulami (hostitelé)', b))

# ---------------------------------------------------------------- U11 · třídy
def ip_classes():
    W, H = 960, 560
    b = ''
    x0, x1, y = 60, 900, 120
    cls = [('A', 0, 127, '0', '255.0.0.0 · /8', '16 777 214', CYAN), ('B', 128, 191, '10', '255.255.0.0 · /16', '65 534', GREEN),
           ('C', 192, 223, '110', '255.255.255.0 · /24', '254', GOLD2), ('D', 224, 239, '1110', 'multicast', '–', VIOLET), ('E', 240, 255, '1111', 'experimentální', '–', RED)]
    sc = (x1 - x0) / 256
    for k, a, z, bits, m, hosts, c in cls:
        xa = x0 + a * sc; xz = x0 + (z + 1) * sc
        b += R(xa + 1, y, xz - xa - 2, 64, PANEL, c, 6, 2) + T((xa + xz) / 2, y + 40, k, 26 if z - a > 20 else 20, c, 700, 'middle')
    for v in (0, 128, 192, 224, 240, 255):
        xx = x0 + (v + (1 if v == 255 else 0)) * sc
        b += L(xx, y + 68, xx, y + 80, DIM, 1.2) + T(xx, y + 98, v, 14, DIM, 400, 'middle', True)
    b += T(x0, y - 14, 'první oktet adresy (0–255)', 15, DIM)
    # tabulka
    hx, hy = 36, 270
    cols = [(hx + 14, 'Třída'), (hx + 96, 'první bity'), (hx + 216, 'rozsah'), (hx + 520, 'výchozí maska / určení'), (hx + 760, 'hostů v síti')]
    b += R(hx, hy - 30, 888, 40, '#1d2926', LINE, 6, 1)
    for cx, t in cols: b += T(cx, hy - 4, t, 14.5, GOLD, 700)
    for i, (k, a, z, bits, m, hosts, c) in enumerate(cls):
        yy = hy + 40 + i * 46
        b += R(hx, yy - 28, 888, 40, PANEL, LINE, 6, 1)
        b += T(hx + 26, yy - 2, k, 18, c, 700, 'middle') + T(hx + 96, yy - 2, bits + 'x…', 16, SILK, 600, 'start', True)
        b += T(hx + 216, yy - 2, f'{a}.0.0.0 – {z}.255.255.255', 14, SILK, 400, 'start', True) + T(hx + 520, yy - 2, m, 15, SILK) + T(hx + 760, yy - 2, hosts, 15, SILK, 600, 'start', True)
    b += T(36, 532, 'Počet hostitelů = 2^(bity hostitele) − 2. Adresa 255.255.255.255 je broadcast pro celou lokální síť.', 14.5, DIM)
    save(11, 'u11-tridy.svg', 'Třídy IPv4 adres A–E podle prvního oktetu',
         svg(W, H, 'Třídní adresování IPv4 (A–E)', 'Třídu určují první bity prvního oktetu', b))

# ---------------------------------------------------------------- U11 · směrovač
def router():
    W, H = 960, 640
    b = ''
    # LAN 1
    b += R(36, 112, 210, 150, PANEL, CYAN, 10, 2) + T(141, 140, 'LAN 192.168.1.0/24', 15, CYAN, 700, 'middle')
    for i in range(2):
        px = 66 + i * 100
        b += R(px, 160, 70, 46, '#1d2926', LINE, 5, 1) + R(px + 26, 206, 18, 8, LINE, None, 2) + T(px + 35, 189, 'PC', 14, SILK, 600, 'middle')
    b += T(141, 240, 'brána: 192.168.1.1', 13.5, DIM, 400, 'middle', True)
    # router R1
    rx, ry = 380, 140
    b += R(rx, ry, 190, 96, '#1f2a26', GOLD, 12, 2.5) + T(rx + 95, ry + 40, 'R1', 24, GOLD2, 700, 'middle') + T(rx + 95, ry + 66, 'směrovač', 14, DIM, 400, 'middle')
    b += L(246, 186, rx, 186, CYAN, 3) + T(rx - 8, 176, 'G0/0', 13, CYAN, 600, 'end', True) + T(rx - 8, 206, '192.168.1.1', 12.5, DIM, 400, 'end', True)
    # WAN + R2 + síť 172.16.3.0
    b += L(rx + 190, 186, 720, 186, ORANGE, 3, '10 6') + T(rx + 198, 176, 'S0/0/0', 13, ORANGE, 600, 'start', True) + T(645, 210, 'WAN', 13, ORANGE, 600, 'middle')
    b += R(720, 150, 90, 72, '#1f2a26', LINE, 10, 2) + T(765, 193, 'R2', 18, SILK, 700, 'middle')
    b += L(810, 186, 850, 186, GREEN, 3) + R(850, 112, 76, 150, PANEL, GREEN, 10, 2)
    b += T(888, 172, '172.16.', 13, GREEN, 600, 'middle', True) + T(888, 190, '3.0/24', 13, GREEN, 600, 'middle', True)
    # směrovací tabulka
    tx, ty = 36, 318
    b += T(tx, ty - 14, 'Směrovací tabulka R1', 18, GOLD, 700)
    head = [('Cílová síť', tx + 16), ('Výstupní rozhraní', tx + 300), ('Metrika', tx + 540), ('Jak se tam dostala', tx + 650)]
    b += R(tx, ty, 888, 38, '#1d2926', LINE, 6, 1)
    for h, cx in head: b += T(cx, ty + 25, h, 14.5, GOLD, 700)
    rows = [('192.168.1.0 /24', 'G0/0', '0', 'přímo připojená'), ('172.16.3.0 /24', 'S0/0/0', '1', 'statická: ip route …')]
    for i, r in enumerate(rows):
        yy = ty + 46 + i * 44
        b += R(tx, yy, 888, 38, PANEL, LINE, 6, 1)
        for (h, cx), v in zip(head, r): b += T(cx, yy + 25, v, 15, SILK, 500, 'start', True)
    b += T(36, 476, 'ip route 172.16.3.0 255.255.255.0 s0/0/0', 16, GOLD2, 600, 'start', True) + T(36, 498, '→ statická trasa přes výstupní rozhraní s0/0/0', 14.5, DIM)
    steps = ['1. přečte cílovou IP adresu paketu', '2. zjistí, jestli není jeho vlastní', '3. nahlédne do směrovací tabulky', '4. odešle paket rozhraním k cílové síti']
    for i, s in enumerate(steps): b += T(520, 476 + i * 26, s, 14.5, SILK)
    b += T(36, 600, 'Metrika = „vzdálenost“ k cílové síti – nižší = lepší cesta. Výchozí bráně posílá PC pakety pro cíle mimo svou podsíť.', 14, DIM)
    save(11, 'u11-smerovac.svg', 'Směrovač R1 a jeho směrovací tabulka',
         svg(W, H, 'Směrovač a směrovací tabulka', 'Směrovač má rozhraní v různých sítích a podle tabulky předává pakety dál', b))

# ---------------------------------------------------------------- U13 · geometrie
def hdd_geometry():
    W, H = 960, 600
    b = ''
    cx, cy = 220, 322
    radii = [172, 152, 132, 112, 92, 72]
    b += f'<circle cx="{cx}" cy="{cy}" r="182" fill="#1a2421" stroke="{LINE}" stroke-width="2"/>'
    for i, r in enumerate(radii):
        b += f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="{CYAN if i == 0 else LINE}" stroke-width="{2.5 if i == 0 else 1.2}"/>'
    # sektor na stopě 2 (výseč)
    r1, r2, a1, a2 = 122, 142, math.radians(-62), math.radians(-38)
    p = lambda r, a: (cx + r * math.cos(a), cy + r * math.sin(a))
    (x1, y1), (x2, y2), (x3, y3), (x4, y4) = p(r2, a1), p(r2, a2), p(r1, a2), p(r1, a1)
    b += P(f'M{x1:.1f} {y1:.1f} A{r2} {r2} 0 0 1 {x2:.1f} {y2:.1f} L{x3:.1f} {y3:.1f} A{r1} {r1} 0 0 0 {x4:.1f} {y4:.1f} Z', GOLD2, 2, fill='rgba(241,200,115,.45)')
    b += f'<circle cx="{cx}" cy="{cy}" r="30" fill="#2a3532" stroke="{DIM}"/><circle cx="{cx}" cy="{cy}" r="7" fill="{DIM}"/>'
    # rameno s hlavičkou
    b += P(f'M{cx + 226} {cy + 116} L{cx + 140} {cy - 36}', GOLD, 6) + f'<circle cx="{cx + 226}" cy="{cy + 116}" r="14" fill="#2a3532" stroke="{GOLD}"/>' + R(cx + 128, cy - 50, 22, 16, GOLD2, None, 3)
    b += T(cx, 124, 'pohled shora na plotnu', 15, DIM, 400, 'middle')
    b += P(f'M{cx + 150} {cy - 96} L{cx + 214} {cy - 150}', CYAN, 1.2) + T(cx + 220, cy - 152, 'stopa 0 (u obvodu)', 14.5, CYAN, 600)
    b += P(f'M{x2 + 4:.1f} {y2:.1f} L{cx + 214} {cy - 100}', GOLD2, 1.2) + T(cx + 220, cy - 96, 'sektor = výseč', 14.5, GOLD2, 600) + T(cx + 220, cy - 77, 'stopy', 14.5, GOLD2, 600)
    b += T(cx + 252, cy + 122, 'hlavička', 14.5, GOLD, 600) + T(cx + 252, cy + 141, 'na rameni', 14.5, GOLD, 600)
    # boční pohled – cylindr
    sx, sy = 618, 160
    for i in range(3):
        yy = sy + 40 + i * 100
        b += f'<ellipse cx="{sx + 150}" cy="{yy}" rx="150" ry="26" fill="#1a2421" stroke="{LINE}" stroke-width="1.6"/>'
        b += f'<ellipse cx="{sx + 150}" cy="{yy}" rx="96" ry="16" fill="none" stroke="{VIOLET}" stroke-width="2.4"/>'
        for side, dy in (('H' + str(2 * i), -14), ('H' + str(2 * i + 1), 14)):
            b += R(sx + 236, yy + dy - 5, 20, 10, GOLD2, None, 2) + T(sx + 272, yy + dy + 5, side, 13, GOLD2, 600, 'start', True)
    b += L(sx + 150, sy, sx + 150, sy + 260, DIM, 4)
    b += P(f'M{sx + 54} {sy + 40} V{sy + 240} M{sx + 246} {sy + 40} V{sy + 240}', VIOLET, 1.5, dash='6 5')
    b += T(sx + 150, sy - 22, 'pohled z boku: 3 plotny, 6 hlaviček', 15, DIM, 400, 'middle')
    b += T(sx + 150, sy + 300, 'cylindr = stopy se stejným průměrem', 15, VIOLET, 700, 'middle') + T(sx + 150, sy + 322, 'na všech plotnách nad sebou', 15, VIOLET, 700, 'middle')
    b += T(36, 548, 'Stopa = soustředná kružnice, čísluje se od obvodu (0) ke středu. Sektor = nejmenší adresovatelná jednotka, čísluje se od 1.', 14.5, SILK)
    b += T(36, 572, 'CHS: C = cylindr, H = hlava, S = sektor.  LBA: lineární číslo bloku od 0 – CHS 0-0-1 = LBA 0.', 14.5, DIM)
    save(13, 'u13-geometrie.svg', 'Geometrie HDD – stopa, sektor, cylindr, hlavy',
         svg(W, H, 'Geometrie pevného disku', 'Stopa, sektor a cylindr – podle nich se adresuje CHS', b))

# ---------------------------------------------------------------- U13 · sektor, ZBR, přístupová doba
def hdd_sector():
    W, H = 960, 600
    b = ''
    # struktura sektoru
    x, y = 36, 118
    parts = [('Identifikační část', 'poloha: C / H / S', 230, CYAN), ('Datová část', '512 B (Advanced Format 4096 B)', 470, GREEN), ('CRC', 'kontrola integrity', 176, ORANGE)]
    for name, sub, w, c in parts:
        b += R(x, y, w - 6, 70, PANEL, c, 8, 2) + T(x + (w - 6) / 2, y + 31, name, 17, c, 700, 'middle') + T(x + (w - 6) / 2, y + 54, sub, 14, DIM, 400, 'middle')
        x += w
    b += T(36, 108, 'Struktura sektoru', 16, GOLD, 700)
    # ZBR
    cx, cy = 200, 400
    zones = [(150, 118, 16, CYAN), (118, 86, 12, GREEN), (86, 54, 8, VIOLET)]
    for ro, ri, n, c in zones:
        for k in range(n):
            a1 = 2 * math.pi * k / n; a2 = 2 * math.pi * (k + 1) / n
            pts = [(cx + ro * math.cos(a1), cy + ro * math.sin(a1)), (cx + ro * math.cos(a2), cy + ro * math.sin(a2)), (cx + ri * math.cos(a2), cy + ri * math.sin(a2)), (cx + ri * math.cos(a1), cy + ri * math.sin(a1))]
            b += P(f'M{pts[0][0]:.1f} {pts[0][1]:.1f} A{ro} {ro} 0 0 1 {pts[1][0]:.1f} {pts[1][1]:.1f} L{pts[2][0]:.1f} {pts[2][1]:.1f} A{ri} {ri} 0 0 0 {pts[3][0]:.1f} {pts[3][1]:.1f} Z', BG, 1.6, fill=c + '33')
    b += f'<circle cx="{cx}" cy="{cy}" r="22" fill="#2a3532" stroke="{DIM}"/>'
    b += T(36, 236, 'ZBR – Zone Bit Recording', 16, GOLD, 700)
    b += T(380, 300, 'Disk je rozdělený do zón.', 15.5, SILK, 600)
    leg = [('vnější zóna: 16 sektorů na stopu', CYAN), ('střední zóna: 12 sektorů', GREEN), ('vnitřní zóna: 8 sektorů', VIOLET)]
    for i, (s, c) in enumerate(leg): b += R(380, 318 + i * 30, 16, 16, c + '55', c, 3, 1.5) + T(406, 331 + i * 30, s, 14.5, c, 600)
    b += T(380, 430, 'Na delších vnějších stopách je víc sektorů,', 14.5, DIM) + T(380, 450, 'velikost sektoru je všude stejná (např. 512 B).', 14.5, DIM)
    # přístupová doba
    b += R(380, 478, 544, 108, PANEL, LINE, 10, 1) + T(398, 504, 'Přístupová doba ≈ 8–15 ms (průměr HDD)', 16, GOLD2, 700)
    b += T(398, 530, 'vystavovací doba (seek) – hlavička přejede nad stopu', 14, SILK) + T(398, 551, '+ rotační latence – sektor dojede pod hlavičku (dle RPM)', 14, SILK) + T(398, 572, '+ přepnutí hlavičky – řádově nanosekundy', 14, DIM)
    b += T(36, 584, 'Údaje o počtu sektorů v zónách jsou jen ilustrační.', 12.5, DIM, op='.8')
    save(13, 'u13-sektor-zbr.svg', 'Struktura sektoru, ZBR a přístupová doba HDD',
         svg(W, H, 'Sektor, zónový záznam (ZBR) a přístupová doba', 'Co obsahuje sektor a proč mají vnější stopy víc sektorů', b))

# ---------------------------------------------------------------- U17 · rozdělení pamětí
def mem_tree():
    W, H = 960, 600
    b = ''
    def node(x, y, w, h, title, lines, c):
        s = R(x, y, w, h, PANEL, c, 9, 2) + T(x + 14, y + 25, title, 16.5, c, 700)
        for i, l in enumerate(lines): s += T(x + 14, y + 47 + i * 19, l, 13.5, SILK if i == 0 else DIM)
        return s
    b += R(390, 96, 180, 44, '#1d2926', GOLD, 9, 2) + T(480, 124, 'Paměti PC', 18, GOLD2, 700, 'middle')
    b += P('M480 140 V160 H230 V180 M480 160 H742 V180', GOLD, 1.8)
    b += node(70, 180, 320, 64, 'Volatilní (RWM)', ['po odpojení napájení ztrácí data'], CYAN)
    b += node(560, 180, 364, 64, 'Nevolatilní (ROM)', ['data zůstanou i bez napájení'], ORANGE)
    # volatilní větev
    b += P('M230 244 V262', CYAN, 1.8)
    b += node(70, 262, 320, 44, 'RAM', [], CYAN)
    b += T(170, 289, 'náhodný přístup, čtení i zápis', 13.5, DIM)
    b += P('M120 306 V326 M340 306 V326', CYAN, 1.6) + P('M120 316 H340', CYAN, 1.6)
    b += node(36, 326, 196, 120, 'SRAM', ['klopné obvody (flip-flop)', 'bez refreshe, rychlá', 'drahá, malá kapacita', '→ cache L1, L2, L3'], GREEN)
    b += node(242, 326, 196, 120, 'DRAM', ['tranzistor + kondenzátor', 'nutný refresh', 'levnější, větší kapacita', '→ operační paměť'], GREEN)
    b += P('M340 446 V466', GREEN, 1.6) + node(242, 466, 196, 64, 'SDRAM, DDR–DDR5', ['DDR: data na obou hranách'], GREEN)
    b += node(36, 466, 196, 64, 'NRAM', ['FIFO / LIFO buffery'], VIOLET)
    # nevolatilní větev
    roms = [('Mask ROM', 'z výroby pomocí masky'), ('PROM', 'jednorázově programátorem (OTP)'), ('EPROM', 'mazání UV zářením (celý obsah)'),
            ('EEPROM', 'mazání i přepis elektricky'), ('Flash', 'druh EEPROM → SSD, USB, BIOS')]
    b += P('M742 244 V262', ORANGE, 1.8)
    for i, (k, v) in enumerate(roms):
        yy = 262 + i * 56
        b += R(560, yy, 364, 48, PANEL, ORANGE, 8, 1.6) + T(574, yy + 30, k, 15, ORANGE, 700) + T(680, yy + 30, v, 13.5, SILK)
    b += T(36, 572, 'Volatilní: RAM, cache. Nevolatilní: ROM, EEPROM, Flash, SSD. BIOS je uložený v ROM (dnes Flash).', 14.5, DIM)
    save(17, 'u17-deleni.svg', 'Rozdělení pamětí – volatilní RAM a nevolatilní ROM',
         svg(W, H, 'Typy pamětí podle závislosti na napájení', 'Volatilní (RWM) a nevolatilní (ROM) paměti a jejich použití v PC', b))

# ---------------------------------------------------------------- U17 · hierarchie a cache
def mem_pyramid():
    W, H = 960, 600
    b = ''
    lv = [('Registry CPU', 'nejrychlejší', GOLD2), ('L1 cache', 'desítky kB · L1i + L1d', CYAN), ('L2 cache', 'stovky kB až jednotky MB', CYAN),
          ('L3 cache', 'až desítky MB', CYAN), ('RAM (DDR4)', '8–32 GB · cca 10–15 ns', GREEN), ('Disk (HDD / SSD)', 'největší · HDD až 10 ms', ORANGE)]
    top, cx, hh = 104, 330, 66
    for i, (k, v, c) in enumerate(lv):
        y = top + i * hh; w1 = 70 + i * 74; w2 = 70 + (i + 1) * 74
        b += P(f'M{cx - w1 / 2} {y} H{cx + w1 / 2} L{cx + w2 / 2} {y + hh - 6} H{cx - w2 / 2} Z', c, 1.8, fill=PANEL)
        b += T(cx, y + 28, k, 16 if i else 14, c, 700, 'middle') + T(cx, y + 48, v, 12.5 if i < 2 else 13.5, DIM, 400, 'middle')
    b += P(f'M{cx - 282} {top + 5 * hh + 40} V{top + 10}', GOLD2, 2, arrow=True) + T(cx - 298, top + 200, 'rychlejší, dražší, menší', 14, GOLD2, 600, 'middle').replace('<text', f'<text transform="rotate(-90 {cx - 298} {top + 200})"')
    b += P(f'M{cx + 282} {top + 10} V{top + 5 * hh + 40}', GREEN, 2, arrow=True) + T(cx + 300, top + 200, 'větší kapacita, levnější', 14, GREEN, 600, 'middle').replace('<text', f'<text transform="rotate(90 {cx + 300} {top + 200})"')
    # cache hit / miss
    fx, fy = 652, 120
    b += T(fx, fy - 12, 'Princip cache', 18, GOLD, 700)
    b += R(fx, fy, 100, 50, PANEL, GOLD2, 8, 2) + T(fx + 50, fy + 31, 'CPU', 17, GOLD2, 700, 'middle')
    b += R(fx + 168, fy, 100, 50, PANEL, CYAN, 8, 2) + T(fx + 218, fy + 31, 'cache', 17, CYAN, 700, 'middle')
    b += L(fx + 100, fy + 25, fx + 164, fy + 25, GOLD2, 2, arrow=True)
    b += R(fx + 168, fy + 170, 100, 50, PANEL, GREEN, 8, 2) + T(fx + 218, fy + 201, 'RAM', 17, GREEN, 700, 'middle')
    b += L(fx + 218, fy + 54, fx + 218, fy + 166, RED, 2, '6 4', arrow=True) + T(fx + 228, fy + 112, 'miss', 14, RED, 700)
    b += P(f'M{fx + 168} {fy + 196} C{fx + 110} {fy + 196} {fx + 92} {fy + 100} {fx + 164} {fy + 40}', GREEN, 1.6, arrow=True, dash='5 4')
    b += T(fx, fy + 252, 'cache hit: data už jsou v cache', 14.5, CYAN, 600) + T(fx, fy + 272, '→ načtou se rychle', 14, DIM)
    b += T(fx, fy + 302, 'cache miss: data se načtou z RAM', 14.5, RED, 600) + T(fx, fy + 322, 'a cache se aktualizuje', 14, DIM)
    b += T(fx, fy + 360, 'Cache (SRAM) vyrovnává rozdíl', 14.5, SILK) + T(fx, fy + 380, 'rychlosti mezi CPU a RAM.', 14.5, SILK)
    save(17, 'u17-hierarchie.svg', 'Hierarchie pamětí a princip cache (hit / miss)',
         svg(W, H, 'Hierarchie pamětí a cache', 'Čím blíž procesoru, tím rychlejší a menší paměť', b))

for f in (fat_layout, fat_chain, ntfs, ip_mask, ip_classes, router, hdd_geometry, hdd_sector, mem_tree, mem_pyramid): f()
json.dump(OUT, open(os.path.join(D, 'obrazky.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print({k: len(v) for k, v in OUT.items()})
