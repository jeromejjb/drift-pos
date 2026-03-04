# Testing

## Unit tests (Vitest)

```bash
npm test
```

Runs unit tests for the API and restaurant app.

### API (`apps/api`)

- **Framework:** Vitest
- **Tests:** `src/**/*.test.ts`
- **Run:** `npm run test -w apps/api` or `cd apps/api && npm test`
- **Watch:** `npm run test:watch -w apps/api`

Example: `src/lib/rates.test.ts` — fee rate constants and helpers.

### Restaurant (`apps/restaurant`)

- **Framework:** Vitest + React Testing Library + jsdom
- **Tests:** `src/**/*.test.{ts,tsx}`
- **Run:** `npm run test -w apps/restaurant` or `cd apps/restaurant && npm test`
- **Watch:** `npm run test:watch -w apps/restaurant`

Example: `src/lib/config.test.ts` — config routes.

## Integration / flow tests

- **`npm run test:output`** — Checklist and quick API checks
- **`npm run test:restaurant`** — Restaurant flow (register → menu → orders)
