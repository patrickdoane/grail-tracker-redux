# Settings & Data Management Rollout

This document outlines how the settings experience persists user configuration, how data imports and exports are processed, and which integration points should be exercised during QA.

## API Overview

| Endpoint | Method | Description |
| --- | --- | --- |
| `/api/user-profile` | `GET`, `PUT` | Load or update the user's display name, tagline, contact email, and timezone. Timezones are validated using `ZoneId` to prevent invalid offsets. |
| `/api/user-preferences` | `GET`, `PUT` | Manage sharing, notification, and appearance preferences. Updates increment a `broadcastVersion` so clients can fan out preference changes. |
| `/api/data-connectors` | `GET` | Returns live sync connector metadata (status badge variant, last/next sync strings, and action label). |
| `/api/data-connectors/{id}/actions` | `POST` | Trigger `manage`, `schedule`, `import`, or `sync` actions. Each action records a `SyncJob` entry and updates connector copy. |
| `/api/user-data/import` | `POST (multipart)` | Upload CSV/JSON bundles for merge. Responses include a `SyncJob` payload and a `conflictsDetected` flag. Any file containing `conflict` (case-insensitive) is treated as a failed import to simulate merge conflicts. |
| `/api/user-data/import/{jobId}/retry` | `POST` | Re-run a failed import job. The new job increments the retry counter and returns a success status. |
| `/api/user-data/export` | `POST` | Produce an export job. Responses include the job metadata plus a `downloadUrl`. |
| `/api/user-data/export/{jobId}/download` | `GET` | Download the generated CSV or JSON payload once the job is complete. |
| `/api/user-data/jobs/{jobId}` | `GET` | Poll job progress. |
| `/api/onboarding/tasks` | `GET` | Returns the onboarding checklist with completion signals sourced from profile, preference, import, and export activity. |
| `/api/onboarding/tasks/{taskId}` | `POST` | Persist manual acknowledgements while still honouring signal-derived completions. |

## Frontend behaviour

* The settings page now hydrates from the endpoints above using TanStack Query. Edits show inline validation for email and timezone, with success banners after saving.
* Theme mode and accent selections feed a shared theme manager that:
  * Applies `data-theme`/`data-accent` attributes to the document root.
  * Stores the selection in `localStorage` and mirrors the active system preference when `system` is chosen.
  * Publishes preference updates through a context provider so the rest of the app receives changes without refresh.
* Presence and notification toggles persist immediately and refresh the shared context; the header badge reflects autosave state based on the latest payload.
* Data connectors render the live status metadata returned by the backend. Clicking an action button fires the appropriate job mutation and refreshes the connector list.
* The import card accepts drag/drop or manual file selection. Upload progress surfaces via the returned job metadata, conflict messages render inline, and a retry button reuses the failed job id.
* Export buttons call the export endpoint, update progress indicators, and automatically download the generated bundle when the job reports completion.
* Onboarding tasks are locked when driven entirely by signals. Manual acknowledgements emit telemetry events (`onboarding_task_toggle`) alongside the server update.

## QA checklist

1. `./mvnw test` – covers new integration tests under `SettingsIntegrationTests`.
2. `cd grail-client && npm run lint` – validates the updated React/TypeScript flows.
3. Exercise manual smoke test:
   * Load `/settings`, update the profile email with an invalid format to confirm inline errors.
   * Toggle sharing or notifications and confirm the success banner + header badge update.
   * Upload a CSV containing the word "conflict" to trip the simulated merge conflict, then trigger a retry and watch the state resolve.
   * Start an export and verify the download prompt plus onboarding progress update.

