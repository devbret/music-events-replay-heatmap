import json
import re
from collections import defaultdict

INPUT_FILE = "event.json"
OUTPUT_FILE = "events_timeline.json"

MONTH_RE = re.compile(r"^(\d{4}-(?:0[1-9]|1[0-2]))")


def parse_month(date_str: str):
    if not date_str:
        return None

    match = MONTH_RE.match(date_str)
    return match.group(1) if match else None


def find_held_at_place(event: dict):
    rels = event.get("relations") or []
    if not isinstance(rels, list):
        return None

    for rel in rels:
        if not isinstance(rel, dict):
            continue
        if rel.get("type") == "held at" and rel.get("target-type") == "place":
            place = rel.get("place")
            if isinstance(place, dict):
                return place
    return None


def extract_lat_lng(place: dict):
    if not place:
        return None, None
    coords = place.get("coordinates")
    if not isinstance(coords, dict):
        return None, None
    lat = coords.get("latitude")
    lng = coords.get("longitude")
    if lat is None or lng is None:
        return None, None
    try:
        return round(float(lat), 5), round(float(lng), 5)
    except Exception:
        return None, None


def extract_city_country(place: dict):
    city = None
    country = None

    area = place.get("area")
    if isinstance(area, dict):
        city = area.get("name")

        iso1 = area.get("iso-3166-1-codes")
        if isinstance(iso1, list) and iso1:
            country = iso1[0]

        if not country:
            iso2 = area.get("iso-3166-2-codes")
            if isinstance(iso2, list) and iso2:
                country = iso2[0]

    return city, country


def iter_ndjson(path: str):
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                yield json.loads(line)
            except json.JSONDecodeError:
                continue


def main():
    timeline = defaultdict(list)
    total_processed = 0
    total_skipped = 0
    total_read = 0

    for event in iter_ndjson(INPUT_FILE):
        total_read += 1

        if not isinstance(event, dict):
            total_skipped += 1
            continue

        event_id = event.get("id")
        name = event.get("name")

        life_span = event.get("life-span") or {}
        begin_date = life_span.get("begin")
        month_key = parse_month(begin_date)

        if not month_key:
            total_skipped += 1
            continue

        place = find_held_at_place(event)
        lat, lng = extract_lat_lng(place or {})
        if lat is None or lng is None:
            total_skipped += 1
            continue

        city, country = extract_city_country(place or {})
        venue = (place or {}).get("name")

        timeline[month_key].append({
            "id": event_id,
            "name": name,
            "lat": lat,
            "lng": lng,
            "city": city,
            "country": country,
            "venue": venue,
            "date": begin_date[:10] if isinstance(begin_date, str) else None,
        })

        total_processed += 1

    sorted_months = sorted(timeline.keys())

    output = {
        "meta": {
            "total_lines_read": total_read,
            "total_events": total_processed,
            "total_months": len(sorted_months),
            "start_month": sorted_months[0] if sorted_months else None,
            "end_month": sorted_months[-1] if sorted_months else None,
            "skipped": total_skipped,
        },
        "timeline": [{"month": m, "events": timeline[m]} for m in sorted_months],
    }

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(output, f, separators=(",", ":"))

    print(f"Read lines: {total_read}")
    print(f"Processed events: {total_processed}")
    print(f"Skipped events: {total_skipped}")
    print(f"Wrote: {OUTPUT_FILE}")


if __name__ == "__main__":
    main()