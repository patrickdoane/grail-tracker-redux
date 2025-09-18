#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Diablo II Holy Grail scraper (Uniques, Sets, optional Runes)
- Pulls Fandom pages via MediaWiki API to avoid 403s
- Retries + backoff, polite delay, and on-disk caching
- Emits JSON + CSV

CLI:
  pip install requests beautifulsoup4 lxml
  python scripts/d2_holy_grail_scraper.py --out-json holy_grail_items.json --out-csv holy_grail_items.csv --include-runes

Flags:
  --refresh               Ignore cache and fetch fresh
  --cache-ttl-hours N     Consider cache fresh for N hours (default: 720 = 30 days)
  --delay SECONDS         Polite delay between API calls (default: 0.5)
  --include-runes         Include 33 runes (El..Zod)
  --facet-variants        Track 8 Rainbow Facet variants instead of counting it once
"""

import argparse
import csv
import json
import os
import re
import sys
import time
import random
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Iterable, List, Optional
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# ----------------------------
# Config
# ----------------------------
FANDOM_BASE = "https://diablo.fandom.com/"
FANDOM_WIKI_PREFIX = urljoin(FANDOM_BASE, "wiki/")
FANDOM_API = urljoin(FANDOM_BASE, "api.php")

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                  "AppleWebKit/537.36 (KHTML, like Gecko) "
                  "Chrome/122.0 Safari/537.36 D2GrailScraper/2.0",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Referer": "https://www.google.com/",
}

# Canonical Fandom page titles (MediaWiki page titles, not percent-encoded URLs)
PAGE_TITLES = {
    "sets": "List_of_Set_Items_(Diablo_II)",
    "unique_armor_hub": "Unique_Armor",
    "unique_weapons_hub": "Unique_Weapons",
    "unique_rings": "List_of_Unique_Rings_(Diablo_II)",
    "unique_amulets": "List_of_Unique_Amulets_(Diablo_II)",
    "unique_charms": "Unique_Charms",                  # includes Sunder charms (D2R)
    "unique_jewels": "List_of_Unique_Jewels",          # Rainbow Facet page
}

# Optional rune list source (falls back to canonical list on any error)
RUNE_LIST_URL = "https://diablo2.diablowiki.net/Rune_list"

UNIQUES_EXCLUDE_TERMS = {
    # headers / mechanics / categories that showed up in your JSON
    "item name","required level","rarity","defense","required strength","durability",
    "chance to block","range","ladder only",
    "rings","amulets","jewels","helms","body armor","shields","belts","boots","gloves",
    "axes","bows","crossbows","daggers","javelins","katars","maces","polearms","spears",
    "staves","swords","orbs","circlets","barbarian","druid","necromancer","paladin","amazon","assassin",
    # random table labels that slipped in
    "two-hand damage","two-handdamage","requireddexterity","requireddexterity","smitedamage",
    "potion boxes","8 potion boxes","12 potion boxes","16 potion boxes",
}

RUNE_RE = re.compile(r"^(Eld|El|Tir|Nef|Eth|Ith|Tal|Ral|Ort|Thul|Amn|Sol|Shael|Dol|Hel|Io|Lum|Ko|Fal|Lem|Pul|Um|Mal|Ist|Gul|Vex|Ohm|Lo|Sur|Ber|Jah|Cham|Zod)\b", re.I)

# ----------------------------
# Session & Cache
# ----------------------------
def make_session() -> requests.Session:
    s = requests.Session()
    retries = Retry(
        total=5,
        backoff_factor=0.8,
        status_forcelist=(429, 500, 502, 503, 504),
        allowed_methods=frozenset(["GET"]),
        raise_on_status=False,
    )
    s.mount("https://", HTTPAdapter(max_retries=retries))
    s.headers.update(HEADERS)
    return s

SESSION = make_session()

@dataclass
class CacheConfig:
    dir: Path
    ttl_hours: int
    refresh: bool
    delay_sec: float

def ensure_cache_dir(path: Path):
    path.mkdir(parents=True, exist_ok=True)

def cache_file_for_title(cache_dir: Path, page_title: str, suffix: str = ".html") -> Path:
    safe = re.sub(r"[^A-Za-z0-9_.()-]", "_", page_title)
    return cache_dir / f"{safe}{suffix}"

def is_fresh(p: Path, ttl_hours: int) -> bool:
    if not p.exists():
        return False
    age_sec = time.time() - p.stat().st_mtime
    return age_sec < ttl_hours * 3600

def fandom_api_html(page_title: str, cache_cfg: CacheConfig) -> str:
    """
    Get rendered HTML via MediaWiki API (action=parse&prop=text).
    Uses cache when available/fresh.
    """
    ensure_cache_dir(cache_cfg.dir)
    cache_path = cache_file_for_title(cache_cfg.dir, page_title)

    if not cache_cfg.refresh and is_fresh(cache_path, cache_cfg.ttl_hours):
        return cache_path.read_text(encoding="utf-8")

    # Polite delay between network calls
    if cache_cfg.delay_sec > 0:
        time.sleep(cache_cfg.delay_sec)

    params = {"action": "parse", "page": page_title, "prop": "text", "format": "json"}
    r = SESSION.get(FANDOM_API, params=params, timeout=30)
    r.raise_for_status()
    data = r.json()
    html = data.get("parse", {}).get("text", {}).get("*")
    if not html:
        raise RuntimeError(f"MediaWiki API returned no HTML for page {page_title}")

    cache_path.write_text(html, encoding="utf-8")
    return html

def _jittered_sleep(base: float):
    if base > 0:
        # ±30% jitter to avoid repeated identical intervals
        time.sleep(base * random.uniform(0.7, 1.3))

def fandom_api_parse_html(page_title: str, cache_cfg: CacheConfig) -> str:
    """Primary path: rendered HTML via action=parse (prop=text)."""
    ensure_cache_dir(cache_cfg.dir)
    cache_path = cache_file_for_title(cache_cfg.dir, page_title, suffix=".html")

    if not cache_cfg.refresh and is_fresh(cache_path, cache_cfg.ttl_hours):
        return cache_path.read_text(encoding="utf-8")

    _jittered_sleep(cache_cfg.delay_sec)
    params = {
        "action": "parse",
        "page": page_title,
        "prop": "text",
        "format": "json",
        "origin": "*",
        "redirects": 1,
    }
    r = SESSION.get(FANDOM_API, params=params, timeout=30)
    r.raise_for_status()
    data = r.json()
    html = data.get("parse", {}).get("text", {}).get("*")
    if not html:
        raise RuntimeError(f"MediaWiki API returned no HTML for page {page_title}")
    cache_path.write_text(html, encoding="utf-8")
    return html

def fandom_api_query_wikitext(page_title: str, cache_cfg: CacheConfig) -> str:
    """Fallback path: wikitext via action=query (prop=revisions)."""
    ensure_cache_dir(cache_cfg.dir)
    cache_path = cache_file_for_title(cache_cfg.dir, page_title, suffix=".wikitext")

    if not cache_cfg.refresh and is_fresh(cache_path, cache_cfg.ttl_hours):
        return cache_path.read_text(encoding="utf-8")

    _jittered_sleep(cache_cfg.delay_sec)
    params = {
        "action": "query",
        "prop": "revisions",
        "rvslots": "*",
        "rvprop": "content",
        "titles": page_title,
        "format": "json",
        "origin": "*",
        "redirects": 1,
    }
    r = SESSION.get(FANDOM_API, params=params, timeout=30)
    r.raise_for_status()
    data = r.json()
    pages = data.get("query", {}).get("pages", {})
    if not pages:
        raise RuntimeError(f"MediaWiki API returned no pages for {page_title}")
    # Any pageid key; Fandom uses numeric IDs
    (_, page_obj), = pages.items()
    revs = page_obj.get("revisions", [])
    if not revs:
        raise RuntimeError(f"No revisions/content for {page_title}")
    # Modern MW stores content in slots
    slot = revs[0].get("slots", {}).get("main", {})
    wikitext = slot.get("*") or slot.get("content") or ""
    if not wikitext:
        raise RuntimeError(f"No wikitext content for {page_title}")
    cache_path.write_text(wikitext, encoding="utf-8")
    return wikitext

def soup_from_page_title(page_title: str, cache_cfg: CacheConfig) -> BeautifulSoup:
    """Now uses HTML parse, with automatic fallback to wikitext→HTML-lite."""
    try:
        html = fandom_api_parse_html(page_title, cache_cfg)
        return BeautifulSoup(html, "lxml")
    except requests.HTTPError as e:
        # 403/429 → try wikitext
        if e.response is not None and e.response.status_code in (403, 429):
            wt = fandom_api_query_wikitext(page_title, cache_cfg)
            # Minimal conversion: wrap as pre so downstream selectors don't crash
            return BeautifulSoup(f"<pre class='wikitext'>{BeautifulSoup(wt, 'lxml').get_text()}</pre>", "lxml")
        raise

def wiki_url(page_title: str) -> str:
    return urljoin(FANDOM_WIKI_PREFIX, page_title)

def _header_item_col_index(table) -> int | None:
    """Return the column index that holds the item names, based on the header row."""
    # Look through the first few rows that have <th>
    for tr in table.find_all("tr"):
        ths = tr.find_all("th")
        if not ths:
            continue
        labels = [th.get_text(" ", strip=True).lower() for th in ths]
        # direct hits (prefer explicit "item name"/"name" columns over generic "item")
        for target in ("item name", "name", "item"):
            for i, lab in enumerate(labels):
                if lab == target:
                    return i
        # many pages name the first column by the gear type; treat that col as the name col
        for i, lab in enumerate(labels):
            if any(word in lab for word in (
                "ring","amulet","jewel","helm","circlet","body armor","armor","shield",
                "belt","boots","gloves","orb","barbarian","druid","necromancer","paladin",
                "amazon","assassin","axe","bow","crossbow","dagger","javelin","katar",
                "mace","polearm","spear","staff","stave","sword"
            )):
                return i
        # keep checking other header rows (some tables have subtables)
    return None  # we'll fall back to col 0 later

def _is_generic_link(a) -> bool:
    """Filter out category/mechanics links and obvious non-item cells."""
    txt = (a.get_text(" ", strip=True) or "").lower()
    if txt in UNIQUES_EXCLUDE_TERMS:
        return True
    href = a.get("href", "")
    # ignore category/overview/list pages
    if any(x in href for x in ("/Category:", "Category:", "List_of_")):
        return True
    # ignore very generic mechanics pages that are never item pages
    if any(x in href for x in ("/wiki/Defense", "/wiki/Durability", "/wiki/Range", "/wiki/Smite")):
        return True
    return False

# ----------------------------
# Parsing helpers
# ----------------------------
def extract_title_text(a_tag) -> str:
    txt = (a_tag.get_text() or "").strip()
    txt = re.sub(r"\s+\[\d+\]$", "", txt)  # drop footnote markers
    return txt

def infer_subcategory_from_title(soup: BeautifulSoup) -> str:
    title = (soup.find("h1").get_text() if soup.find("h1") else "").strip()
    m = re.search(r"Unique\s+([A-Za-z ]+)", title)
    if m:
        return m.group(1).strip()
    for key in ("Charms", "Rings", "Amulets", "Jewels"):
        if key in title:
            return key
    return title or "Unknown"

BASE_TYPE_EXCLUDES = {
    "ring", "amulet", "grand charm", "small charm", "large charm",
    "short sword", "sabre", "falchion", "broad sword", "long sword",
    "war sword", "two-handed sword", "claymore", "giant sword", "bastard sword",
}

BASE_TYPE_EXCLUDES.update({
    # bows
    "short bow", "hunter's bow", "long bow", "composite bow", "short battle bow",
    "long battle bow", "short war bow", "long war bow",
    # polearms (examples)
    "bardiche", "voulge", "scythe", "poleaxe", "halberd", "war scythe",
    "partizan", "bec-de-corbin", "grim scythe",
})

_LINK_RE = re.compile(r"\[\[([^\]|#]+)(?:\|[^\]]+)?\]\]")

_TEMPLATE_TEXT_RE = re.compile(r"\{\{[^|{}]*\|([^{}|]+)(?:\|[^{}]*)?\}\}")


def _table_header_labels(table) -> Dict[int, str]:
    labels: Dict[int, str] = {}
    for tr in table.find_all("tr"):
        ths = tr.find_all("th")
        if not ths:
            continue
        for idx, th in enumerate(ths):
            labels[idx] = th.get_text(" ", strip=True).lower()
        if labels:
            break
    return labels


def _extract_base_type_from_cell(cell, unique_name: str) -> Optional[str]:
    """Attempt to pull the base item type from a table cell."""
    primary = (unique_name or "").strip().lower()

    # Prefer the next anchor in the cell that isn't the unique name itself
    for idx, link in enumerate(cell.find_all("a", href=True)):
        label = extract_title_text(link)
        if not label:
            continue
        if idx == 0 and label.strip().lower() == primary:
            continue
        if label.strip().lower() == primary:
            continue
        return label.strip()

    # Fallback to text fragments split on line breaks
    for part in cell.get_text("\n", strip=True).split("\n"):
        cleaned = part.strip()
        if not cleaned:
            continue
        if cleaned.lower() == primary:
            continue
        return cleaned

    return None

def _wikitext_tables(wt: str) -> list[tuple[list[str], Optional[str]]]:
    """Split wikitext into table blocks and track the active tier heading."""
    blocks: list[tuple[list[str], Optional[str]]] = []
    cur: list[str] = []
    in_table = False
    current_tier: Optional[str] = None
    table_tier: Optional[str] = None
    for raw_line in wt.splitlines():
        line = raw_line.rstrip()
        stripped = line.strip()
        if stripped.startswith("==") and stripped.endswith("=="):
            tier = _tier_from_text(stripped.strip("=").strip())
            current_tier = tier
        if line.startswith("{|"):
            in_table = True
            cur = [line]
            table_tier = current_tier
            continue
        if in_table:
            cur.append(line)
            if line.startswith("|}"):
                in_table = False
                blocks.append((cur, table_tier))
                cur = []
                table_tier = None
    return blocks

def _wikitext_item_col_idx(lines: list[str]) -> int | None:
    """Find the header row ('!' cells) and locate the item-name column index."""
    for ln in lines:
        if ln.lstrip().startswith("!"):  # header row
            # split headers like: ! Item Name || Rarity || Required Level
            headers = [h.strip().strip("! ").lower() for h in re.split(r"\|\|", ln)]
            for target in ("item name", "name", "item"):
                for i, lab in enumerate(headers):
                    if lab == target:
                        return i
            for i, lab in enumerate(headers):
                if any(w in lab for w in (
                    "ring","amulet","jewel","helm","circlet","armor","shield","belt","boots","gloves",
                    "axe","bow","crossbow","dagger","javelin","katar","mace","polearm","spear","staff","stave","sword",
                    "orb","barbarian","druid","necromancer","paladin","amazon","assassin"
                )):
                    return i
    return None

def _parse_uniques_from_wikitext(wikitext: str, category_hint: Optional[str], source_url: str) -> list[dict]:
    out = []
    for tbl, table_tier in _wikitext_tables(wikitext):
        name_col = _wikitext_item_col_idx(tbl)
        if name_col is None:
            name_col = 0
        # iterate rows
        row: list[str] = []
        current_tier = table_tier
        for ln in tbl:
            if ln.startswith("|-"):
                if row:
                    out.extend(_emit_from_wt_row(row, name_col, category_hint, source_url, current_tier))
                row = []
                continue
            stripped = ln.strip()
            if stripped.startswith("!") and "colspan" in stripped:
                tier_candidate = _tier_from_text(stripped)
                if tier_candidate:
                    current_tier = tier_candidate
                continue
            row.append(ln)
        if row:
            out.extend(_emit_from_wt_row(row, name_col, category_hint, source_url, current_tier))

    # dedup by name
    seen = set(); dedup = []
    for it in out:
        k = it["name"].lower()
        if k not in seen:
            seen.add(k); dedup.append(it)
    return dedup

def _emit_from_wt_row(lines: list[str], name_col: int, category_hint: Optional[str], source_url: str, tier: Optional[str]) -> list[dict]:
    # Combine, split cells on '||'
    text = "\n".join(lines)
    # Grab lines that begin with '|' and have cells
    cells = []
    for ln in text.splitlines():
        if ln.startswith("|") and not ln.startswith("|-"):
            # strip leading '|' and split
            parts = re.split(r"\|\|", ln.lstrip("|").strip())
            cells.extend([p.strip() for p in parts if p.strip()])
    if not cells:
        return []
    if name_col >= len(cells):
        return []
    cell_html = cells[name_col] or ""
    link_names = [m.strip() for m in _LINK_RE.findall(cell_html)]
    template_names = [m.strip() for m in _TEMPLATE_TEXT_RE.findall(cell_html)]

    name = None
    if link_names:
        name = link_names[0]
    elif template_names:
        name = template_names[0]
    if not name:
        return []
    if name.lower() in UNIQUES_EXCLUDE_TERMS:
        return []

    base_type = None
    candidates: list[str] = []
    for cand in link_names[1:]:
        if cand.lower() != name.lower():
            candidates.append(cand)
    for cand in template_names:
        if cand.lower() != name.lower():
            candidates.append(cand)
    if candidates:
        base_type = candidates[0]

    if not base_type:
        for part in re.split(r"<br\s*/?>", cell_html):
            cleaned = BeautifulSoup(part, "lxml").get_text(strip=True)
            if cleaned and cleaned.lower() != name.lower():
                base_type = cleaned
                break

    return [{
        "name": name,
        "category": "Unique",
        "subcategory": base_type or category_hint or "Unknown",
        "tier": tier or "",
        "source_url": source_url,
    }]

def parse_unique_table_like_page(page_title: str, cache_cfg: CacheConfig, category_hint: Optional[str] = None) -> list[dict]:
    soup = soup_from_page_title(page_title, cache_cfg)
    content = soup

    # If we got wikitext fallback (see part 2), bail to the wikitext parser
    pre = content.find("pre", {"class": "wikitext"})
    if pre:
        return _parse_uniques_from_wikitext(pre.get_text(), category_hint, wiki_url(page_title))

    items: list[dict] = []
    header_labels_cache: Dict[int, str] = {}
    for table in content.find_all("table"):
        # identify the name column
        name_col = _header_item_col_index(table)
        if name_col is None:
            name_col = 0  # sane fallback

        header_labels_cache = _table_header_labels(table)
        table_tier = _nearest_tier_for(table)
        current_tier = table_tier

        for tr in table.find_all("tr"):
            # adjust tier when tables embed their own section headers
            ths = tr.find_all("th")
            if ths and not tr.find_all("td"):
                tier_candidate = _tier_from_text(" ".join(th.get_text(" ", strip=True) for th in ths))
                if tier_candidate:
                    current_tier = tier_candidate
                continue

            tds = tr.find_all("td")
            if not tds:  # skip header-only rows
                continue
            if name_col >= len(tds):
                continue
            cell = tds[name_col]
            a = cell.find("a", href=True)
            if not a or _is_generic_link(a):
                continue
            name = extract_title_text(a)
            # basic sanitation
            norm = (name or "").strip()
            if not norm or norm.lower() in UNIQUES_EXCLUDE_TERMS:
                continue

            base_type = _extract_base_type_from_cell(cell, norm)

            if not base_type:
                for idx, td in enumerate(tds):
                    if idx == name_col:
                        continue
                    label = header_labels_cache.get(idx, "")
                    if not label:
                        continue
                    if any(key in label for key in ("base", "item type", "weapon type", "armor type", "type")):
                        fallback = _extract_base_type_from_cell(td, norm)
                        if fallback:
                            base_type = fallback
                            break

            items.append({
                "name": norm,
                "category": "Unique",
                "subcategory": base_type or category_hint or infer_subcategory_from_title(content),
                "tier": current_tier or "",
                "source_url": wiki_url(page_title),
            })

    # Fallback for pages like Unique Charms/Jewels that aren’t true wikitables
    if not items:
        for h in content.find_all(["h2","h3"]):
            block = []
            for sib in h.find_all_next():
                if sib.name in {"h2","h3"}:
                    break
                block.append(str(sib))
            block_soup = BeautifulSoup("".join(block), "lxml")
            for strong in block_soup.find_all(["b","strong"]):
                txt = (strong.get_text(" ", strip=True) or "").strip()
                if txt and txt.lower() not in UNIQUES_EXCLUDE_TERMS:
                    items.append({
                        "name": txt,
                        "category": "Unique",
                        "subcategory": category_hint or infer_subcategory_from_title(content),
                        "tier": "",
                        "source_url": wiki_url(page_title),
                    })

        # dedup
        seen = set(); dedup = []
        for it in items:
            k = it["name"].lower()
            if k not in seen:
                seen.add(k); dedup.append(it)
        items = dedup

    return items

def discover_unique_subpages(hub_title: str, cache_cfg: CacheConfig) -> List[str]:
    soup = soup_from_page_title(hub_title, cache_cfg)
    content = soup
    prefer_d2, others = set(), set()

    for a in content.find_all("a", href=True):
        href = a["href"]
        if href.startswith("/wiki/"):
            sub_title = href.split("/wiki/")[-1]
        elif href.startswith(FANDOM_WIKI_PREFIX):
            sub_title = href.split(FANDOM_WIKI_PREFIX)[-1]
        else:
            continue

        if "List_of_Unique" in sub_title:
            if "(Diablo_II)" in sub_title:
                prefer_d2.add(sub_title)
            else:
                others.add(sub_title)

    # Prefer D2-specific pages; if a weapon family only exists as generic, include it
    out = sorted(prefer_d2) + [t for t in sorted(others) if not any(t.startswith(x.split("(")[0]) for x in prefer_d2)]
    return out

# ----------------------------
# Top-level parsers
# ----------------------------
def parse_all_uniques(cache_cfg: CacheConfig) -> List[Dict]:
    collected: List[Dict] = []
    visited_titles = set()

    # Direct pages (no drilldown needed)
    direct_pages = [
        PAGE_TITLES["unique_rings"],
        PAGE_TITLES["unique_amulets"],
        PAGE_TITLES["unique_charms"],
        PAGE_TITLES["unique_jewels"],
    ]
    for title in direct_pages:
        try:
            items = parse_unique_table_like_page(title, cache_cfg)
            collected.extend(items)
            visited_titles.add(title)
        except Exception as e:
            print(f"[warn] Failed to parse direct unique page: {title} ({e})", file=sys.stderr)

    # Discover from hubs
    for hub_title in (PAGE_TITLES["unique_armor_hub"], PAGE_TITLES["unique_weapons_hub"]):
        try:
            subpages = discover_unique_subpages(hub_title, cache_cfg)
            for sp in subpages:
                if sp in visited_titles:
                    continue
                # Only scrape Diablo II list pages or specific 'Unique_*' lists that contain tables
                if "(Diablo_II)" not in sp and "List_of_Unique" not in sp:
                    continue
                try:
                    items = parse_unique_table_like_page(sp, cache_cfg)
                    if items:
                        collected.extend(items)
                        visited_titles.add(sp)
                except Exception as e:
                    print(f"[warn] Failed to parse uniques subpage: {sp} ({e})", file=sys.stderr)
        except Exception as e:
            print(f"[warn] Failed to discover from hub: {hub_title} ({e})", file=sys.stderr)

    # Deduplicate by name (case-insensitive)
    dedup: Dict[str, Dict] = {}
    for it in collected:
        key = it["name"].strip().lower()
        if key not in dedup:
            dedup[key] = it
    return list(dedup.values())

def _tier_from_text(text: str) -> str | None:
    """Map a heading-like string to a gear tier."""
    txt = (text or "").lower()
    if "normal" in txt:
        return "Normal"
    if "exceptional" in txt or "exeptional" in txt:
        return "Exceptional"
    if "elite" in txt:
        return "Elite"
    return None


def _nearest_tier_for(node) -> str | None:
    """Walk backwards from `node` to find the last h2/h3 and map to tier."""
    for prev in node.find_all_previous(["h2", "h3"]):
        tier = _tier_from_text(prev.get_text(" ", strip=True) or "")
        if tier:
            return tier
    return None

def _parse_set_section(h, tier_label, source_url):
    """
    Fallback parser for the older layout:
      <p><a>Set Name</a></p> then the next sibling UL is the pieces list.
    Kept from previous patch in case the page flips back.
    """
    def _iter_section_nodes(h):
        for sib in h.next_siblings:
            name = getattr(sib, "name", None)
            if name in {"h2", "h3"}:
                break
            if not name:
                continue
            yield sib

    def _first_ul_after(node):
        ul = node.find_next_sibling(["ul", "ol"])
        if ul:
            return ul
        for sib in node.next_siblings:
            if getattr(sib, "name", None) in {"h2", "h3"}:
                break
            if getattr(sib, "name", None) in {"ul", "ol"}:
                return sib
        return None

    results = []
    seen_sets = set()
    for block in _iter_section_nodes(h):
        anchors = block.find_all("a", href=True)
        if not anchors:
            continue
        for a in anchors:
            if a.find_parent(["ul", "ol"]):
                continue
            set_name = extract_title_text(a)
            if not set_name or len(set_name) < 2:
                continue
            ul = _first_ul_after(a.parent if a.parent else a)
            if not ul:
                continue
            piece_anchors = []
            for li in ul.find_all("li", recursive=False):
                aa = li.find("a", href=True)
                if aa:
                    piece_anchors.append(aa)
            if not piece_anchors:
                continue
            key = set_name.lower()
            if key in seen_sets:
                continue
            seen_sets.add(key)
            for aa in piece_anchors:
                piece_name = extract_title_text(aa)
                if not piece_name:
                    continue
                results.append({
                    "name": piece_name,
                    "category": "Set",
                    "set_name": set_name,
                    "tier": tier_label,
                    "source_url": source_url,
                })
    return results

def _parse_set_tables_with_tiers(soup, source_url):
    """
    Parse the current layout: tables with headers 'Set' and 'Pieces'.
    Assign each table to a tier by looking at the nearest previous h2/h3.
    """
    results = []
    for table in soup.find_all("table"):
        # Heuristic: header row with 'Set' and 'Pieces'
        ths = [t.get_text(" ", strip=True).lower() for t in table.find_all("th")]
        if not ths:
            continue
        if not ("set" in ths[0] and any("piece" in t for t in ths)):
            continue

        tier = _nearest_tier_for(table) or "Unknown"
        for tr in table.find_all("tr"):
            tds = tr.find_all("td")
            if len(tds) < 2:
                continue
            # 1st td: set name (bold <a>…)
            set_link = tds[0].find("a", href=True)
            set_name = extract_title_text(set_link) if set_link else None
            if not set_name:
                continue
            # 2nd td: <ul><li><a>Piece</a>…</li></ul>
            ul = tds[1].find(["ul", "ol"])
            if not ul:
                continue
            piece_links = [li.find("a", href=True) for li in ul.find_all("li", recursive=False)]
            piece_links = [a for a in piece_links if a]
            if not piece_links:
                continue
            for a in piece_links:
                piece_name = extract_title_text(a)
                if not piece_name:
                    continue
                results.append({
                    "name": piece_name,
                    "category": "Set",
                    "set_name": set_name,
                    "tier": tier,
                    "source_url": source_url,
                })
    return results

def parse_all_set_items(cache_cfg: CacheConfig) -> list[dict]:
    """
    Robust parser that supports BOTH layouts:
      1) Current table layout ('Set' | 'Pieces') under Normal/Exceptional/Elite
      2) Older header+anchor+UL layout (fallback)
    Emits warnings and a tier summary.
    """
    page_title = PAGE_TITLES["sets"]  # "List_of_Set_Items_(Diablo_II)"
    soup = soup_from_page_title(page_title, cache_cfg)
    source_url = wiki_url(page_title)

    all_rows = _parse_set_tables_with_tiers(soup, source_url)

    # Fallback if table detection found nothing
    if not all_rows:
        # collect headers for fallback
        headers = []
        for h in soup.find_all(["h2", "h3"]):
            text = (h.get_text(" ", strip=True) or "").lower()
            if "normal sets" in text:
                headers.append((h, "Normal"))
            elif "exceptional sets" in text or "exeptional sets" in text:
                headers.append((h, "Exceptional"))
            elif "elite sets" in text:
                headers.append((h, "Elite"))

        if not headers:
            print("[warn] Set page: no section headers found; layout may have changed.", file=sys.stderr)

        for h, tier in headers:
            rows = _parse_set_section(h, tier, source_url)
            if not rows:
                print(f"[warn] Parsed 0 set pieces in '{tier}' section — check page layout.", file=sys.stderr)
            all_rows.extend(rows)

    if not all_rows:
        print("[warn] No set items parsed from the set list page.", file=sys.stderr)

    # Dedup and summarize
    dedup = {}
    tier_counts = {}
    for it in all_rows:
        key = (it["name"].lower(), it["set_name"].lower())
        if key not in dedup:
            dedup[key] = it
            tier = it.get("tier") or "Unknown"
            s = tier_counts.setdefault(tier, {"sets": set(), "pieces": 0})
            s["sets"].add(it["set_name"])
            s["pieces"] += 1

    if tier_counts:
        summary = ", ".join(f"{tier}: {len(s['sets'])} sets / {s['pieces']} pieces"
                            for tier, s in tier_counts.items())
        print(f"[info] Set parse summary — {summary}", file=sys.stderr)

    return list(dedup.values())

def parse_runes(cache_cfg: CacheConfig, url: str = RUNE_LIST_URL) -> List[Dict]:
    """
    Parse a rune list page and return 33 names (El..Zod). Falls back to canonical list if parsing fails.
    """
    names: List[str] = []
    try:
        # cache external html by URL host + path
        ensure_cache_dir(cache_cfg.dir)
        safe_url = re.sub(r"[^A-Za-z0-9_.()-]", "_", url)
        cache_path = cache_cfg.dir / f"ext_{safe_url}.html"

        if not cache_cfg.refresh and is_fresh(cache_path, cache_cfg.ttl_hours):
            html = cache_path.read_text(encoding="utf-8")
        else:
            if cache_cfg.delay_sec > 0:
                time.sleep(cache_cfg.delay_sec)
            r = SESSION.get(url, timeout=30)
            r.raise_for_status()
            html = r.text
            cache_path.write_text(html, encoding="utf-8")

        soup = BeautifulSoup(html, "lxml")
        content = soup.select_one("#bodyContent") or soup
        for table in content.find_all("table"):
            for tr in table.find_all("tr"):
                tds = tr.find_all(["td", "th"])
                if not tds:
                    continue
                cell_text = tds[0].get_text(" ", strip=True)
                m = RUNE_RE.match(cell_text)

                if m:
                    names.append(m.group(1).title())
        seen = set()
        ordered = []
        for n in names:
            if n not in seen:
                seen.add(n)
                ordered.append(n)
        if len(ordered) >= 30:
            return [{"name": n, "category": "Rune", "source_url": url} for n in ordered]
    except Exception as e:
        print(f"[warn] Could not parse rune page; falling back to static list ({e})", file=sys.stderr)

    canonical = ["El","Eld","Tir","Nef","Eth","Ith","Tal","Ral","Ort","Thul","Amn","Sol","Shael","Dol","Hel","Io",
                 "Lum","Ko","Fal","Lem","Pul","Um","Mal","Ist","Gul","Vex","Ohm","Lo","Sur","Ber","Jah","Cham","Zod"]
    return [{"name": n, "category": "Rune", "source_url": url} for n in canonical]

def sanity_check_uniques(unique_rows: list[dict]):
    bad = [r for r in unique_rows if r["name"].lower() in UNIQUES_EXCLUDE_TERMS]
    if bad:
        examples = ", ".join(sorted({r["name"] for r in bad})[:8])
        print(f"[warn] Detected header/mechanics terms among uniques (examples: {examples})", file=sys.stderr)

# ----------------------------
# Post-processing helpers
# ----------------------------
FACET_VARIANTS = [
    ("Fire", "Level-Up"),
    ("Fire", "Death"),
    ("Cold", "Level-Up"),
    ("Cold", "Death"),
    ("Lightning", "Level-Up"),
    ("Lightning", "Death"),
    ("Poison", "Level-Up"),
    ("Poison", "Death"),
]

def explode_rainbow_facet(items: List[Dict]) -> List[Dict]:
    """
    Replace a single "Rainbow Facet" entry with 8 variant rows.
    """
    out: List[Dict] = []
    replaced = False
    for it in items:
        if it.get("category") == "Unique" and it.get("name", "").lower() == "rainbow facet" and not replaced:
            # Generate 8 variants
            for elem, trigger in FACET_VARIANTS:
                row = dict(it)
                row["name"] = f"Rainbow Facet ({elem}, {trigger})"
                row["variant"] = f"{elem}/{trigger}"
                out.append(row)
            replaced = True
        else:
            out.append(it)
    return out

# ----------------------------
# Output
# ----------------------------
def write_json(path: str, payload: dict):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)

def write_csv(path: str, rows: list):
    fields = ["name", "category", "subcategory", "set_name", "tier", "variant", "source_url"]
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        for r in rows:
            w.writerow({k: r.get(k) or "" for k in fields})

# ----------------------------
# Main
# ----------------------------
def main():
    ap = argparse.ArgumentParser(description="Scrape Diablo II Holy Grail item lists (via MediaWiki API).")
    ap.add_argument("--out-json", default="holy_grail_items.json", help="Output JSON path")
    ap.add_argument("--out-csv", default="holy_grail_items.csv", help="Output CSV path")
    ap.add_argument("--include-runes", action="store_true", help="Include runes in output")
    ap.add_argument("--facet-variants", action="store_true", help="Track 8 Rainbow Facet variants instead of one")
    ap.add_argument("--refresh", action="store_true", help="Ignore cache and fetch fresh")
    ap.add_argument("--cache-ttl-hours", type=int, default=720, help="Cache TTL in hours (default 720 = 30 days)")
    ap.add_argument("--delay", type=float, default=0.5, help="Polite delay between HTTP requests (seconds)")
    args = ap.parse_args()

    cache_cfg = CacheConfig(
        dir=Path(".cache"),
        ttl_hours=args.cache_ttl_hours,
        refresh=args.refresh,
        delay_sec=args.delay,
    )

    t0 = time.time()
    all_rows: List[Dict] = []

    print("[*] Parsing Set items...")
    sets = parse_all_set_items(cache_cfg)
    all_rows.extend(sets)

    print("[*] Parsing Unique items...")
    uniques = parse_all_uniques(cache_cfg)

    # Sanity check (prints warnings if headers sneak in)
    sanity_check_uniques(uniques)

    # Optionally expand Rainbow Facet into 8 variants
    if args.facet_variants:
        uniques = explode_rainbow_facet(uniques)
    all_rows.extend(uniques)

    if args.include_runes:
        print("[*] Parsing Runes...")
        runes = parse_runes(cache_cfg)
        all_rows.extend(runes)

    # Build structured JSON
    out = {
        "meta": {
            "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "sources": {
                "fandom_base": FANDOM_BASE,
                "pages": PAGE_TITLES,
                "runes": RUNE_LIST_URL,
            },
            "include_runes": bool(args.include_runes),
            "facet_variants": bool(args.facet_variants),
            "notes": [
                "Pulled via Fandom MediaWiki API (action=parse, prop=text) to avoid 403s.",
                "Sunder charms are included via Unique_Charms.",
                "Rainbow Facet defaults to a single entry unless --facet-variants is used.",
                "Layout can change; tables-first parsing with header/strong fallback.",
            ],
        },
        "items": all_rows,
        "summary": {
            "counts": {
                "Set": sum(1 for r in all_rows if r.get("category") == "Set"),
                "Unique": sum(1 for r in all_rows if r.get("category") == "Unique"),
                "Rune": sum(1 for r in all_rows if r.get("category") == "Rune"),
                "Total": len(all_rows),
            }
        }
    }

    write_json(args.out_json, out)
    write_csv(args.out_csv, all_rows)

    dt = time.time() - t0
    print(f"[✓] Done. {len(all_rows)} rows written in {dt:.1f}s")
    print(f"    JSON: {args.out_json}")
    print(f"    CSV : {args.out_csv}")
    print(f"    Cache: {cache_cfg.dir.resolve()} (TTL {cache_cfg.ttl_hours}h)")

if __name__ == "__main__":
    main()
