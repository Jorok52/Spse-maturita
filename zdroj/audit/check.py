import json, glob, re, sys, unicodedata
base = sys.argv[1]
def norm(s):
    s = s.lower().replace('²','2').replace('ⁿ','n').replace('−','-').replace('–','-')
    return s
def toks(s):
    s = norm(s)
    out = []
    for w in re.findall(r"[0-9a-záčďéěíňóřšťúůýž$.,/]+", s):
        w = w.strip('.,/')
        if not w: continue
        if re.fullmatch(r"[0-9.,]+", w): out.append(w); continue
        if len(w) >= 4: out.append(w[:5])   # crude stem
    return out
flag = []
for f in sorted(glob.glob(base + '/data/*.json')):
    d = json.load(open(f)); n = d['n']
    raw = norm(open(f"{base}/raw/{n}.txt").read())
    rawc = re.sub(r"\s+", " ", raw)
    for i, q in enumerate(d['q']):
        t = toks(q[1])
        if not t: continue
        hit = sum(1 for w in t if w in rawc)
        r = hit / len(t)
        if r < 0.6: flag.append((r, n, i, q[0], q[1]))
flag.sort()
print(len(flag), 'flagged')
for r, n, i, qq, a in flag: print(f"{r:.2f} T{n}#{i} | {qq} => {a}")
