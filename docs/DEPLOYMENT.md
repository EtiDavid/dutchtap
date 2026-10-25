# Deployment

Target stack: **Vercel** (free tier is Next.js-native) + **MongoDB
Atlas** (free/shared tier). Both are free-tier-compatible as of this
writing; if either has changed pricing by the time you read this,
substitute the closest no-cost equivalent and update this doc — don't
silently introduce paid infrastructure.

## 1. MongoDB Atlas

You're already using an existing Atlas cluster (`daviddb`) shared with
other projects. The app connects to a database named `DutchTap` on that
cluster (see the note on database naming below).

If you ever need a fresh cluster instead:
1. [cloud.mongodb.com](https://cloud.mongodb.com) → **Create** → shared/free (M0) tier.
2. **Database Access** → add a user with a strong password (read/write on this project).
3. **Network Access** → for Vercel, add `0.0.0.0/0` (Atlas doesn't support
   Vercel's dynamic serverless IPs any other way) — this is standard
   practice for serverless deployments; access is still gated by the
   database username/password.
4. **Connect** → **Drivers** → copy the `mongodb+srv://...` connection string.

**Database naming note**: MongoDB Atlas rejects creating a database
whose name differs from an existing one only by case (we hit this
directly — `dutchtap` was rejected because `DutchTap` already existed on
the shared cluster). Pick a name once and keep the URI's path segment
consistent; changing it later means either renaming or migrating data.

## 2. Environment variables

Two variables, both required in every environment (local, Preview, Production):

| Variable | Value |
| --- | --- |
| `MONGODB_URI` | The full Atlas connection string, including a database name in the path (e.g. `.../DutchTap?appName=...`) |
| `SESSION_SECRET` | A random secret for signing session cookies. Generate one with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` — use a **different** secret in Production than in local dev |

Never commit real values — `.env.local` is gitignored; `.env.example`
documents the shape only.

## 3. Deploy to Vercel

1. [vercel.com/new](https://vercel.com/new) → **Import Git Repository** → select `EtiDavid/dutchtap`.
2. Framework preset: Next.js (auto-detected). Leave build/output settings default.
3. **Environment Variables** — add `MONGODB_URI` and `SESSION_SECRET` for
   the **Production** environment (and Preview, if you want preview
   deployments to hit the same or a separate database — a separate
   database name, e.g. `DutchTap-preview`, is safer so preview traffic
   never mixes with production data).
4. **Deploy**. Vercel builds with `npm run build` and serves it.
5. Once live, open the deployment URL and smoke-test: play a guest
   round, create a test account, confirm the recovery code appears,
   log out, log back in.

## 4. Custom domain — `dutchtap.davideti.dev`

DNS for `davideti.dev` is on **Cloudflare** (registered directly through
Cloudflare Registrar).

Note: the domain is `davideti.dev`, not `etidavid.dev` — easy to get
backwards from the `EtiDavid` GitHub handle and the `etidavid.github.io`
repo, which is a *different* domain entirely. Don't assume; check the
Cloudflare dashboard's Domains list if unsure.

1. In the Vercel project → **Settings → Domains** → add `dutchtap.davideti.dev`.
2. Vercel displays the **exact** DNS record it needs. **Use the value
   Vercel shows you at the time**, not a value copied from
   documentation or memory — Vercel's target is unique per domain and
   can change. At the time this was set up, it was:
   - Type: `CNAME`
   - Name: `dutchtap`
   - Target: `ae6f6f8a84d4df63.vercel-dns-017.com`
3. In Cloudflare, add that record under the `davideti.dev` zone → **DNS
   → Records**. Set the proxy status to **DNS only** (grey cloud, not
   orange/proxied) — Cloudflare's proxy in front of Vercel breaks
   Vercel's own SSL certificate provisioning and can cause a redirect
   loop.
4. Wait for DNS propagation (Vercel's dashboard shows verification
   status live; usually minutes with Cloudflare).
5. Vercel automatically provisions HTTPS (Let's Encrypt) once DNS
   verifies — no manual certificate step.
6. Confirm `https://dutchtap.davideti.dev` loads the app and that HTTP
   redirects to HTTPS (Vercel does this by default).

**Status: live.** Verified `dutchtap.davideti.dev` resolves, serves over
HTTPS with a Vercel-issued certificate, HTTP redirects to HTTPS (308),
and the full register/login/recovery flow works against it directly —
not just the `.vercel.app` URL.

## 5. Redeploy / rollback

- **Redeploy**: every push to `main` triggers a new Production
  deployment automatically (once the GitHub integration is connected in
  step 3). No manual redeploy step needed for normal changes.
- **Rollback**: Vercel dashboard → **Deployments** → find the last known-good
  deployment → **⋯ → Promote to Production**. This is instant and doesn't
  require a git revert first (though you should still revert/fix the
  underlying commit afterward).
- **Preview deployments**: every PR/branch push gets its own preview URL
  automatically, useful for testing before promoting to production.

## 6. Post-deploy checklist

- [x] `MONGODB_URI` and `SESSION_SECRET` set in Vercel for Production
- [x] Guest play works with no database — verified via the local
      dev-server E2E suite (`test:e2e`); not re-tested against a
      deliberately-broken production database, on purpose
- [x] Account creation, recovery code display, login, logout all work
      against the production database — verified directly on both
      `dutchtap.vercel.app` and `dutchtap.davideti.dev`
- [x] `dutchtap.davideti.dev` resolves and serves over HTTPS
- [x] No secrets visible in the deployed page source or API responses

## Releasing: tags only

Nothing deploys when you push or merge a branch, including `main`: `vercel.json` turns Vercel's Git deployments off for every branch.
Production is deployed only by `.github/workflows/deploy-production.yml`, which runs when a tag starting with `v` is pushed.

```bash
git switch main && git pull
git tag v1.4.0
git push origin v1.4.0
```

The workflow refuses a tag that is not on `main`, runs lint and the unit tests, then builds and deploys with the Vercel CLI.
One-time setup in GitHub → Settings → Secrets and variables → Actions: add `VERCEL_TOKEN` (a Vercel access token),
`VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` (both are in `.vercel/project.json` after running `npx vercel link` locally).
The environment variables in section 2 stay in the Vercel project (Production), where `vercel pull` reads them.
To roll back, push a new tag on the earlier commit, or promote an earlier deployment in the Vercel dashboard.
