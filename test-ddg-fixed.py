import urllib.request
import urllib.parse
import ssl
import re

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

query = 'фаршмешалка промышленная'

# Шаг 1: GET запрос для получения cookies
print("Step 1: Getting cookies...")
url = 'https://lite.duckduckgo.com/lite/'
req = urllib.request.Request(url, headers={
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'text/html',
    'Accept-Language': 'ru-RU,ru;q=0.9',
})

# Создаем opener с cookie processor
from http.cookiejar import CookieJar
cj = CookieJar()
opener = urllib.request.build_opener(
    urllib.request.HTTPSHandler(context=ctx),
    urllib.request.HTTPCookieProcessor(cj)
)

# Первый запрос - получаем форму
resp1 = opener.open(req, timeout=15)
html1 = resp1.read().decode('utf-8')
print(f"  Got cookies: {len(list(cj))}")

# Шаг 2: POST запрос с поиском
print("\nStep 2: POST search...")
post_data = urllib.parse.urlencode({
    'q': query,
    'kl': 'ru-ru',
}).encode('utf-8')

req2 = urllib.request.Request('https://lite.duckduckgo.com/lite/', 
    data=post_data,
    headers={
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html',
        'Accept-Language': 'ru-RU,ru;q=0.9',
        'Referer': 'https://lite.duckduckgo.com/lite/',
        'Origin': 'https://lite.duckduckgo.com',
    }
)

resp2 = opener.open(req2, timeout=15)
html2 = resp2.read().decode('utf-8')
print(f"  Response length: {len(html2)}")

# Парсим результаты
print("\nParsing results...")

# Результаты в таблице
result_rows = re.findall(
    r'<tr>.*?<a[^>]+class="result-link"[^>]+href="([^"]+)"[^>]*>([^<]+)</a>.*?(?:<td[^>]+class="result-snippet"[^>]*>(.*?)</td>)?.*?</tr>',
    html2, re.DOTALL | re.IGNORECASE
)

print(f"Found {len(result_rows)} results:")
for i, (url, title, snippet) in enumerate(result_rows[:10]):
    clean_title = re.sub(r'<[^>]+>', '', title).strip()
    clean_snippet = re.sub(r'<[^>]+>', '', snippet or '').strip()[:100] if snippet else ''
    print(f"{i+1}. {clean_title[:50]}")
    print(f"   URL: {url[:60]}")
    if clean_snippet:
        print(f"   {clean_snippet}...")
    print()
