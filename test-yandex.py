import urllib.request
import urllib.parse
import ssl
import re

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

query = 'фаршмешалка промышленная'

# Yandex XML API (требует ключ) или простой поиск
# Попробуем простой поиск через yandex.ru
url = f'https://yandex.ru/search/?text={urllib.parse.quote(query)}&lr=157'  # lr=157 - Belarus

req = urllib.request.Request(url, headers={
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.0',
    'Accept': 'text/html',
    'Accept-Language': 'ru-RU,ru;q=0.9',
    'Referer': 'https://yandex.ru/',
})

try:
    response = urllib.request.urlopen(req, context=ctx, timeout=15)
    html = response.read().decode('utf-8')
    print('Status:', response.status)
    print('Length:', len(html))
    
    # Проверяем на капчу
    if 'captcha' in html.lower() or 'капча' in html.lower():
        print('CAPTCHA detected!')
    else:
        # Ищем результаты
        # Yandex использует class="link"
        results = re.findall(r'<a[^>]+class="link"[^>]+href="([^"]+)"[^>]*>([^<]+)</a>', html)
        print(f'\nFound {len(results)} results:')
        for url, title in results[:5]:
            print(f'  - {title.strip()[:50]}')
            print(f'    {url[:60]}')
            
        # Альтернативный паттерн
        if len(results) == 0:
            results2 = re.findall(r'<h2[^>]*>.*?<a[^>]+href="([^"]+)"[^>]*>([^<]+)</a>.*?</h2>', html, re.DOTALL)
            print(f'\nAlt pattern found: {len(results2)}')
            
except Exception as e:
    print('Error:', e)
    import traceback
    traceback.print_exc()
