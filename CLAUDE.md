# Global Claude Instructions

These rules apply to every project. Project-level CLAUDE.md files can extend but not override safety and quality rules defined here.

---

## Code Generation Rules

### Always produce working code
- Every function, component, or module you generate must be complete and runnable — no placeholders like `// TODO: implement this` unless explicitly asked.
- If you are unsure how to implement something correctly, say so before generating incomplete code.
- Never generate code that you know will fail at runtime.

### TypeScript / type safety
- Use TypeScript strict mode by default in all TS/JS projects.
- No `any` type unless absolutely unavoidable — add an inline comment explaining why.
- No `@ts-ignore` without a comment explaining the suppression.

### Error handling
- All async functions must handle errors explicitly — no silent catches.
- API routes and server actions must always return structured error responses, never throw unhandled exceptions to the client.

### Environment variables
- Never hardcode secrets, tokens, or URLs that belong in env vars.
- Always read from `process.env` and validate presence at startup.
- Always maintain a `.env.example` with all required keys (no values).

### No dead code
- Do not leave commented-out code blocks in generated output.
- Do not generate unused imports, variables, or functions.

---

## Git Commit Rules

**After every meaningful code generation, create a git commit.**

A "meaningful generation" is any of:
- A new file created
- An existing file meaningfully changed (not just formatting)
- A bug fixed
- A dependency added or removed
- A config change (Docker, CI, env, build)

### Commit format
Follow Conventional Commits:

```
<type>(<scope>): <short description>

[optional body — what changed and why]
```

**Types:** `feat`, `fix`, `refactor`, `test`, `chore`, `docs`, `style`, `perf`

**Examples:**
```
feat(api): add /api/lookup route with Redis caching
fix(validate): reject private IP ranges before lookup
test(lookup): add e2e tests for IPv4 and IPv6 lookup flows
chore(docker): add docker-compose for local dev stack
docs: update CLAUDE.md with Redis cache TTL details
```

### Commit rules
- One logical change per commit — do not batch unrelated changes.
- Always run lint and type-check before committing. Do not commit code that fails either.
- Never commit: `.env.local`, secrets, `node_modules`, build artifacts.
- Commit message must be in present tense, imperative mood ("add", not "added" or "adds").

### Commit commands to run
```bash
git add <specific files>   # Never use `git add .` blindly
git commit -m "<message>"
```

---

## Testing Rules

### Always write tests alongside code
- Every new feature or API route must have corresponding tests generated at the same time — not after.
- Tests are not optional. Do not mark a task complete without passing tests.

### Test types by layer

| Layer | Tool | When required |
|---|---|---|
| Unit | Vitest / Jest | All utility functions, validators, parsers |
| Integration | Vitest + supertest | All API routes |
| E2E | Playwright | All user-facing flows |

### E2E test rules (Playwright)
- Cover the **happy path** and at least **two failure/edge cases** per feature.
- Test from the user's perspective — interact with the UI as a user would (fill inputs, click buttons, assert visible text).
- Never assert on internal implementation details (class names, internal state).
- Tests must pass in CI — no `page.waitForTimeout()` as a workaround; use `waitForSelector` or `waitForResponse`.

**Minimum E2E coverage per feature:**
```
✅ Happy path — valid input, correct result shown
✅ Invalid input — user sees an error message
✅ Edge case — empty input, boundary value, or network error state
```

### Before marking any task done
```bash
pnpm test          # unit + integration
pnpm test:e2e      # Playwright E2E
pnpm tsc --noEmit  # type check
pnpm lint          # lint
```
All four must pass. If a test fails, fix the code — do not skip or comment out the test.

### Test file location
```
src/
  lib/
    validate.ts
    validate.test.ts     # co-located unit test
app/
  api/
    lookup/
      route.ts
      route.test.ts      # integration test
tests/
  e2e/
    lookup.spec.ts       # Playwright E2E
```

---

## Refactoring Rules

- Never refactor and add features in the same commit.
- When refactoring, tests must pass before and after — run the test suite both times.
- Do not rename files or move modules without updating all imports and verifying build passes.

---

## Communication Rules

- If a task is ambiguous, ask **one clarifying question** before proceeding — not five.
- If multiple approaches exist, briefly state the tradeoffs and pick the best one — do not ask which to use unless the choice has significant long-term impact.
- When you make an assumption, state it explicitly: "I'm assuming X because Y."
- Do not explain what you are about to do at length — just do it, then summarise what was done.

---

## What Claude Should Never Do

- Never generate code and not commit it
- Never skip tests to save time
- Never use `any` silently
- Never leave TODOs in generated code without flagging them
- Never run `git add .` without reviewing what's being staged
- Never commit without passing lint and type-check
- Never hardcode secrets or environment-specific values
- Never generate a "skeleton" and call it done
