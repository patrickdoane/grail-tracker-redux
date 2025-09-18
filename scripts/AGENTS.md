# Scripts Guidelines

## Purpose
- Centralizes Python utilities that scrape Diablo II Fandom and package Holy Grail item references.
- Shared helpers live alongside the entry scripts (`d2_holy_grail_scraper.py`, `make_official_reference.py`).

## Environment
- Requires Python 3.10+ with `requests`, `beautifulsoup4`, and `lxml` available.
- Runs from the repo root so outputs land at `holy_grail_items.*` and caches stay in `.cache/`.

## Usage
- Refresh the canonical CSV/JSON: `python scripts/d2_holy_grail_scraper.py --include-runes --facet-variants`.
- Force a clean scrape: add `--refresh` and adjust `--cache-ttl-hours` / `--delay` as needed.
- Build the audited snapshot: `python scripts/make_official_reference.py`.

## Outputs
- `holy_grail_items.csv` / `holy_grail_items.json` at the repo root for downstream import.
- `official_reference.json` for long-lived archives (run via `make_official_reference.py`).

## Notes
- MediaWiki pages shift periodically; keep retry/backoff settings polite to avoid bans.
- If counts drift, run with `--refresh` and compare totals against the expected 127 sets, 385 uniques, 33 runes.
