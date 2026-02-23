import json
import os

def analyze_hotels(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    hotels = data.get('hotels', [])
    total_hotels = len(hotels)
    
    categories = {}
    stars = {}
    locations = {}
    tags_count = {}
    
    for hotel in hotels:
        cat = hotel.get('category', 'Unknown')
        categories[cat] = categories.get(cat, 0) + 1
        
        star = hotel.get('stars', 'Unknown')
        stars[star] = stars.get(star, 0) + 1
        
        loc = hotel.get('location', 'Unknown')
        locations[loc] = locations.get(loc, 0) + 1
        
        tags = hotel.get('tags', [])
        for tag in tags:
            tags_count[tag] = tags_count.get(tag, 0) + 1
            
    analysis = {
        "total_hotels": total_hotels,
        "categories": categories,
        "stars": stars,
        "locations": locations,
        "top_tags": dict(sorted(tags_count.items(), key=lambda item: item[1], reverse=True)[:10])
    }
    
    return analysis

if __name__ == "__main__":
    import sys
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    
    hotels_path = r'c:\Users\Huawei\OneDrive\Documentos\wayra\data\hotels.json'
    if os.path.exists(hotels_path):
        results = analyze_hotels(hotels_path)
        print(json.dumps(results, indent=2, ensure_ascii=False))
    else:
        print(f"File not found: {hotels_path}")
