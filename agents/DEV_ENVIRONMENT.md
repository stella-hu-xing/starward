# Development Environment

How the app is built, reviewed, and deployed. This document covers the workflow only. For what runs in production, see `ARCHITECTURE.md`.

## Principles

- **Laptop first.** Most development happens on the owner's laptop in VS Code.
- **OpenRouter for all AI coding.** Every model call, whether in the editor or in CI, uses the OpenRouter key. No subscription-based coding agents for daily work.
- **No cloud coding agents in v1.** The project is small enough for local agents. Revisit only if tasks regularly exceed what a local session can handle.
- **Git is the control plane.** Changes arrive as pull requests. Deploys are triggered from GitHub. The phone is a remote for GitHub, not a second development machine.
- **The agent proposes, the owner merges.** No agent commits directly to `main`.

## Repository

- Private GitHub repository.
- `main` is protected: pull request required, CI must pass (`typecheck`, `lint`, `test`), no force pushes.
- Feature work happens on short-lived branches named `m1/notes-capture` style, one milestone task per branch.
- `AGENTS.md` and `docs/` are the source of conventions for humans and agents alike.

## Local development (laptop)

- Editor: VS Code.
- AI coding extension: Cline or Kilo Code, configured with OpenRouter as the provider. Use a separate OpenRouter key with a monthly spending cap, stored in the extension's settings, not in the repo.
- Model choice: a cheap model for routine edits and tests; a stronger model for date logic, email extraction, and anything touching `ai/`.
- Run `pnpm dev` locally. Use a local SQLite file in `./data/`, never the production database.
- Use test fixtures for email and calendar data. Never point local development at the real Gmail or Google Calendar account unless testing the OAuth flow.

## Phone workflow

The phone does three things: create work, review work, and trigger deploys. It does not run code.

| Task | Tool on phone |
|---|---|
| Describe a change, by typing or dictating | GitHub Mobile: create an issue with the `agent` label |
| Review the agent's pull request | GitHub Mobile: read the diff, leave comments, approve |
| Merge | GitHub Mobile |
| Deploy to production | GitHub Mobile: run the `deploy` workflow manually |
| Check whether the app is up | Browser: `app.stellahu.me/api/health`, or Honeycomb |
| Check errors and traces | Honeycomb mobile web |

GitHub Mobile is the only phone app required. No SSH client is needed on the phone for normal use.

## Agent-driven changes (phone-initiated)

Each issue has two modes. The mode decides what the agent is allowed to do.

- **Discuss mode (default).** The agent can read the repo and comment on the issue. It cannot create branches, push commits, or open PRs. Its token has read-only contents permission, so this is enforced by GitHub, not only by instructions.
- **Build mode.** Entered only after the owner approves. The agent can create the `agent/<issue-number>` branch, commit, run tests, and open a draft PR. It can apply revisions from review comments.

Modes are set with labels. A new issue with the `agent` label starts in discuss mode. The agent never changes its own mode.

Flow:

1. The owner opens an issue from the phone with the `agent` label and describes the change. Dictation is fine. Reference the milestone task if possible, for example `M1: add tag suggestion retry`.
2. Discuss mode. The agent reads the issue, `AGENTS.md`, and the relevant docs. It replies with its understanding, a proposed plan, any trade-offs, and any questions. Questions can be several at once here, since the owner is expected to answer them in one message. Each owner comment triggers a new discuss run, so the plan can be refined over several turns.
3. Approval. When the owner is satisfied, the owner comments `/go`. The workflow swaps the `agent-discuss` label for `agent-build`, then starts a build run.
4. Build mode. The agent creates `agent/<issue-number>`, makes the change, runs `pnpm typecheck && pnpm lint && pnpm test`, opens a draft PR, and comments with a summary and the test result. It writes the agreed decisions into the PR description's "Decisions" section.
5. Revisions. In build mode, owner comments on the issue or review comments on the PR trigger a run that applies the requested change to the same branch and replies with what changed. If the owner wants to rethink the approach, the owner comments `/discuss`, which switches back to discuss mode. The agent does not push further commits in discuss mode, so the branch stays as it was.
6. Merge. The owner merges on the phone once CI is green and the diff matches what was agreed.

Limits of this design, which the owner should expect:

- Latency: each turn takes a few minutes (runner startup, dependency install, tests). It's a thread, not a live chat.
- The agent remembers nothing between runs except the issue thread, the branch, the PR description, and the docs. Anything important must be written into one of those.
- Each issue has separate turn limits: by default 10 discuss runs and 5 build runs. When a limit is reached, the agent says so in a comment and asks the owner to continue on the laptop. These numbers are starting defaults, to be tuned after the first test.
- Real-time chat from the phone would need a long-running service, such as a Telegram bot in front of a hosted agent. That's a separate component and is not part of v1.

Workflow rules:

- Triggers: `issues` (labeled `agent`), `issue_comment` (created), and `pull_request_review_comment` (created).
- Only the owner's GitHub account can trigger a run or change a mode. The workflow checks the actor before doing anything, and ignores everyone else.
- Discuss runs use a token with read-only contents permission and no push access. Build runs use a token limited to the `agent/*` branches.
- The `/go` command is accepted only from the owner, and only on an issue currently in discuss mode.
- A concurrency group per issue number prevents two runs from overlapping.
- Each run has a timeout of 20 minutes.
- Every reply from the agent includes the mode, the model slug, approximate token usage, and a link to the workflow run log.
- Changes to `.github/workflows/`, `Dockerfile`, `docker-compose.yml`, `Caddyfile`, `migrations/`, or `src/server/ai/` are labelled `needs-laptop-review` automatically.

