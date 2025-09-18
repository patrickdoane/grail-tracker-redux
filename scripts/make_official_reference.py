#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Builds a frozen Diablo II: Resurrected Holy Grail reference list
containing every Unique, Set piece, and Rune.
Outputs: official_reference.json (items array with metadata)
"""

import json, time
from pathlib import Path

# import your existing scraper’s functions:
#   parse_all_set_items, parse_all_uniques, parse_runes, explode_rainbow_facet
#   CacheConfig, soup_from_page_title, etc.
from d2_holy_grail_scraper import (
    CacheConfig, parse_all_set_items, parse_all_uniques,
    parse_runes, explode_rainbow_facet, FANDOM_BASE, PAGE_TITLES, RUNE_LIST_URL
)

def main(include_sunders=True, facet_variants=True):
    cache_cfg = CacheConfig(
        dir=Path(".cache_ref"),
        ttl_hours=720,
        refresh=True,    # force fresh scrape
        delay_sec=0.7,
    )

    rows = []

    # Sets
    sets = parse_all_set_items(cache_cfg)
    rows.extend(sets)

    # Uniques
    uniques = parse_all_uniques(cache_cfg)
    if facet_variants:
        uniques = explode_rainbow_facet(uniques)
    if not include_sunders:
        uniques = [u for u in uniques if "sunder charm" not in u["name"].lower()]
    rows.extend(uniques)

    # Runes
    runes = parse_runes(cache_cfg)
    rows.extend(runes)

    payload = {
        "meta": {
            "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "sources": {
                "fandom_base": FANDOM_BASE,
                "pages": PAGE_TITLES,
                "runes": RUNE_LIST_URL,
            },
            "notes": [
                "Uniques: 385 if excluding Sunder charms; 391 if including.",
                "Includes 8 Rainbow Facet variants separately.",
                "Sets: 32 sets / 127 pieces.",
                "Runes: 33 (El..Zod)."
            ],
            "options": {
                "include_sunders": include_sunders,
                "facet_variants": facet_variants,
            }
        },
        "items": rows
    }

    out_path = Path("official_reference.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)

    print(f"[✓] Wrote {out_path} with {len(rows)} items")

if __name__ == "__main__":
    main(include_sunders=True, facet_variants=True)
