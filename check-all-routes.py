import json

with open('openapi.json', 'r', encoding='utf-8') as f:
    data = json.load(f)
    paths = list(data.get('paths', {}).keys())
    for p in sorted(paths):
        print(p)
