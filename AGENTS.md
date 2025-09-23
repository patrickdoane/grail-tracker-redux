# Repository Guidelines

## Project Structure & Modules
- `grail-client/`: React + TypeScript frontend (Vite). Assets under `public/`, app code in `src/`.
- `grail-server/`: Spring Boot (Java 17) backend. Source in `src/main/java/`, tests in `src/test/java/`, config in `src/main/resources/`.
- `scripts/`: Python utilities for scraping and packaging Holy Grail reference data; outputs `holy_grail_items.(csv|json)` at the repo root.

## Architecture Overview
- Client: React + TypeScript (Vite) renders the grail UI and calls the backend via JSON over HTTP.
- API: Spring Boot 3 provides REST controllers (to be added), a service layer, and JPA repositories. Current code includes entity models under `model/`.
- Persistence: PostgreSQL via Spring Data JPA; schema managed by Hibernate (`ddl-auto=update`). Credentials are supplied via `env.properties`.
- Data flow: CSV/JSON reference files live at repo root; Python scripts generate/refresh them. Future seeding imports this data into Postgres.
- Runtime: Dev defaults to `client:5173`, `server:8080`. Use a Vite proxy or Spring CORS to allow cross-origin during development.

## Build, Test, and Development
- Client dev: `cd grail-client && npm install && npm run dev` — start Vite dev server.
- Client build: `npm run build` then `npm run preview` — build and preview static assets.
- Client lint: `npm run lint` — run ESLint across the project.
- Server dev: `cd grail-server && ./mvnw spring-boot:run` — run API locally.
- Server test: `./mvnw test` — run JUnit tests. Package: `./mvnw package`.
- Data generation: `python scripts/make_official_reference.py` — refresh reference files.

## Coding Style & Naming
- TypeScript/React: 2-space indent, `camelCase` for vars, `PascalCase` for components, files `*.tsx` for components. Keep UI state local; colocate styles in `src/`.
- ESLint: configured via `eslint.config.js` in `grail-client/`. Fix issues before PR.
- Java: 4-space indent, `camelCase` methods/fields, `PascalCase` classes. Package `com.d2.grail_server`. Use Lombok where present; place JPA entities under `model/`. Use `String.format` for templated strings to remain compatible with Java 17.

## Frontend Component Library
- Shared UI primitives live in `grail-client/src/components/ui`; import from the directory root (e.g. `import { Button } from '../components/ui'`) to automatically pull in styling.
- Prefer the provided `Button`, `Card`, `Container`, `Stack`, `Grid`, `FilterChip`, `StatusBadge`, `ProgressRing`, and `FloatingActionButton` helpers before introducing bespoke markup.
- Pair component usage with local `.css` modules (see `features/items/ItemsPage.tsx`) to keep feature-specific styling isolated.
- Document any new components or variants in `docs/ui-component-library.md` to keep the design system discoverable.

## Testing Guidelines
- Backend: JUnit 5 with Spring Boot. Test classes end with `*Tests.java` under `src/test/java/`. Aim for meaningful integration tests for controllers/repos.
- Frontend: No test runner configured yet; prefer adding Vitest + React Testing Library in future PRs.

## Commit & Pull Requests
- Create a feature branch before you start (e.g., `git checkout -b feature/item-variants-fix`) so `main` stays clean until review; avoid committing directly to `main`.
- Commits: imperative present (e.g., "Add Item model"). Keep messages concise and scoped.
- PRs: include purpose, linked issue (if any), local run steps, and screenshots/GIFs for UI changes. Note any DB/schema impacts.

## Security & Configuration
- Backend loads `env.properties` (ignored by Git). Define `DB_USER`, `DB_PASSWORD`, `DB_DATABASE`; Postgres URL in `application.properties`. Never commit secrets.

## Seed Data Workflow
- Confirm Postgres is running with credentials from `grail-server/env.properties`, then launch the backend once via `cd grail-server && ./mvnw spring-boot:run` so Hibernate creates the tables (`ddl-auto=update`).
- Refresh the item reference before loading: `python scripts/d2_holy_grail_scraper.py --out-csv holy_grail_items.csv --include-runes --facet-variants --refresh`; use `python scripts/make_official_reference.py` when you need a frozen JSON snapshot for audits.
- Run `python scripts/seed_database.py --csv holy_grail_items.csv` (from repo root) to import the dataset; the script handles truncation and inserts for you using the credentials in `grail-server/env.properties`.
- After seeding, run `./mvnw spring-boot:run` again to verify the API boots cleanly, and spot-check the data with `psql` queries (e.g., `SELECT name, rarity FROM items ORDER BY name LIMIT 10;`).
