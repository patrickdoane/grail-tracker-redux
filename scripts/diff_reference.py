#!/usr/bin/env python3
"""Quick comparison between the working grail dataset and an official reference.

Usage:
  python scripts/diff_reference.py \
      --current holy_grail_items.json \
      --reference official_reference.json

Outputs a readable summary of missing/extra items and field-level deltas.
"""

from __future__ import annotations

import argparse
import json
from collections import Counter
from pathlib import Path
from typing import Any, Dict, Iterable, Tuple

KEY_FIELDS = (
    "name",
    "category",
    "subcategory",
    "set_name",
    "tier",
    "variant",
    "source_url",
)


def load_items(path: Path) -> list[Dict[str, Any]]:
    """Load item dictionaries from a JSON file or payload wrapper."""

    data = json.loads(path.read_text(encoding="utf-8"))
    if isinstance(data, dict) and "items" in data:
        return data["items"]
    if isinstance(data, list):
        return data
    raise ValueError(f"Unrecognised JSON structure in {path}")


def index_by_name(items: Iterable[Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
    """Index item dictionaries by lower-cased name."""

    idx: Dict[str, Dict[str, Any]] = {}
    for it in items:
        key = it.get("name", "").strip()
        if not key:
            continue
        idx[key.lower()] = it
    return idx


def compare(
    current: Dict[str, Dict[str, Any]], reference: Dict[str, Dict[str, Any]]
) -> Tuple[set[str], set[str], Dict[str, Dict[str, Tuple[Any, Any]]]]:
    """Compare two item maps and return missing/extra/delta details."""

    current_names = set(current.keys())
    reference_names = set(reference.keys())

    missing = reference_names - current_names
    extra = current_names - reference_names

    diffs: Dict[str, Dict[str, Tuple[Any, Any]]] = {}
    for name in sorted(current_names & reference_names):
        cur = current[name]
        ref = reference[name]
        field_deltas: Dict[str, Tuple[Any, Any]] = {}
        for field in KEY_FIELDS:
            cur_val = cur.get(field)
            ref_val = ref.get(field)
            if (cur_val or None) != (ref_val or None):
                field_deltas[field] = (cur_val, ref_val)
        if field_deltas:
            diffs[name] = field_deltas
    return missing, extra, diffs


def summarize_counts(items: Dict[str, Dict[str, Any]]) -> Counter:
    """Summarise category counts for quick at-a-glance totals."""

    c = Counter()
    for it in items.values():
        c[it.get("category", "Unknown")] += 1
    return c


def format_section(title: str, entries: Iterable[str]) -> str:
    """Format a bullet-style summary for missing/extra sections."""

    entries = list(entries)
    if not entries:
        return f"- {title}: none\n"
    preview = ", ".join(sorted(entries)[:10])
    suffix = "" if len(entries) <= 10 else f" (+{len(entries)-10} more)"
    return f"- {title}: {preview}{suffix}\n"


def main() -> None:
    """CLI entry point for diffing Holy Grail JSON exports."""

    ap = argparse.ArgumentParser(description="Compare two Holy Grail JSON exports.")
    ap.add_argument("--current", type=Path, default=Path("holy_grail_items.json"))
    ap.add_argument("--reference", type=Path, default=Path("official_reference.json"))
    args = ap.parse_args()

    current_items = load_items(args.current)
    reference_items = load_items(args.reference)

    current_idx = index_by_name(current_items)
    reference_idx = index_by_name(reference_items)

    missing, extra, diffs = compare(current_idx, reference_idx)

    current_counts = summarize_counts(current_idx)
    reference_counts = summarize_counts(reference_idx)

    lines = []
    lines.append(
        f"Comparing {args.current} ({len(current_idx)} uniques) vs {args.reference} ({len(reference_idx)} uniques)\n"
    )
    lines.append("Category counts:")
    for cat in sorted(set(current_counts) | set(reference_counts)):
        lines.append(
            f"  {cat}: current={current_counts.get(cat, 0)}, reference={reference_counts.get(cat, 0)}"
        )
    lines.append("")
    lines.append(
        format_section(
            "Missing items", (reference_idx[name]["name"] for name in missing)
        )
    )
    lines.append(
        format_section("Extra items", (current_idx[name]["name"] for name in extra))
    )

    if diffs:
        lines.append(f"- Differing metadata ({len(diffs)} items):")
        for name, delta in list(diffs.items())[:10]:
            pretty = ", ".join(
                f"{field}={cur!r}!={ref!r}" for field, (cur, ref) in delta.items()
            )
            lines.append(f"    {reference_idx[name]['name']}: {pretty}")
        if len(diffs) > 10:
            lines.append(f"    ...and {len(diffs)-10} more")
    else:
        lines.append("- Differing metadata: none")

    print("\n".join(lines))


if __name__ == "__main__":
    main()
