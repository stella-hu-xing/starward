# Development environment

> Current scaffold and target local workflow, 2026-11-15. The README defines the chat journal; architecture and implementation plan describe work still to do.

## Toolchain and repository

- VS Code, strict TypeScript, Node.js 22 LTS (the current CI runtime), pnpm version pinned in package.json.
- One package with src/server and src/web; no monorepo/toolchain migration required.
- Keep changes focused and review diffs. Do not push, merge, or deploy without the owner's instruction. Do not assume branch protection or remote environment setup has been verified.
- Agent instructions and the agents directory are the source of conventions. The editor's coding provider is separate from the app's direct Claude runtime API.
- Use synthetic English, Chinese, and mixed-language fixtures. Never use real diary content, production databases, or live paid APIs in ordinary tests.

## Existing commands and their limits

Run from the repository root:

| Command | Current purpose / caveat |
|---|---|
| pnpm install --frozen-lockfile | Install pinned dependencies; SQLite native builds are currently denied |
| pnpm dev | Launch server watch script plus Vite; backend is not yet a working local service |
| pnpm dev:web | Existing frontend preview on port 5173; binds all interfaces, not suitable for private content |
| pnpm dev:server | Watches the legacy server entry; Node listener/startup needs implementation |
| pnpm typecheck | Server then web TypeScript checks; report any failures |
| pnpm typecheck:web | Web-only check; not a substitute for checking the backend |
| pnpm lint | ESLint over the repository |
| pnpm test | Vitest; existing health test is an assertion placeholder, not endpoint coverage |
| pnpm build:web | Build static UI into dist/web |
| pnpm build | Build UI then compile server; does not prove startup works |
| pnpm start | Intended built-server command; not a working backend guarantee |
| pnpm eval:ai | Legacy placeholder; does not evaluate chat/report quality |

There is no pnpm db:migrate script. scripts/migrate.ts calls stub initialization, not a working migration runner. Do not mistake its console output for an applied schema.

pnpm-workspace.yaml currently denies better-sqlite3 build scripts, a holdover from the static shell. M0 must review native-build approval, Node ABI/toolchain compatibility, and reproducible install/setup before real SQLite tests. Do not enable scripts for every dependency indiscriminately.

## Intended local setup (M0 onward)

1. Use the pinned toolchain and resolve baseline install/typecheck/startup failures in a focused implementation task.
2. Configure a loopback-only Hono listener, local SQLite directory, migrations, and a single-owner credential. Keep Vite loopback-only too; use its /api proxy rather than broad CORS.
3. Finalize direct Claude integration, configurable chat/report model IDs, and STT provider/model/accepted formats/upload limits. Review their usage costs and data handling before using personal content.
4. Update .env.example and configuration together. The current template is legacy OpenRouter/S3/MCP/Honeycomb configuration, not the new setup contract; its Google, web-push, and gmail-test entries were removed with the schedule/countdown content on 2026-11-15. Actual .env secrets must never be read into task output or committed. No provider keys in VITE-prefixed variables.
5. Ensure development environment loading is explicit. Do not assume copying a .env file loads it automatically; document the implemented mechanism and required values when M0 is complete.
6. Run the API and UI, log in locally, and verify persistence with a disposable database before connecting real providers.

Local data, SQLite WAL files, snapshots, and credentials stay outside Git. Use a temporary database per integration test. Backup/restore uses a consistent SQLite snapshot, not a naive copy of an open WAL database. No hosted backup service is required.

## Testing and acceptance

Run pnpm typecheck, pnpm lint, pnpm test, and pnpm build for implementation work; verify the relevant frontend build for docs-only work too. Report pre-existing blockers separately, without calling a failing check successful. Consult milestone acceptance checks before marking a feature complete.

Required future coverage: real HTTP health/startup, migrations/repositories, session protection, saved message before provider failure, streamed completion/interruption/retry, transcription limits/cleanup, local-day DST boundaries, report all-conversation coverage/revisions/empty days/provider failures, safe Markdown, and mobile UI at 375px. Mock providers; live API smoke tests are separate opt-in work using non-sensitive data and an explicit cost budget.

## CI and deployment today

The existing .github/workflows/ci.yml installs dependencies, checks web types, lints, runs Vitest, and builds the frontend. It does not typecheck/build the server or test real persistence yet. M0 must close that gap before treating CI as backend validation.

The existing deploy.yml manually uploads the successful static web artifact to Cloudflare Pages on main, with a production environment declaration. Actual reviewer configuration/domain status is external and unverified here. It cannot run the Node API, SQLite, transcription, or scheduler. Do not trigger deployment as part of this reset.

Dockerfile, docker-compose.yml, and Caddyfile are legacy scaffolding, not a requirement to provision a VPS/GCP/Tailscale deployment. Public hosting and remote phone access are separate decisions; local v1 does not depend on them. Mobile layout can be tested locally without exposing private APIs to the network.

No agent.yml exists. Earlier docs described hypothetical phone-triggered agents, labels, and hosted observability as though implemented; these are not prerequisites or active project guarantees. The personal-site migration is tracked separately and does not block local app work.
