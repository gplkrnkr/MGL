# mgl_web

Web application for [MyGrandLabour](../backend/mgl_backend) — worker, employer, and admin portals
in one app, talking to the same FastAPI backend as the mobile app. Themed to match the mobile
app's navy/orange, flat-outlined design system.

## Stack

- React + TypeScript + Vite
- React Router (`react-router-dom`) for routing
- TanStack Query for data fetching
- Tailwind CSS v4 (CSS-first `@theme` config in `src/index.css`)
- Axios for the API client
- Optional Sentry (`@sentry/react`) for error monitoring

## Setup

```bash
npm install
cp .env.example .env   # set VITE_API_URL if the backend isn't on localhost:8000
npm run dev
```

Runs at http://localhost:5173. The backend (`mgl_backend`) must be running separately — see its
README — and its `CORS_ORIGINS` must include `http://localhost:5173` (the default `*` works for
dev).

**`VITE_API_URL` must be the bare backend origin (e.g. `http://localhost:8000`), no `/api`
suffix** — `src/api/client.ts` already prefixes every request path with `/api` itself; a value
ending in `/api` doubles it up and every request 404s. (A real bug this project shipped with
briefly — caught by actually loading the job list against a Dockerized build rather than trusting
the README's own example command.)

## Structure

- `src/api/client.ts` + `src/api/types.ts` — typed API client matching the backend's contract
  (camelCase JSON, except the auth token endpoints which are snake_case — see comments).
- `src/context/AuthContext.tsx` — session state, worker vs. employer login.
- `src/components/ui/` — shared design system components (`Button`, `Card`, `TextField`, `Badge`).
- `src/routes/worker/` — worker portal: job list, job detail + apply, my applications, profile.
- `src/routes/employer/` — employer portal: dashboard, post/edit job, applicant review, company
  profile.
- `src/routes/admin/` — admin portal: document review, application review (see below).

## Three portals, one login mechanism

Workers, employers, and admins all sign in with their phone number through **Firebase Phone
Auth** (`src/lib/phoneAuth.ts`): Firebase sends the SMS code and verifies it, then the app swaps
the Firebase ID token for the backend's session at `POST /api/auth/firebase/verify` — the same
endpoint the mobile app uses. There's no separate admin login system.

Setup: register a **Web app** in the Firebase project (`mgl-backend`) and copy its config into the
`VITE_FIREBASE_*` variables (see `.env.example`); add the site's domain under Authentication →
Settings → Authorized domains, and allow India under the SMS region policy. While the project is on
Firebase's free plan, only the **test phone numbers** configured under Authentication → Sign-in
method → Phone (up to 10, each with a fixed code, no SMS sent) can sign in; real numbers need the
pay-as-you-go plan, with no code changes. `/login` is the worker entry point and never
touches the `isEmployer`/`isAdmin` flags; `/employer/login` is the employer entry point and calls
`POST /api/profile/me/role` right after signing in (idempotent and one-way — a profile that
becomes an employer stays one). `/admin/login` is just a normal login — admin status isn't
self-service like the employer role is; it's granted server-side via
`mgl_backend/scripts/promote_admin.py`, and `AdminRoute` simply checks whatever `isAdmin` comes
back on the profile. It's deliberately not linked from the public `Landing` page — admins get the
URL directly. This mirrors the design already documented in the backend README.

## Design tokens

Colors, radii, and spacing are defined in `src/index.css` under `@theme`, sourced from the mobile
app's `src/theme/{colors,typography,spacing}.ts`. Spacing intentionally uses Tailwind's default
numeric scale (`p-4`, `gap-2`, etc. — 4px increments) rather than named `xs/sm/md/lg` tokens:
Tailwind v4 shares the `--spacing-*` theme namespace across padding/margin/gap **and**
`w-*`/`h-*`/`max-w-*`, so naming custom entries `sm`/`md`/`lg` silently overwrites Tailwind's
built-in `max-w-sm` etc. (found and fixed during initial build — every `max-w-sm` rendered as
`8px` instead of `24rem`). `--radius-*` doesn't have this conflict (only feeds `rounded-*`), so
it does use named `sm/md/lg/full` tokens matching the mobile app's radius scale directly.

## Not built yet

- Document *upload* UI (mobile-only; workers upload from the app). Document *review* is on the
  web now (admin portal).
- Employer signup beyond phone sign-in.
- Analytics — flagged but intentionally not built; needs a provider decision (GA4, Plausible,
  etc.) and an account/site ID first.

## Run with Docker

```bash
docker build --build-arg VITE_API_URL=https://api.example.com -t mgl-web .
docker run --rm -p 8080:80 mgl-web
```

**Important**: `VITE_API_URL` is a Docker **build** arg, not a runtime env var — Vite bakes
`VITE_*` variables into the JS bundle at build time. Changing the backend URL means rebuilding
the image, not just restarting the container (this bit the mobile app during a demo — same class
of bug, same fix: rebuild whenever the backend's address changes).

`compose.yaml` wraps the same build for local testing:

```bash
VITE_API_URL=http://localhost:8000 docker compose up --build
```

The image is nginx serving the static build (`Dockerfile` + `default.conf.template`): SPA
fallback for client-side routing (`try_files $uri /index.html`), gzip, immutable cache headers on
hashed assets, and baseline security headers (`X-Content-Type-Options`, `X-Frame-Options`,
`Referrer-Policy`, `Content-Security-Policy`).

**`connect-src` in the CSP is runtime-configurable**, unlike `VITE_API_URL`: the nginx config is a
`*.template` file nginx's official image renders via `envsubst` at **container start**, so
`API_ORIGIN` can be changed with `docker run -e API_ORIGIN=https://api.example.com` (or
`API_ORIGIN=... docker compose up`) without rebuilding the image — it defaults to the same value
as `VITE_API_URL` if not set separately. Verified: same image, different `API_ORIGIN`, different
CSP header on container start, `$uri` (nginx's own variable, not a shell env var) survives the
template substitution untouched.

## Admin portal

`/admin/login` → `/admin/documents` and `/admin/applications`. Reuses the exact list/status-update
pattern already built for the employer's applicant review screen. Promote an account to admin via
the backend's bootstrap script:

```bash
docker exec mgl-backend python -m scripts.promote_admin +91XXXXXXXXXX
```

## Error monitoring (optional)

Set `VITE_SENTRY_DSN` (build-time, like `VITE_API_URL`) to enable Sentry. Unset = complete no-op,
same pattern as the backend's `SENTRY_DSN` handling — `src/lib/sentry.ts`.

## Testing

```bash
npm run test        # Vitest + React Testing Library
npm run lint         # oxlint
npm run type-check   # tsc -b
```

Covers: `AuthContext` (worker/employer login, logout, stale-token handling), `ProtectedRoute`
(`WorkerRoute`/`EmployerRoute`/`AdminRoute` redirect behavior), the API client's auth snake_case
quirk and its 401 interceptor, and a `Landing` smoke test. `.github/workflows/ci.yml` runs all of
the above plus `npm run build` and `npm audit` — not wired to anything yet since this project
isn't a git repo yet, but ready to go the moment it is. `.github/dependabot.yml` is already in
place for when it is.

## Production readiness

Snapshot as of 2026-08-21.

### Done

- Fail-loud config validation: a production build with no `VITE_API_URL` shows a clear
  "misconfigured" screen instead of silently pointing at `localhost`.
- Global `ErrorBoundary` (render errors) + a `404` route + an axios response interceptor that
  clears the session and redirects to `/` on a `401`.
- Inline error states on every list/detail page and save mutation.
- Dockerfile + templated nginx config (SPA fallback, gzip, cache headers, security headers,
  runtime-configurable CSP) — verified via real containers, including a genuine runtime override
  without rebuilding.
- Admin portal: document review and application review, reusing the enriched backend endpoints
  (owner name/phone/worker ID, job title) added specifically to support this.
- Optional Sentry integration (no-op without a DSN, same pattern as the backend).
- Vitest + React Testing Library suite (16 tests), a CI workflow, `npm audit` in CI, and
  Dependabot config.

### Still pending

1. **Git repo** — not initialized yet; the CI workflow and Dependabot config are inert until it
   is.
2. **Analytics** — no provider chosen yet (see "Not built yet" above).
3. **Accessibility** hasn't had a dedicated pass beyond basic label/`htmlFor` wiring in
   `TextField`.
4. Not deployed anywhere publicly — the Docker image builds and runs correctly locally, but
   there's no live hosting yet.
