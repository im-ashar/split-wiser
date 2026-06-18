# Split-Wiser

The SvelteKit + TypeScript implementation of Split-Wiser — a calculator-style web app that posts itemised, GST/discount-aware expenses to [Splitwise](https://www.splitwise.com/).

## Stack

- [SvelteKit 2](https://kit.svelte.dev/) on [Svelte 5](https://svelte.dev/) (runes)
- TypeScript strict, [Tailwind v4](https://tailwindcss.com/), [bits-ui](https://bits-ui.com/), [@lucide/svelte](https://lucide.dev/)
- [`splitwise-ts`](docs/getting-started.md) used **server-side only**
- Deploy: [`@sveltejs/adapter-netlify`](https://kit.svelte.dev/docs/adapter-netlify) (server endpoints become Netlify Functions automatically)

See [AGENTS.md](AGENTS.md), [ARCHITECTURE.md](ARCHITECTURE.md), [DESIGN.md](DESIGN.md) for the full picture.

## Local setup

1. Install deps:
   ```sh
   npm install
   ```
2. Copy env template and fill in values:
   ```sh
   cp .env.example .env
   ```
   Required:
   - `SPLITWISE_CLIENT_ID`, `SPLITWISE_CLIENT_SECRET` from <https://secure.splitwise.com/oauth_clients>
   - `SPLITWISE_REDIRECT_URI` — `http://localhost:5173/auth/callback` for dev
   - `SESSION_COOKIE_SECRET` — generate with `openssl rand -base64 32`
3. Register **both** redirect URIs in your Splitwise app:
   - `http://localhost:5173/auth/callback`
   - `https://<your-site>.netlify.app/auth/callback`

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server on <http://localhost:5173> |
| `npm run build` | Production build via `adapter-netlify` |
| `npm run preview` | Preview the built app |
| `npm run check` | `svelte-check` (type-check) |
| `npm run test` | Vitest unit + component tests |
| `npm run test:watch` | Vitest in watch mode |
| `npm run test:e2e` | Playwright smoke (run `npx playwright install` first) |
| `npm run lint` | Prettier + ESLint check |
| `npm run format` | Prettier write |

## Deployment

[`netlify.toml`](netlify.toml) is configured to build with `npm ci && npm run build` and publish from `build/`. The Netlify adapter auto-registers `+server.ts` / `+page.server.ts` files as functions — there's nothing to set up beyond pushing a branch and adding env vars in the Netlify dashboard.

## Verifying the math

The bill-splitting math is locked behind unit tests in [src/lib/split/](src/lib/split/):

- [calculate-totals.test.ts](src/lib/split/calculate-totals.test.ts) — GST + discount math
- [build-expense-payload.test.ts](src/lib/split/build-expense-payload.test.ts) — payload shape and the rounding-discrepancy fix on the payer's owed share
- [split-multi-person-item.test.ts](src/lib/split/split-multi-person-item.test.ts) — even split, replicate, item-level discount, dedup

Run `npm run test` — all should pass before deploying.
