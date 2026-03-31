import re

with open('ddg-debug.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Find result tables
tables = re.findall(r'<table[^>]*>(.*?)</table>', html, re.DOTALL)
print(f'Tables: {len(tables)}')

# Look for result-link pattern specifically
links = re.findall(r'result-link', html)
print(f'result-link count: {len(links)}')

# Find all <a> tags in tables
for i, table in enumerate(tables):
    if 'result' in table.lower():
        print(f'\n=== Table {i} (has result) ===')
        # Find links with class result-link
        alinks = re.findall(r'<a[^>]+class="result-link"[^>]+href="([^"]+)"[^>]*>([^<]*)</a>', table)
        for href, text in alinks[:10]:
            print(f'  {text[:50]:<50} -> {href[:60]}')
            
        # Also look for any links
        all_links = re.findall(r'<a[^>]+href="([^"]+)"[^>]*>([^<]*)</a>', table)
        if len(alinks) == 0 and all_links:
            print(f'  All links in table:')
            for href, text in all_links[:5]:
                print(f'    {text[:40]:<40} -> {href[:60]}')
