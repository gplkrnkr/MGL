# MyGrandLabour website

The MyGrandLabour website, served from the backend's AWS EC2 server and talking to the FastAPI
backend ([sajinaa-pk/mgl_backend](https://github.com/sajinaa-pk/mgl_backend)).

| Path | What |
| --- | --- |
| [`mgl_web/`](mgl_web/) | The web app — worker, employer and admin portals (React + TypeScript + Vite). See its README. |
| [`marketing/home.html`](marketing/home.html) | The static marketing page. Until the AWS cutover, Vercel serves it at `mygrandlabour.com/` ([`vercel.json`](vercel.json)); its old `/app/...` links redirect to the homepage. |

## History

This repo used to hold a proof of concept served by Vercel at `mygrandlabour.com/app`, which read and
wrote a Supabase database directly from the browser. On the `website-aws` branch it is replaced by
`mgl_web` (originally sajinaa-pk/my-grand-web), which was built for the FastAPI backend; Supabase and
Vercel are no longer used. The proof of concept is still in `main`'s history.

## Status

Work in progress. Before the website can go live:

- the backend needs the endpoints and fields `mgl_web` expects (worker search, recent
  registrations, worker lookup, employer GSTIN/contact fields, agent registration);
- login needs an SMS provider for the backend's OTP endpoints;
- the API must be served over HTTPS at `api.mygrandlabour.com`.
