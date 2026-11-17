import json, glob, sys, re
base = sys.argv[1]
def js(o): return json.dumps(o, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
SKEL = ('<!doctype html><html lang="cs"><head><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
        '<style>:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}'
        'body{margin:0;font:14px system-ui,sans-serif}img{max-width:100%}[hidden]{display:none!important}</style></head><body>')
def wrap(h): return SKEL + h + '</body></html>'

# ---- v1 (PDF only) ----
v1 = sorted((json.load(open(f)) for f in glob.glob(base + '/data_v1/*.json')), key=lambda t: t['n'])
tpl1 = open(base + '/build/template.html', encoding='utf-8').read().replace('/*DATA*/', js(v1))
open(base + '/maturitni-deska.html', 'w', encoding='utf-8').write(tpl1)
open(base + '/app1.html', 'w', encoding='utf-8').write(wrap(tpl1))

# ---- v2 ----
v2 = {t['n']: t for t in (json.load(open(f)) for f in glob.glob(base + '/data_v1/*.json'))}
v2[1] = json.load(open(base + '/data_x/01.json'))
ex = json.load(open(base + '/data_x/extras.json'))
for k, e in ex.items():
    t = v2[int(k)]
    t['outline'] = t['outline'] + [o for o in e.get('outline_add', []) if o not in t['outline']]
    t['q'] = t['q'] + [r + [1] for r in e['q']]
    t['open'] = t['open'] + e.get('open', [])
topics = [v2[n] for n in sorted(v2)]
raw = {}
for f in glob.glob(base + '/raw/*.txt'):
    n = int(re.findall(r'(\d+)\.txt$', f)[0])
    txt = open(f, encoding='utf-8').read()
    lines = [l for l in txt.split('\n') if not re.match(r'^\s*\d+\.\s.{0,60}$', l) or len(l) > 70]
    raw[n] = re.sub(r'[ \t]+', ' ', '\n'.join(lines))
labs = open(base + '/build/labs.js', encoding='utf-8').read()
tpl2 = open(base + '/build/template2.html', encoding='utf-8').read()
tpl2 = tpl2.replace('/*DATA*/', js(topics)).replace('/*RAW*/', js(raw)).replace('/*LABS*/', labs)
open(base + '/maturitni-deska-2.html', 'w', encoding='utf-8').write(tpl2)
open(base + '/app2.html', 'w', encoding='utf-8').write(wrap(tpl2))
print('v1', len(tpl1.encode()), 'v2', len(tpl2.encode()), 'topics', len(topics), 'q', sum(len(t['q']) for t in topics))
