import urllib.request
import urllib.parse
import ssl
import re

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

query = 'фаршмешалка промышленная'

# Try POST
post_data = urllib.parse.urlencode({'q': query, 'kl': 'ru-ru'}).encode('utf-8')
url = 'https://lite.duckduckgo.com/lite/'

req = urllib.request.Request(url, data=post_data, headers={
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.0',
    'Accept': 'text/html',
    'Accept-Language': 'ru-RU,ru;q=0.9',
    'Content-Type': 'application/x-www-form-urlencoded',
}, method='POST')

try:
    response = urllib.request.urlopen(req, context=ctx, timeout=15)
    html = response.read().decode('utf-8')
    print('Status:', response.status)
    print('Content length:', len(html))
    
    # Find result rows
    # DDG uses table structure with class="result-link"
    result_pattern = r'<a[^>]+class="result-link"[^>]+href="([^"]+)"[^>]*>([^<]+)</a>'
    results = re.findall(result_pattern, html, re.IGNORECASE)
    
    print(f'\nFound {len(results)} results:')
    for url, title in results[:10]:
        print(f'  - {title.strip()[:60]}')
        print(f'    {url[:80]}')
        print()
        
    # Also look for snippet
    snippet_pattern = r'<td[^>]+class="result-snippet"[^>]*>(.*?)</td>'
    snippets = re.findall(snippet_pattern, html, re.IGNORECASE | re.DOTALL)
    print(f'Found {len(snippets)} snippets')
    
except Exception as e:
    print('Error:', e)
    import traceback
    traceback.print_exc()
