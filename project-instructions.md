# Claude Project Instructions — IP Pulse

## What this project is
IP Pulse is a public Next.js tool that lets users look up IP geolocation, ISP/ASN info, threat status, and Whois data via ipinfo.io. Stack: Next.js 14 (App Router), TypeScript, Tailwind, PostgreSQL, Redis, Docker, deployed on Railway.

---

## Code quality — non-negotiable
- TypeScript strict mode always. No `any`, no `@ts-ignore` without a comment.
- All async code must handle errors explicitly. API routes return structured `{ error: string }` JSON — never throw to the client.
- No dead code, no commented-out blocks, no unused imports.
- Never hardcode secrets. All config via `process.env`. Keep `.env.example` updated.

---

## Git — commit after every meaningful change
After generating or modifying any file, run a git commit using Conventional Commits format:

```
feat(api): add /api/lookup route with Redis caching
fix(validate): reject private IP ranges
test(lookup): add e2e tests for lookup flow
chore(docker): add docker-compose for local dev
```

Rules:
- Stage specific files — never `git add .` blindly.
- One logical change per commit.
- Run lint + type-check before committing. Do not commit failing code.
- Never commit `.env.local`, secrets, or build artifacts.

---

## Testing — always write tests with the code
Every feature ships with tests. Do not mark anything done without passing tests.

- **Unit tests (Vitest):** all utility functions and validators — co-located as `filename.test.ts`.
- **Integration tests (Vitest + supertest):** all API routes — co-located as `route.test.ts`.
- **E2E tests (Playwright):** all user-facing flows — in `tests/e2e/`.

Minimum E2E coverage per feature:
1. Happy path — valid input produces correct result
2. Invalid input — user sees the right error message
3. Edge case — empty input, boundary value, or simulated network failure

Before marking any task done, all four must pass:
```bash
pnpm test
pnpm test:e2e
pnpm tsc --noEmit
pnpm lint
```

If a test fails — fix the code, not the test.

---

## Project-specific rules
- Redis cache key format: `ip:lookup:<normalized_ip>` (lowercase). TTL: 86400s.
- Validate IP on both client and server. Reject private ranges, loopback, multicast.
- Copy-to-clipboard on every data field using `navigator.clipboard.writeText()`. Show inline "Copied!" state — no external toast library.
- No auth, no maps, no bulk upload, no dark mode in v1. Do not add these unless explicitly asked.
- Railway injects `DATABASE_URL` and `REDIS_URL` automatically — never hardcode them.

---

## Communication
- Ask one clarifying question if something is ambiguous — not multiple.
- State assumptions explicitly before proceeding.
- Don't explain what you're about to do — do it, then summarise what changed.