## First test run (verification)

Run these steps in order before relying on the workflow. Do not skip ahead. Use a low-risk task, such as adding a unit test for `/api/health`.

Prerequisites: the setup checklist below is done, and `agent.yml`, `ci.yml`, and `deploy.yml` exist in the repo.

1. **Discuss only.** Open an issue with the `agent` label. Expected: a plan comment within a few minutes, the label `agent-discuss`, no new branch, no PR. Check the run log: the token shows read-only contents.
2. **Discuss revision.** Reply with a constraint, such as "keep it to one test file". Expected: an updated plan. Still no branch, no PR.
3. **Approval.** Comment `/go`. Expected: the label changes to `agent-build`, branch `agent/<n>` is created, CI runs, a draft PR opens, and the summary comment includes the mode, model slug, token usage, and run log link. The PR description has a "Decisions" section.
4. **Build revision.** Leave a review comment on the PR asking for one small change. Expected: a new commit on the same branch, and a reply saying what changed.
5. **Back to discuss.** Comment `/discuss`, then ask for another change. Expected: a plan only, with no new commits on the branch.
6. **Permission check.** Ask a non-owner account to comment on the issue, if one is available. Expected: no reply and no label change. If no second account is available, confirm in the workflow file that the actor check exists and is the first step.
7. **Limits.** Temporarily set the discuss limit to 2 and confirm the agent stops and asks you to continue on the laptop. Restore the default afterwards.
8. **Merge and deploy.** Mark the PR ready and merge it once CI is green. Confirm `main` changed only through the merge. Run `deploy.yml` from GitHub Mobile, approve it, and confirm `/api/health` returns 200 and Honeycomb shows the deploy marker.

Pass criteria: steps 1 to 5 behave as described, no run writes to `main`, and the deploy completes with an approval tap.

Stop immediately if any run pushes to `main`, creates a branch while in discuss mode, or replies to a non-owner. To stop: disable `agent.yml` in the GitHub Actions tab, then revoke the OpenRouter key and create a new one.

## Deploy workflow

Deploys are manual, triggered from the phone or laptop.

1. The owner runs `deploy.yml` from GitHub (workflow dispatch) on `main`.
2. The workflow connects to the GCP VM over Tailscale or IAP, using a deploy key stored as a GitHub Actions secret.
3. On the VM it runs: `git pull --ff-only`, `docker compose up -d --build`, then waits for `/api/health` to return 200.
4. If the health check fails, the workflow runs `docker compose logs --tail 200` and marks the run as failed. It does not roll back automatically in v1. Rollback is `git checkout <previous-sha> && docker compose up -d --build`.
5. Deployment is protected by a GitHub environment named `production` with required reviewer set to the owner, so each deploy needs one approval tap on the phone.

Secrets used by deploy: the VM deploy key, the Tailscale auth key (or IAP service account), and the production host name. Production application secrets stay in `.env` on the VM and are never copied into GitHub Actions.

## Observability in the workflow

- Each deploy adds a Honeycomb marker with the git SHA, so traces can be compared before and after a change.
- The deploy health check and the post-deploy smoke test both emit a span, so a failed deploy is visible in Honeycomb as well as in GitHub.

## What is deliberately not in v1

- Cloud coding agents (Codex cloud, Claude Code on the web, Copilot coding agent). Revisit if local and CI-based agents struggle with tasks.
- A separate staging environment. Covered by the shared-VM safety rules in `ARCHITECTURE.md`.
- Automatic deploys on merge. Deploys stay manual until the owner decides otherwise.
- Any tool that needs an always-on laptop. The laptop is not a server.

## Setup checklist

- [ ] Private repo created, `main` protected, CI workflow passing
- [ ] OpenRouter key created with a monthly spending cap, stored in editor settings and as a GitHub secret for the agent
- [ ] Cline or Kilo Code installed and pointed at OpenRouter
- [ ] `agent.yml` and `deploy.yml` workflows added in the first M0 task
- [ ] `production` environment created with the owner as required reviewer
- [ ] Tailscale (or IAP) access to the VM configured, with the deploy key scoped to deployment only
- [ ] GitHub Mobile installed and signed in; a test issue with the `agent` label confirmed to trigger nothing harmful in a dry-run mode
- [ ] First test run completed and passed (see the section above)
- [ ] Check current GitHub Actions free minutes for a private repository and the Honeycomb free tier before relying on either

## Open questions

1. Agent CLI: Aider is the proposed default because it supports OpenRouter and runs non-interactively. Confirm after a small trial.
2. Whether the agent runs on GitHub-hosted runners (simplest) or a self-hosted runner on the VM (uses the VM's CPU and RAM, not recommended on the `e2-micro`).
3. Whether the owner wants the `needs-laptop-review` rule to cover all of `src/server/` or only `src/server/ai/`.
4. Whether a real-time chat interface is worth the always-on component it needs, or whether the issue-thread flow is enough.
5. Turn limits: 10 discuss runs and 5 build runs per issue are starting defaults. Confirm or adjust after the first test run.
