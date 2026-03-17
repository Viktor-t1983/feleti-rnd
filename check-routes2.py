import json

with open('openapi.json', 'r', encoding='utf-8') as f:
    data = json.load(f)
    paths = [p for p in data.get('paths', {}) if 'calc' in p.lower()]
    for p in sorted(paths):
        print(p)
