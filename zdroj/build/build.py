import json, glob, sys, re
base = sys.argv[1]
def js(o): return json.dumps(o, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
SKEL = ('<!doctype html><html lang="cs"><head><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
        '<style>:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}'
        'body{margin:0;font:14px system-ui,sans-serif}img{max-width:100%}[hidden]{display:none!important}</style></head><body>')
def wrap(h): return SKEL + h + '</body></html>'

# ---- v1 (PDF only) ----
ORAL = {}
for f in sorted(glob.glob(base + '/data_oral/*.json')): ORAL.update(json.load(open(f, encoding='utf-8')))
def pdfonly(o):
    k = [x for x in o['k'] if 'mimo PDF' not in x and not x.startswith('Systémové proměnné') and not x.startswith('Vrstvy:')]
    return {'q': o['q'], 'k': k}
v1 = sorted((json.load(open(f)) for f in glob.glob(base + '/data_v1/*.json')), key=lambda t: t['n'])
for t in v1:
    if str(t['n']) in ORAL: t['open'] = [o for o in (pdfonly(o) for o in ORAL[str(t['n'])]) if o['k']]
tpl1 = open(base + '/build/template.html', encoding='utf-8').read().replace('/*DATA*/', js(v1))
open(base + '/maturitni-deska.html', 'w', encoding='utf-8').write(tpl1)
open(base + '/app1.html', 'w', encoding='utf-8').write(wrap(tpl1))

# ---- v2 ----
v2 = {t['n']: t for t in (json.load(open(f)) for f in glob.glob(base + '/data_v1/*.json'))}
ex = json.load(open(base + '/data_x/extras.json'))
for k, e in ex.items():
    t = v2[int(k)]
    t['outline'] = t['outline'] + [o for o in e.get('outline_add', []) if o not in t['outline']]
    t['q'] = t['q'] + [r + [1] for r in e['q']]
    t['open'] = t['open'] + e.get('open', [])
for n in v2:
    if str(n) in ORAL: v2[n]['open'] = ORAL[str(n)]
topics = [v2[n] for n in sorted(v2)]
raw = {}
for f in sorted(glob.glob(base + '/raw/*.txt')):
    n = int(re.findall(r'(\d+)\.txt$', f)[0])
    txt = open(f, encoding='utf-8').read()
    # záhlaví stránky („5. A/D Převodníky“) se vynechá, ale značka nové stránky \f z něj zůstane (čtečka podle ní najde číslo strany)
    # záhlaví je jen první řádek souboru nebo stránky (ten se značkou \f) – jiné krátké „N. text“ jsou obsah (vrstvy OSI, číslované body)
    lines = [l if not (re.match(r'^\s*\d+\.\s.{0,60}$', l) and len(l) <= 70 and ('\f' in l or i == 0)) else ('\f' if '\f' in l else None) for i, l in enumerate(txt.split('\n'))]
    lines = [l for l in lines if l is not None]
    raw[n] = re.sub(r'[ \t]+', ' ', '\n'.join(lines))
labs = open(base + '/build/labs.js', encoding='utf-8').read()
_lbc = json.load(open(base + '/build/leaderboard.json'))
labs = 'window.MD_PROXY = ' + js({'url': _lbc.get('url'), 'key': _lbc.get('key'), 'fn': _lbc.get('aiFn', 'ai-zkousejici')}) + ';\n' + labs
tpl2 = open(base + '/build/template2.html', encoding='utf-8').read()
tpl2 = tpl2.replace('/*DATA*/', js(topics)).replace('/*RAW*/', js(raw)).replace('/*LABS*/', labs)
open(base + '/maturitni-deska-2.html', 'w', encoding='utf-8').write(tpl2)
open(base + '/app2.html', 'w', encoding='utf-8').write(wrap(tpl2))
print('v1', len(tpl1.encode()), 'v2', len(tpl2.encode()), 'topics', len(topics), 'q', sum(len(t['q']) for t in topics))

# ---- v3 (tvoje vylepšená grafika a zvuk + laboratoře 2 + dílna) ----
# Varianty:
#   plná  – zdroj/maturitni-deska-3.html a zdroj/app3.html: vše v jednom souboru (obrázky, písma) → aplikace, artefakt, offline
#   web   – jen když je druhý argument (kořen repa, např. "."): index.html + img/, fonts/, icons/, sw.js, manifest, version.json
import datetime, subprocess, os, base64, io, hashlib, shutil
WEB = sys.argv[2] if len(sys.argv) > 2 else None
labs2 = open(base + '/build/labs2.js', encoding='utf-8').read()
tpl3 = open(base + '/build/template3.html', encoding='utf-8').read()
VERSION = datetime.datetime.now().strftime('%-d.%-m.%Y %H:%M')
tpl3 = tpl3.replace('/*VERSION*/', VERSION)
# videa: v repu leží ve videa/*.mp4, na původním PC ve videa/out/*.mp4; délky se pamatují v build/videa.json,
# takže build funguje i bez ffprobe nebo bez stažených videí. Video z YouTube: {"7": {"yt": "ID videa", "len": 754}}
VJSON = base + '/build/videa.json'
try: VIDS = {int(k): v for k, v in json.load(open(VJSON)).items()}
except Exception: VIDS = {}
for f in sorted(glob.glob(base + '/../videa/*.mp4') + glob.glob(base + '/../videa/out/*.mp4')):
    try:
        d = float(subprocess.run(['ffprobe','-v','error','-show_entries','format=duration','-of','default=nw=1:nk=1',f],capture_output=True,text=True).stdout.strip())
        n = int(re.findall(r'(\d+)\.mp4$', f)[0])
        if not isinstance(VIDS.get(n), dict): VIDS[n] = round(d)
    except Exception: pass
json.dump({str(k): VIDS[k] for k in sorted(VIDS)}, open(VJSON, 'w'))
tpl3 = tpl3.replace('/*VIDEOS*/', json.dumps(VIDS))
lbjs = open(base + '/build/lb.js', encoding='utf-8').read().replace('/*LBCONF*/', js(json.load(open(base + '/build/leaderboard.json'))))
imgjs = open(base + '/build/imgs.js', encoding='utf-8').read()
tpl3 = tpl3.replace('/*DATA*/', js(topics)).replace('/*RAW*/', js(raw)).replace('/*LABS*/', labs + '\n' + labs2 + '\n' + lbjs + '\n' + imgjs + '\n' + open(base + '/build/extra.js', encoding='utf-8').read() + '\n' + open(base + '/build/nav.js', encoding='utf-8').read())

# obrázky: z PDF (images.json, JPEG v base64) + nakreslená schémata (obrazky/*.svg podle obrazky/obrazky.json)
IMGS = json.load(open(base + '/build/images.json'))
DIAG = json.load(open(base + '/obrazky/obrazky.json', encoding='utf-8')) if os.path.exists(base + '/obrazky/obrazky.json') else {}
def svg_bytes(name): return open(base + '/obrazky/' + name, 'rb').read()
def img_full():
    out = {k: [dict(im) for im in v] for k, v in IMGS.items()}
    for k, lst in DIAG.items():
        for d in lst:
            out.setdefault(k, []).append({'s': 'data:image/svg+xml;base64,' + base64.b64encode(svg_bytes(d['f'])).decode(), 'cap': d['cap']})
    return out
def img_web(dest):
    from PIL import Image
    os.makedirs(dest, exist_ok=True)
    out, keep = {}, set()
    for k, lst in IMGS.items():
        for i, im in enumerate(lst):
            raw_b = base64.b64decode(im['s'].split(',', 1)[1])
            h = hashlib.sha1(raw_b).hexdigest()[:8]
            name = 'u%02d-%d-%s.webp' % (int(k), i + 1, h)
            if not os.path.exists(os.path.join(dest, name)):
                pic = Image.open(io.BytesIO(raw_b)); pic.save(os.path.join(dest, name), 'WEBP', quality=80, method=6)
            keep.add(name); out.setdefault(k, []).append({'s': 'img/' + name, 'p': im['p']})
    for k, lst in DIAG.items():
        for d in lst:
            b = svg_bytes(d['f']); name = d['f'][:-4] + '-' + hashlib.sha1(b).hexdigest()[:8] + '.svg'
            open(os.path.join(dest, name), 'wb').write(b); keep.add(name)
            out.setdefault(k, []).append({'s': 'img/' + name, 'cap': d['cap']})
    for f in os.listdir(dest):
        if f not in keep: os.remove(os.path.join(dest, f))
    return out

# písma: zdroj/fonts (stažené z Google Fonts, licence OFL) – web je bere ze složky fonts/, plná verze je má vložené
FONTCSS = open(base + '/fonts/fonts.css', encoding='utf-8').read()
def fonts_inline():
    return re.sub(r'url\(fonts/([^)]+)\)', lambda m: 'url(data:font/woff2;base64,' + base64.b64encode(open(base + '/fonts/' + m.group(1), 'rb').read()).decode() + ')', FONTCSS)
WEBHEAD = ('<link rel="manifest" href="manifest.webmanifest">\n<link rel="apple-touch-icon" href="icons/icon-180.png">\n'
           '<link rel="preload" href="fonts/IBMPlexSans-400-latin.woff2" as="font" type="font/woff2" crossorigin>\n'
           '<link rel="preload" href="fonts/ChakraPetch-600-latin.woff2" as="font" type="font/woff2" crossorigin>')
def render(img, fonts, web):
    return (tpl3.replace('/*IMG*/', js(img)).replace('/*FONTS*/', fonts)
                .replace('<!--WEBHEAD-->', WEBHEAD if web else '').replace('/*WEB*/', 'true' if web else 'false'))

full = render(img_full(), fonts_inline(), False)
open(base + '/maturitni-deska-3.html', 'w', encoding='utf-8').write(full)
open(base + '/app3.html', 'w', encoding='utf-8').write(full)
print('v3', len(full.encode()))

if WEB:
    page = render(img_web(os.path.join(WEB, 'img')), FONTCSS, True)
    open(os.path.join(WEB, 'index.html'), 'w', encoding='utf-8').write(page)
    os.makedirs(os.path.join(WEB, 'fonts'), exist_ok=True)
    for f in glob.glob(base + '/fonts/*.woff2') + glob.glob(base + '/fonts/OFL-*.txt'):
        shutil.copy(f, os.path.join(WEB, 'fonts', os.path.basename(f)))
    os.makedirs(os.path.join(WEB, 'icons'), exist_ok=True)
    for f in glob.glob(base + '/build/web/icons/*.png'): shutil.copy(f, os.path.join(WEB, 'icons', os.path.basename(f)))
    shutil.copy(base + '/build/web/manifest.webmanifest', os.path.join(WEB, 'manifest.webmanifest'))
    fonts_list = sorted('fonts/' + os.path.basename(f) for f in glob.glob(base + '/fonts/*.woff2'))
    sw = open(base + '/build/web/sw.js', encoding='utf-8').read().replace('/*VERSION*/', VERSION).replace('/*FONTS*/', json.dumps(fonts_list))
    open(os.path.join(WEB, 'sw.js'), 'w', encoding='utf-8').write(sw)
    json.dump({'v': VERSION}, open(os.path.join(WEB, 'version.json'), 'w'))
    print('web', len(page.encode()), '→', os.path.join(WEB, 'index.html'))
