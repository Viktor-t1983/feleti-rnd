import json

def check_file(filename):
    try:
        with open(filename, 'r', encoding='utf-8-sig') as f:
            data = json.load(f)
        
        print(f"\n=== {filename} ===")
        print(f"Success: {data.get('success')}")
        print(f"Results count: {len(data.get('data', []))}")
        
        meta = data.get('meta', {})
        print(f"Sources used: {meta.get('sources', [])}")
        print(f"From cache: {meta.get('fromCache', False)}")
        print(f"Processing time: {meta.get('processingTimeMs', 0)}ms")
        
        analysis = data.get('analysis', {})
        print(f"\nAnalysis summary: {analysis.get('summary', 'N/A')[:100]}...")
        print(f"Insights: {analysis.get('insights', [])}")
        
        print(f"\nTop 5 results:")
        for i, r in enumerate(data.get('data', [])[:5]):
            name = r.get('name', 'N/A')[:60]
            score = r.get('score', 0)
            source = r.get('source', 'unknown')
            print(f"  {i+1}. {name} (score: {score}, source: {source})")
            
    except Exception as e:
        print(f"Error reading {filename}: {e}")

# Check both files
check_file('test-result-1.json')
check_file('test-result-2.json')
