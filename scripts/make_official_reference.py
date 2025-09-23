#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Build a frozen Diablo II: Resurrected Holy Grail reference list."""

from __future__ import annotations
from scripts.d2_holy_grail_scraper import (  # type: ignore  # runtime import
    CacheConfig,
    FANDOM_BASE,
    PAGE_TITLES,
    RUNE_LIST_URL,
    explode_rainbow_facet,
    parse_all_set_items,
    parse_all_uniques,
    parse_runes,
)

import json
import sys
import time
from collections import Counter
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))


def main(include_sunders=True, facet_variants=True):
    """Generate the frozen reference dataset from the live scraper."""

    cache_cfg = CacheConfig(
        dir=Path(".cache_ref"),
        ttl_hours=720,
        refresh=True,  # force fresh scrape
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

    totals = Counter(row.get("category", "Unknown") for row in rows)
    unique_tiers = Counter(
        (row.get("tier") or "Unknown")
        for row in rows
        if row.get("category") == "Unique"
    )

    # Normalise empty tier strings to "Unknown" for reporting
    clean_unique_tiers = {
        tier or "Unknown": count for tier, count in unique_tiers.items()
    }

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
                "Runes: 33 (El..Zod).",
            ],
            "options": {
                "include_sunders": include_sunders,
                "facet_variants": facet_variants,
            },
            "summary": {
                "category_counts": dict(totals),
                "unique_tiers": clean_unique_tiers,
            },
        },
        "items": rows,
    }

    out_path = Path("official_reference.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)

    print(f"[✓] Wrote {out_path} with {len(rows)} items")


if __name__ == "__main__":
    main(include_sunders=True, facet_variants=True)
