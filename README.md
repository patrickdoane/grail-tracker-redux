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
- **Backend tests (H2 in-memory profile)**
  ```bash
  cd grail-server
  ./mvnw test
  ```

## API Endpoints

All routes live under the `/api` prefix. Sample payloads are JSON.

- `GET /api/items` – list items; `POST /api/items` creates an item; `PUT /api/items/{id}` updates; `DELETE /api/items/{id}` removes.
- `GET /api/item-properties?itemId={id}` – list properties (optionally filtered); `POST /api/item-properties` adds a property for an item.
- `GET /api/item-sources?itemId={id}` – list external sources; `POST /api/item-sources` adds a source for an item.
- `GET /api/users` – list users; `POST /api/users` creates a user (expects `username`, `email`, `passwordHash`).
- `GET /api/user-items?userId={id}` – list finds for a user; `POST /api/user-items` logs a new find with optional `foundAt` and `notes`.

All endpoints support `GET /{id}` for lookups and `DELETE /{id}` for removal. Validation errors return HTTP 400 with field-level messages, missing resources return HTTP 404, and duplicate usernames/emails return HTTP 409.

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
   - Run `python scripts/seed_database.py --csv holy_grail_items.csv` to load the dataset using the credentials in `grail-server/env.properties`.
   - Alternatively, use `psql` to `\copy` from `holy_grail_items.csv` into a staging table, then populate `items`, `item_properties`, and `item_sources` (see `AGENTS.md` for a ready-to-run SQL block).

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
- Future enhancements focus on richer frontend experiences (dashboard shell, item browser), deeper analytics, and automated tests for the scraping pipeline.
