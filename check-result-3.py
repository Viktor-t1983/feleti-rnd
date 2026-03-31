import json

with open('test-result-3.json', 'r', encoding='utf-8-sig') as f:
    data = json.load(f)

print("=== Test Result 3 (Whoogle stopped, DDG fallback) ===")
print(f"Success: {data.get('success')}")
print(f"Results count: {len(data.get('data', []))}")

meta = data.get('meta', {})
print(f"\nMeta:")
print(f"  Sources: {meta.get('sources', [])}")
print(f"  From cache: {meta.get('fromCache', False)}")
print(f"  Processing time: {meta.get('processingTimeMs', 0)}ms")

analysis = data.get('analysis', {})
print(f"\nAnalysis:")
print(f"  Summary: {analysis.get('summary', 'N/A')[:100]}")
print(f"  Insights: {analysis.get('insights', [])}")

print(f"\nTop 10 results:")
for i, r in enumerate(data.get('data', [])[:10]):
    name = r.get('name', 'N/A')[:55]
    score = r.get('score', 0)
    source = r.get('source', 'unknown')
    print(f"  {i+1:2}. [{score:3}] ({source:15}) {name}")
