import json
with open('test-result-5.json', 'r', encoding='utf-8-sig') as f:
    data = json.load(f)

print('=== Test Result 5 (New Code) ===')
print(f'Success: {data.get("success")}')
print(f'Results count: {len(data.get("data", []))}')

meta = data.get('meta', {})
print(f'Sources: {meta.get("sources", [])}')
print(f'Processing time: {meta.get("processingTimeMs", 0)}ms')

print('\nTop 5 results:')
for i, r in enumerate(data.get('data', [])[:5]):
    print(f'  {i+1}. [{r.get("score", 0)}] {r.get("name", "N/A")[:50]} ({r.get("source", "unknown")})')
