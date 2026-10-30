"""Build static champion data from the verified Obsidian guide.

Requires the two public-source snapshots in the parent workspace for regeneration:
  Database_ARAM_Desordem_Todos_Campeones_26.21.md
  /tmp/aram_champions_2621.json
  /tmp/opgg_mayhem_en.html and /tmp/opgg_mayhem_pt.html (optional icons)
The generated JSON is committed, so deployment needs no external fetch.
"""
import json
import re
from pathlib import Path

BASE = Path(__file__).resolve().parents[2]
TARGET = Path(__file__).resolve().parents[1] / 'src' / 'data' / 'champions.json'
raw = (BASE / 'Database_ARAM_Desordem_Todos_Campeones_26.21.md').read_text()
source = json.loads(Path('/tmp/aram_champions_2621.json').read_text())['rows']
ids = {r['name']['en']: r['championId'] for r in source}
slugs = {r['name']['en']: r['slug'] for r in source}
opgg = Path('/tmp/opgg_mayhem_en.html')
icons = {}
if opgg.exists():
    opgg_text = opgg.read_text().replace('\\"', '"')
    for name, image in re.findall(r'"name":"([^"]+)","key":"[^"]+","largeIcon":"([^"]+)"', opgg_text):
        if 'https://' in image and 'aram-augment' in image:
            icons[name.lower()] = image
    for variant, canonical in {'Cant Touch This': "Can't Touch This", 'Quest: Steel Your Heart': 'Steel Your Heart', "Quest: Wooglet's Witchcap": "Wooglet's Witchcap", 'Spellsplit': 'Spell Split', 'Take’em Down Down Down': "Take'em Down Down Down", 'Upgrade: Stormsurge': 'Upgrade Stormsurge', 'Weapon Of Destiny': 'Weapon of Destiny'}.items():
        if canonical.lower() in icons:
            icons[variant.lower()] = icons[canonical.lower()]

group = None
records = []
entry = None
for line in raw.splitlines():
    if line.startswith('## ') and line[3:] in ('Magos', 'Tiradores (ADC)', 'Lutadores', 'Tanques', 'Assassinos', 'Suportes'):
        group = line[3:]
    elif group and line.startswith('### '):
        if entry:
            records.append(entry)
        name = line[4:]
        entry = {'name': name, 'id': ids.get(name, name.replace(' ', '')), 'slug': slugs.get(name, name.lower()), 'role': group, 'tags': [], 'augments': {'Prismática': [], 'Ouro': [], 'Prata': []}}
    elif entry and line.startswith('**Papéis:** '):
        entry['tags'] = line.split(' · ')[0].replace('**Papéis:** ', '').split(', ')
    elif entry and line.startswith('| ') and ' | [' in line:
        rarity = line.split(' | ')[0][2:]
        rarity = {'Prismáticos': 'Prismática', 'Ouro': 'Ouro', 'Prata': 'Prata'}.get(rarity)
        if rarity:
            for pt, url, tier in re.findall(r'\[([^\]]+)\]\((https://arammayhem.com/augments/[^)]+)\) \*\*(S\+|S-|S|A\+|A-|A|B\+|B-|B|C|D)\*\*', line):
                m = re.match(r'^(.*?) \((.*?)\)$', pt)
                english = m.group(2) if m else pt
                entry['augments'][rarity].append({'name': m.group(1) if m else pt, 'english': english, 'tier': tier, 'url': url, 'icon': icons.get(english.lower(), '')})
if entry:
    records.append(entry)

# Stable square portraits from Riot Data Dragon. Special Riot ids are preserved.
for record in records:
    record['portrait'] = 'https://ddragon.leagueoflegends.com/cdn/16.21.1/img/champion/' + record['id'] + '.png'

assert len(records) == 173, f'Expected 173, got {len(records)}'
assert all(any(r['augments'].values()) for r in records)
TARGET.parent.mkdir(parents=True, exist_ok=True)
TARGET.write_text(json.dumps(records, ensure_ascii=False, separators=(',', ':')) + '\n')
print('Generated', len(records), 'champion entries at', TARGET)
