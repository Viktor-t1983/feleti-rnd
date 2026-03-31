import urllib.request
import urllib.parse
import ssl
import json

# Публичные Searx инстансы
SEARX_INSTANCES = [
    'https://search.sapti.me',  # обычно работает
    'https://searx.be',
    'https://search.bus-hit.me',
]

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

query = 'фаршмешалка промышленная'

for instance in SEARX_INSTANCES:
    try:
        url = f'{instance}/search?q={urllib.parse.quote(query)}&format=json&language=ru-RU'
        req = urllib.request.Request(url, headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            'Accept': 'application/json',
        })
        
        response = urllib.request.urlopen(req, context=ctx, timeout=10)
        data = json.loads(response.read().decode('utf-8'))
        
        results = data.get('results', [])
        print(f'{instance}: {len(results)} results')
        
        for r in results[:3]:
            print(f"  - {r.get('title', 'N/A')[:50]}")
            print(f"    {r.get('url', 'N/A')[:60]}")
        
        if results:
            break
            
    except Exception as e:
        print(f'{instance}: ERROR - {e}')
