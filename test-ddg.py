import urllib.request
import urllib.parse
import ssl
import re

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

query = 'фаршмешалка промышленная'
url = f'https://lite.duckduckgo.com/lite/?q={urllib.parse.quote(query)}&kl=ru-ru'

req = urllib.request.Request(url, headers={
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.0',
    'Accept': 'text/html',
    'Accept-Language': 'ru-RU,ru;q=0.9',
})

try:
    response = urllib.request.urlopen(req, context=ctx, timeout=15)
    html = response.read().decode('utf-8')
    print('Status:', response.status)
    print('Content length:', len(html))
    print()
    # Check if we got results
    if 'result-link' in html or 'result-' in html:
        print('HAS result markers: YES')
    else:
        print('HAS result markers: NO')
    # Look for any links
    links = re.findall(r'href="(https?://[^"]+)"', html)
    print(f'Found {len(links)} http links')
    for l in links[:10]:
        print(f'  - {l[:80]}')
    print()
    # Save sample of HTML
    print("HTML sample (first 2000 chars):")
    print(html[:2000])
except Exception as e:
    print('Error:', e)
