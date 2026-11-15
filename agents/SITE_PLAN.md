# stellahu.me Site Plan

> Status: planned, not started · Written 2026-11-15 · Owner: Stella
> Companion docs: `agents/ARCHITECTURE.md` (app & backend design), `agents/DATA_MODEL.md` (SQLite schema/migrations), `agents/V0.md` (static v0 history)

## Goal

Restructure `stellahu.me` from a Hashnode blog into a personal site:

| URL | Content | Source |
|---|---|---|
| `https://stellahu.me/` | Self-introduction / landing | Jekyll (Chirpy) |
| `https://stellahu.me/blog` | Blog (posts archive) | Jekyll (Chirpy) |
| `https://stellahu.me/projects/` | List of my apps/projects | Jekyll (new `_tabs/projects.md`) |
| `https://stellahu.me/projects/starward/` | Starward PWA (notes / schedule / countdowns) | starward repo, built with `VITE_BASE=/projects/starward/` |
| `https://www.stellahu.me/*` | 301 → apex | Cloudflare redirect rule |
| `https://starward.stellahu.me` | 301 → `/projects/starward/` (or delete) | Cloudflare |

One Cloudflare Pages project (`stellahu-me`) serves everything: the Jekyll build output,
plus the starward web build copied under `_site/projects/starward/`.

## Current state (diagnosed 2026-11-15)

- DNS hosted at **Porkbun** (NS: `salvador/fortaleza/maceio/curitiba.ns.porkbun.com`).
  No MX records on `stellahu.me` — no email to break.
- `stellahu.me` apex → `A 76.76.21.21` (Vercel) = **Hashnode blog**. `www` → CNAME `hashnode.network`.
  Both to be removed.
- `starward` CNAME → `starward-3pw.pages.dev` exists but is **dangling**: the custom domain was
  never added in the Pages project, so Cloudflare's edge drops TLS for that SNI (verified:
  handshake fails, no certificate served).
- Starward Pages project: `starward-3pw` (Direct Upload via GitHub Actions, manual dispatch +
  `production` environment approval).
- Starward app: Vite + React PWA (`vite-plugin-pwa`), **no client router** (screens switch via
  `useState`), v0 web build makes **no API calls** (Hono backend exists in `src/server/` but is
  not deployed). Deployed artifact = `dist/web/`.
- Jekyll site repo: `github.com/stella-hu-xing/stella-hu-xing.github.io` (Chirpy theme,
  `baseurl: ""`, `_tabs/`: about / archives / categories / tags, `_posts/` empty, GitHub Pages
  via `pages-deploy.yml`). Stays live on `stella-hu-xing.github.io` in parallel.

## Decisions (2026-11-15)

| Decision | Reason |
|---|---|
| Drop Hashnode from the apex; blog self-hosts on Jekyll/Chirpy | `_posts` is empty; no content to migrate; one less third party |
| Reuse the Jekyll repo as the `stellahu.me` site repo (name unchanged) | `<name>.github.io` must match the GitHub username anyway; GH Pages + Cloudflare Pages coexist from one repo |
| Merge the starward web build into the site deploy (one artifact) | Pages deploys are atomic — all paths must ship together; avoids proxy/redirect hacks |
| Rebuild starward with `base: '/projects/starward/'` via env var | Required for asset URLs + PWA scope under a sub-path |
| Keep Porkbun as registrar; move only DNS (nameservers) to Cloudflare | Cloudflare Pages apex custom domains require the zone on Cloudflare |

## Plan

### Phase 1 — starward repo: base-path support
- [ ] `vite.config.ts`: `base: process.env.VITE_BASE ?? '/'`; PWA manifest `scope` / `start_url`
      derive from base; base-prefix icon `src` paths (`icon-192.png`, `icon-512.png`).
- [ ] Local check: `VITE_BASE=/projects/starward/ pnpm build:web`, then assert
      `dist/web/index.html` references `/projects/starward/assets/...`, manifest
      `scope: "/projects/starward/"`, `sw.js` served at `/projects/starward/`.
