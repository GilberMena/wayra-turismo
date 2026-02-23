import json
import os
import re

def get_data(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def clean_price(price_str):
    if not price_str: return 0
    return int(re.sub(r'[^\d]', '', price_str))

def analyze_all():
    base_path = r'c:\Users\Huawei\OneDrive\Documentos\wayra\data'
    hotels_data = get_data(os.path.join(base_path, 'hotels.json'))['hotels']
    planes_data = get_data(os.path.join(base_path, 'planes.json'))['planes']
    experiences_data = get_data(os.path.join(base_path, 'experiences.json'))['experiences']
    
    # 1. Hotel Completeness
    hotel_stats = []
    for h in hotels_data:
        has_desc = bool(h.get('description'))
        has_image = bool(h.get('coverImage'))
        has_wa = bool(h.get('waText'))
        tags_count = len(h.get('tags', []))
        hotel_stats.append({
            "name": h.get('name'),
            "completeness": sum([has_desc, has_image, has_wa]) / 3.0,
            "tags_count": tags_count
        })

    # 2. Price Analysis for Plans
    prices = [clean_price(p.get('price')) for p in planes_data if p.get('price')]
    price_stats = {
        "min": min(prices) if prices else 0,
        "max": max(prices) if prices else 0,
        "avg": sum(prices) / len(prices) if prices else 0
    }

    # 3. Correlation between Experiences and Hotel Tags
    all_tags = set()
    for h in hotels_data:
        for t in h.get('tags', []):
            all_tags.add(t)
    
    exp_titles = [e.get('title') for e in experiences_data]
    
    analysis = {
        "hotel_completeness": hotel_stats,
        "plan_price_stats": price_stats,
        "total_experiences": len(experiences_data),
        "total_plans": len(planes_data),
        "unique_hotel_tags": len(all_tags)
    }
    
    return analysis

if __name__ == "__main__":
    import sys
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    
    results = analyze_all()
    print(json.dumps(results, indent=2, ensure_ascii=False))
