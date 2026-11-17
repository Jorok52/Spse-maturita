import json, glob
# aplikuje nové distraktory z audit/len/*.json do dat
patch = {}
for f in sorted(glob.glob('audit/len/*.json')): patch.update(json.load(open(f)))
files = {n: f'data_v1/{n:02d}.json' for n in range(2, 21)}; files[1] = 'data_x/01.json'
data = {n: json.load(open(p)) for n, p in files.items()}
ex = json.load(open('data_x/extras.json'))
done = 0
for key, ws in patch.items():
    n, i = key.split('.'); n = int(n)
    row = ex[str(n)]['q'][int(i[1:])] if i.startswith('x') else data[n]['q'][int(i)]
    assert len(ws) == 3 and len(set(ws)) == 3 and row[1] not in ws, key
    row[2:5] = ws; done += 1
for n, p in files.items(): json.dump(data[n], open(p, 'w'), ensure_ascii=False, indent=0)
json.dump(ex, open('data_x/extras.json', 'w'), ensure_ascii=False, indent=1)
# statistika
rows = [q for d in data.values() for q in d['q']] + [q for v in ex.values() for q in v['q']]
lg = sum(1 for q in rows if len(q[1]) > max(len(x) for x in q[2:5]))
sh = sum(1 for q in rows if len(q[1]) < min(len(x) for x in q[2:5]))
print('upraveno', done, '| správná nejdelší:', f'{lg}/{len(rows)} = {lg/len(rows):.0%}', '| správná nejkratší:', f'{sh/len(rows):.0%}')
