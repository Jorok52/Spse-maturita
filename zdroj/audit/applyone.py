import json
files = {n: f'data_v1/{n:02d}.json' for n in range(2, 21)}; files[1] = 'data_x/01.json'
data = {n: json.load(open(p)) for n, p in files.items()}
ex = json.load(open('data_x/extras.json'))
patch = json.load(open('audit/len/one.json')); short = []
for key, (idx, txt) in patch.items():
    n, i = key.split('.'); n = int(n)
    row = ex[str(n)]['q'][int(i[1:])] if i.startswith('x') else data[n]['q'][int(i)]
    assert txt != row[1] and txt not in row[2:5], key
    row[2 + idx] = txt
    if len(txt) <= len(row[1]): short.append((key, len(txt), len(row[1])))
for n, p in files.items(): json.dump(data[n], open(p, 'w'), ensure_ascii=False, indent=0)
json.dump(ex, open('data_x/extras.json', 'w'), ensure_ascii=False, indent=1)
rows = [q for d in data.values() for q in d['q']] + [q for v in ex.values() for q in v['q']]
lg = sum(1 for q in rows if len(q[1]) > max(len(x) for x in q[2:5]))
sh = sum(1 for q in rows if len(q[1]) < min(len(x) for x in q[2:5]))
print('pořád kratší než správná:', short)
print(f'správná nejdelší: {lg}/{len(rows)} = {lg/len(rows):.0%} | nejkratší: {sh/len(rows):.0%}')