- [ ] Keep plain `pnpm build:web` (no env) working — local dev and root parity.
- [ ] Retire `starward/.github/workflows/deploy.yml` (the site repo deploys it); keep `ci.yml`.

### Phase 2 — Jekyll site repo
- [ ] `_config_stellahu.yml`: `url: "https://stellahu.me"` (used only in the Cloudflare build via
      `--config _config.yml,_config_stellahu.yml`).
- [ ] `_tabs/projects.md`: project list (starward → `/projects/starward/`; switch-jobs-engine;
      sh-learning-notes; easier-life-cap; this site).
- [ ] `/blog` mapping: redirect to the Chirpy posts/archives tab (or add a Blog tab) — pick at
      implementation time.
- [ ] New workflow `.github/workflows/deploy-stellahu.yml`: checkout both repos → build starward
      (`VITE_BASE=/projects/starward/`) → `jekyll build` with the override config → copy
      `starward/dist/web/*` → `_site/projects/starward/` → `wrangler pages deploy _site
      --project-name=stellahu-me` (manual dispatch + `production` approval, mirroring starward's
      pattern; secrets `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`).

### Phase 3 — dashboards (order matters)
- [ ] Cloudflare: add zone `stellahu.me` (Free plan), let it import existing records. Note the
      2 assigned nameservers.
- [ ] Porkbun: replace the 4 NS with the 2 Cloudflare NS. Wait for zone status **Active**.
- [ ] Cloudflare zone SSL/TLS: **Full (strict)**.
- [ ] Cloudflare Pages: create project `stellahu-me` (Direct Upload) → Custom domains: attach
      `stellahu.me` (zone is on-account → automatic flattened CNAME + cert) and `www.stellahu.me`
      if desired.
- [ ] Cloudflare DNS: delete `A stellahu.me → 76.76.21.21` and `CNAME www → hashnode.network`
      (Pages entries replace them); decide the `starward` CNAME (delete, or keep + 301 rule →
      `/projects/starward/`).
- [ ] Cloudflare Redirect rule: `www.stellahu.me/*` → `https://stellahu.me/$1` (301).
- [ ] Hashnode: remove the `stellahu.me` mapping (blog retires or moves to `blog.stellahu.me` —
      open question).
- [ ] First deploy via the new workflow.

### Phase 4 — verification
- [ ] `dig stellahu.me` resolves to the Pages edge; TLS cert serves for `stellahu.me`.
- [ ] `/`, `/blog`, `/projects/`, `/projects/starward/` all return 200; `www` 301s;
      `starward.stellahu.me` 301s (if kept).
- [ ] Starward PWA: manifest loads at `/projects/starward/manifest.webmanifest`,
      `scope: "/projects/starward/"`, service worker registers, icons resolve, all five
      screens navigate.
- [ ] GH Pages `stella-hu-xing.github.io` still builds and serves (untouched by this plan).
- [ ] Old `starward-3pw.pages.dev` URL behavior confirmed (retire or keep as preview).

## V1 flags (do not act now)
- When the Hono backend ships, the PWA must call an **absolute** API origin — relative `/api/*`
  under `/projects/starward/` would hit the site project and 404. Plan: `app.stellahu.me` (or
  `api.`) → Caddy VM per `agents/ARCHITECTURE.md`. Wire as env (`VITE_API_BASE`) at that time.
- Notes / schedule / countdowns persistence is backend work (see `agents/ARCHITECTURE.md` and
  `agents/DATA_MODEL.md`), not site work.

## Open questions
- [ ] Front page: Chirpy default (recent posts) vs a custom intro-first landing — customize
      during implementation?
- [ ] Hashnode: fully retire, or park at `blog.stellahu.me` as an archive?
- [ ] Retire the `starward-3pw` Pages project once `stellahu-me` is live, or keep as preview?

## Rollback
- DNS: reverting nameservers at Porkbun restores full control; re-adding the `A` / `www`
  records brings back the Hashnode blog.
- Pages: previous deploys remain reachable on `*.pages.dev` URLs; the GH Pages site is never
  touched by this plan.
- Starward: `VITE_BASE ?? '/'` default means local dev and any root-hosted fallback behave
  exactly as today.