import urllib.request
import json

url = "http://localhost:3001/docs/json"
with urllib.request.urlopen(url) as response:
    data = json.loads(response.read().decode())
    paths = [p for p in data.get('paths', {}) if 'calculation' in p.lower()]
    for p in sorted(paths):
        print(p)
