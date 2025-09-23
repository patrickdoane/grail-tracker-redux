# Grail Client

The Grail Tracker frontend is a Vite-powered React + TypeScript application. It talks to the Spring Boot API via JSON requests and surfaces Holy Grail progress tracking UI.

## Prerequisites

- Node.js 18+
- npm (bundled with Node 18)

## Installing Dependencies

```bash
cd grail-client
npm install
```

## Environment Variables

- Copy `.env.example` to `.env.local` (or `.env`) and set values as needed.
- `VITE_TELEMETRY_ENDPOINT` controls where telemetry payloads are POSTed. Provide a full HTTPS URL to enable delivery or leave it blank to keep events logged to the console during development.
- Restart the dev server after changing env files so Vite reloads `import.meta.env` values.

## Scripts

- `npm run dev` – start the Vite dev server on port 5173.
- `npm run build` – generate a production build in `dist/`.
- `npm run preview` – serve the production build locally.
- `npm run lint` – run ESLint with the project configuration.

## Telemetry Overview

Telemetry events funnel through `src/lib/telemetry.ts`. When `VITE_TELEMETRY_ENDPOINT` is defined, the client will attempt `navigator.sendBeacon` first, falling back to `fetch` with `keepalive`. Without an endpoint the events stay in-memory and are logged to the console, which is the recommended local workflow.

## Project Structure Highlights

- `src/components/ui/` contains the shared design system primitives (Button, Card, Stack, etc.).
- `src/features/` houses feature modules. For example, item detail telemetry wiring lives in `src/features/items/ItemDetailPanel.tsx`.
- `public/` stores static assets that Vite serves as-is.

Refer to the repository root `README.md` for full-stack setup details, backend configuration, and seeding instructions.
