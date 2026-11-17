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
    lines = [l for l in txt.split('\n') if not re.match(r'^\s*\d+\.\s.{0,60}$', l) or len(l) > 70]
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
labs2 = open(base + '/build/labs2.js', encoding='utf-8').read()
tpl3 = open(base + '/build/template3.html', encoding='utf-8').read()
import datetime
VERSION = datetime.datetime.now().strftime('%-d.%-m.%Y %H:%M')
tpl3 = tpl3.replace('/*VERSION*/', VERSION)
import subprocess
# videa: v repu leží ve videa/*.mp4, na původním PC ve videa/out/*.mp4; délky se pamatují v build/videa.json,
# takže build funguje i bez ffprobe nebo bez stažených videí
import os
VJSON = base + '/build/videa.json'
try: VIDS = {int(k): v for k, v in json.load(open(VJSON)).items()}
except Exception: VIDS = {}
for f in sorted(glob.glob(base + '/../videa/*.mp4') + glob.glob(base + '/../videa/out/*.mp4')):
    try:
        d = float(subprocess.run(['ffprobe','-v','error','-show_entries','format=duration','-of','default=nw=1:nk=1',f],capture_output=True,text=True).stdout.strip())
        VIDS[int(re.findall(r'(\d+)\.mp4$', f)[0])] = round(d)
    except Exception: pass
json.dump({str(k): VIDS[k] for k in sorted(VIDS)}, open(VJSON, 'w'))
tpl3 = tpl3.replace('/*VIDEOS*/', json.dumps(VIDS))
lbjs = open(base + '/build/lb.js', encoding='utf-8').read().replace('/*LBCONF*/', js(json.load(open(base + '/build/leaderboard.json'))))
imgjs = open(base + '/build/imgs.js', encoding='utf-8').read()
tpl3 = tpl3.replace('/*DATA*/', js(topics)).replace('/*RAW*/', js(raw)).replace('/*IMG*/', open(base + '/build/images.json').read()).replace('/*LABS*/', labs + '\n' + labs2 + '\n' + lbjs + '\n' + imgjs + '\n' + open(base + '/build/extra.js', encoding='utf-8').read())
open(base + '/maturitni-deska-3.html', 'w', encoding='utf-8').write(tpl3)
open(base + '/app3.html', 'w', encoding='utf-8').write(wrap(tpl3))
print('v3', len(tpl3.encode()))
