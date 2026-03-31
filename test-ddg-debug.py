import urllib.request
import urllib.parse
import ssl
import re

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

query = 'фаршмешалка промышленная'

# Простой GET с перенаправлением
url = f'https://lite.duckduckgo.com/lite/?q={urllib.parse.quote(query)}&kl=ru-ru'
print(f"URL: {url}")

req = urllib.request.Request(url, headers={
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.0',
    'Accept': 'text/html,application/xhtml+xml',
    'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8',
})

try:
    response = urllib.request.urlopen(req, context=ctx, timeout=15)
    html = response.read().decode('utf-8')
    
    # Сохраняем для анализа
    with open('ddg-debug.html', 'w', encoding='utf-8') as f:
        f.write(html)
    
    print(f"Status: {response.status}")
    print(f"Length: {len(html)}")
    
    # Ищем любые ссылки
    all_links = re.findall(r'href="([^"]+)"', html)
    print(f"\nAll links ({len(all_links)}):")
    for l in all_links[:20]:
        print(f"  {l[:80]}")
    
    # Ищем table с результатами
    if '<table' in html:
        print("\nHAS table tags: YES")
        tables = re.findall(r'<table[^>]*>(.*?)</table>', html, re.DOTALL)
        print(f"Tables found: {len(tables)}")
    else:
        print("\nHAS table tags: NO")
        
except Exception as e:
    print(f'Error: {e}')
