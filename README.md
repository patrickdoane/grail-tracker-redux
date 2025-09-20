# Grail Tracker Redux

A ground-up rebuild of the Diablo II Holy Grail tracker featuring a React (Vite) client, Spring Boot API, and Python tooling that scrapes the latest item data from Fandom.

## Project Layout

- `grail-client/` – React + TypeScript frontend (Vite).
- `grail-server/` – Spring Boot 3 backend (Java 17, Spring Data JPA, PostgreSQL).
- `scripts/` – Python utilities that scrape and generate Holy Grail reference data.
- `holy_grail_items.(csv|json)` – Generated datasets produced by the scraper.

## Prerequisites

- Node.js 18+
- Java 17 and Maven Wrapper (`./mvnw`)
- Python 3.10+ with `requests`, `beautifulsoup4`, `lxml`
- PostgreSQL database (credentials stored in `grail-server/env.properties` – not committed)

## Getting Started

1. **Install client deps**
   ```bash
   cd grail-client
   npm install
   ```
2. **Install server deps**
   ```bash
   cd grail-server
   ./mvnw clean compile
   ```
3. **Configure Postgres**
   - Create a database for the project.
   - Copy `grail-server/env.properties.example` (if provided) to `env.properties` and fill in `DB_USER`, `DB_PASSWORD`, `DB_DATABASE`.

## Development

- **Run the client**
  ```bash
  cd grail-client
  npm run dev
  ```
- **Run the API**
  ```bash
  cd grail-server
  ./mvnw spring-boot:run
  ```
- **Backend tests**
  ```bash
  cd grail-server
  ./mvnw test
  ```

## Data & Seeding Workflow

1. **Refresh scraper outputs** (writes to repo root):
   ```bash
   python scripts/d2_holy_grail_scraper.py --include-runes --facet-variants --refresh
   ```
2. **Optional audited snapshot**:
   ```bash
   python scripts/make_official_reference.py
   ```
3. **Load data into Postgres**
   - Start the API once (`./mvnw spring-boot:run`) to let Hibernate create tables.
  - Use `psql` to `\copy` from `holy_grail_items.csv` into a staging table, then populate `items`, `item_properties`, and `item_sources` (see `AGENTS.md` for a ready-to-run SQL block).

## Formatting & Hooks

- Install Git hooks once:
  ```bash
  pip install pre-commit
  pre-commit install
  ```
- Hooks run on commit:
  - `ruff` auto-formats/checks Python scripts.
  - `npm --prefix grail-client run lint` checks the React codebase.
  - `./mvnw -q spotless:apply` keeps the Spring Boot code in Google Java Format.

## Additional Notes

- Generated CSV/JSON and scraper caches are ignored via `.gitignore`.
- Follow the guidelines in `AGENTS.md` and `scripts/AGENTS.md` for detailed conventions, coding standards, and seeding instructions.
- Future enhancements include REST controllers, frontend integration, and automated tests for the scraping pipeline.
