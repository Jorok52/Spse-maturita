import json, glob, sys
# vypíše otázky, kde je správná odpověď nejdelší (pro přepis distraktorů)
topics = [int(x) for x in sys.argv[1].split(',')]
def load(n):
    if n == 1: return json.load(open('data_x/01.json'))['q'], 'q'
    return json.load(open(f'data_v1/{n:02d}.json'))['q'], 'q'
ex = json.load(open('data_x/extras.json'))
for n in topics:
    qs, _ = load(n)
    items = [(str(i), q) for i, q in enumerate(qs)]
    if str(n) in ex: items += [('x'+str(i), q) for i, q in enumerate(ex[str(n)]['q'])]
    for i, q in items:
        if len(q[1]) > max(len(x) for x in q[2:5]):
            print(f"{n}.{i} | {q[0]} | ✓ {q[1]} | ✗ {' / '.join(q[2:5])}")
