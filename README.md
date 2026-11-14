# MyGrandLabour website

The MyGrandLabour website at https://mygrandlabour.com, served from the backend's AWS EC2 server and
talking to the FastAPI backend ([sajinaa-pk/mgl_backend](https://github.com/sajinaa-pk/mgl_backend)).

| Path | What |
| --- | --- |
| [`mgl_web/`](mgl_web/) | The web app: worker and employer pages and sign-in (plus admin and preview pages), React + TypeScript + Vite. See its README. |
| [`mgl_web/public/home.html`](mgl_web/public/home.html) | The public home page, served at `/`. Its script is in `home.js` (no inline scripts: the site's Content-Security-Policy blocks them). |
| [`deploy/nginx/`](deploy/nginx/) | The server's nginx site and security headers. |

## One number, one role

A phone number belongs to either a worker or an employer. Each sees only their own pages: workers get
Jobs / My applications / Profile, employers get My jobs / Post a job / Company profile. Signing in
on the other side's page shows "This number is registered as a…". The backend enforces the same
rule (sajinaa-pk/mgl_backend#25).

## Deploying

Everything runs on one host: nginx serves the home page at `/`, the React app for every other page,
and proxies `/api`, `/files` and `/health` to the API on `127.0.0.1:8000`. `www.` and `app.`
redirect to `mygrandlabour.com`.

```bash
cd mgl_web
npm ci && npm run build            # uses .env.production
tar czf /tmp/site.tgz -C dist .
# copy /tmp/site.tgz to the server, then on the server:
R=/var/www/releases/$(date +%Y%m%d-%H%M%S)
mkdir "$R" && tar xzf /tmp/site.tgz -C "$R"
sudo ln -sfn "$R" /var/www/mgl-site   # switch over; the previous release stays for rollback
```

The nginx config in `deploy/nginx/` goes to `/etc/nginx/sites-available/mygrandlabour` and
`/etc/nginx/snippets/mgl-web-headers.conf`. Run `sudo nginx -t && sudo systemctl reload nginx` after
changing it.

## History

This repo used to hold a proof of concept served by Vercel at `mygrandlabour.com/app`, which read
and wrote a Supabase database directly from the browser. It was replaced by `mgl_web` (originally
sajinaa-pk/my-grand-web), built for the FastAPI backend. Supabase and Vercel are no longer used. The
proof of concept is still in the git history.
