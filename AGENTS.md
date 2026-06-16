# AGENTS — Split-Wiser

> Entry point for any AI agent or human contributor working in this repository. Read this first, then `ARCHITECTURE.md` and `DESIGN.md` before changing code.

## Mission

Split-Wiser is a lightweight, production-ready bill-splitting web app that integrates with [Splitwise](https://www.splitwise.com/). Users connect their Splitwise account, pick a group and members, enter itemised amounts (with GST and discounts), and post the resulting expense back to Splitwise — split correctly down to the last cent.

## Tech stack

| Concern | Choice |
| --- | --- |
| Framework | [SvelteKit 2](https://kit.svelte.dev/) on [Svelte 5](https://svelte.dev/) (runes) |
| Language | TypeScript, **strict** mode, no `.js` files in `src/` |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/) with `@tailwindcss/vite` |
| UI primitives | [shadcn-svelte](https://www.shadcn-svelte.com/) on [bits-ui](https://www.bits-ui.com/), `tailwind-variants`, `lucide-svelte` icons |
| State | Svelte 5 runes (`$state`, `$derived`) in `.svelte.ts` modules |
| Validation | [zod](https://zod.dev/) at every server endpoint boundary |
| Splitwise SDK | [`splitwise-ts`](../docs/getting-started.md) — used **server-only** |
| Hosting | [Netlify](https://www.netlify.com/) via `@sveltejs/adapter-netlify` (server endpoints become Netlify Functions automatically — free tier, no separate backend) |
| Tests | [Vitest](https://vitest.dev/) + [@testing-library/svelte](https://testing-library.com/docs/svelte-testing-library/intro/) + [Playwright](https://playwright.dev/) smoke |

The app is a SvelteKit project at the repo root. The previous Angular 19 implementation lived in this same workspace and has been removed in favour of the rewrite.

## Rules of the road

1. **TypeScript strict, no `any`.** Use `unknown` + zod when shape is uncertain. `noUncheckedIndexedAccess` is on.
2. **No JavaScript files in `src/`.** All app code is TypeScript or Svelte.
3. **Server-only secrets.** `SPLITWISE_CLIENT_SECRET` and `SESSION_COOKIE_SECRET` are read via `$env/static/private` and **never** imported from client modules. SvelteKit will reject this at build time — do not work around it.
4. **All Splitwise API calls go through `+server.ts` endpoints.** The browser never sees the access token, never holds the client secret, and never calls `secure.splitwise.com` directly. The session cookie is HttpOnly + Secure + SameSite=Lax.
5. **Validate at the boundary.** Every endpoint validates inputs with a zod schema from `src/lib/schemas/`.
6. **Pure math is pure.** Domain math (`calculateTotals`, `buildExpensePayload`, `splitMultiPersonItem`) lives in `src/lib/split/` and is unit-tested. Don't sprinkle calculation into components.
7. **Naming**: kebab-case files, PascalCase Svelte components, camelCase identifiers, UPPER_SNAKE env vars. See `ARCHITECTURE.md`.
8. **Design tokens come from `DESIGN.md`.** Don't introduce ad-hoc colors, radii, or shadows. Use Tailwind tokens that map to the documented scale.
9. **Conventional Commits** on every commit (`feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`).
10. **Minimum-impact changes.** Don't rewrite working code while fixing something else. Don't add features that weren't asked for.

## Common commands

```sh
npm install
npm run dev          # http://localhost:5173
npm run build        # production build
npm run preview      # preview the production build locally
npm run test         # vitest unit + component
npm run test:e2e     # playwright
npm run check        # svelte-check (type-check)
npm run lint         # eslint + prettier --check
```

## Reference

- [docs/](docs/) — Full `splitwise-ts` SDK reference (getting-started, expenses, groups, friends, comments, notifications, users, utilities, other).
- [ARCHITECTURE.md](ARCHITECTURE.md) — Folder layout, data flow, request lifecycle, error model, env vars, testing pyramid.
- [DESIGN.md](DESIGN.md) — Design tokens, typography, components, accessibility, motion.
- [README.md](README.md) — Local setup, env-var contract, deployment notes.

## OAuth credentials (developer setup)

Get a Splitwise OAuth app at <https://secure.splitwise.com/oauth_clients>. Register **two** redirect URIs:

- `http://localhost:5173/auth/callback` (local dev)
- `https://<your-netlify-site>.netlify.app/auth/callback` (production)

Copy `.env.example` → `.env` and fill in the values. Generate `SESSION_COOKIE_SECRET` with `openssl rand -base64 32`.
