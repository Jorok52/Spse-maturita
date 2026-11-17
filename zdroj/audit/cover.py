import json, glob, re, sys
base = sys.argv[1]
def stems(s):
    return {w[:5] for w in re.findall(r"[a-záčďéěíňóřšťúůýž0-9]{4,}", s.lower())}
STOP = stems("otázka popis charakteristika princip funkce vlastnosti výhody nevýhody použití typy shrnutí příklad struktura základní další nastavení")
tot = 0
for f in sorted(glob.glob(base + '/data/*.json')):
    d = json.load(open(f)); n = d['n']
    blob = json.dumps(d, ensure_ascii=False).lower()
    have = stems(blob)
    miss = []
    for line in open(f"{base}/raw/{n}.txt"):
        L = line.strip()
        if not (6 <= len(L) <= 55) or L.endswith(('.', ',', ':', ';')) or L[0].islower() or re.match(r"^\d+\. ", L) and str(n) in L[:3]: continue
        st = stems(L) - STOP
        if len(st) >= 1 and not (st & have):
            miss.append(L)
    tot += len(miss)
    print(f"T{n}: {len(miss)} ->", ' | '.join(dict.fromkeys(miss))[:700])
print(tot)
