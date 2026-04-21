# Copilot Instructions — Chess Tournaments LT

## Build, Test, and Lint

```bash
npm run build          # Production build (requires DATABASE_URL, even a fake one)
npm run lint           # ESLint
npm test               # Run all tests with Vitest
npx vitest run src/lib/scraper.test.ts   # Run a single test file
npx vitest -t "parses Rapid"             # Run a single test by name
npm run db:generate    # Regenerate Prisma client after schema changes
npm run db:push        # Push schema changes to the database
```

Always run `npx prisma generate` after modifying `prisma/schema.prisma` — the generated client at `src/generated/prisma` is gitignored and must be regenerated locally and in CI.

## Architecture

This is a **Next.js 15 App Router** fullstack application that scrapes chess-results.com for Lithuanian FIDE tournaments and serves them via a web UI.

**Data flow**: chess-results.com → `src/lib/scraper.ts` (Cheerio) → `POST /api/scrape` → PostgreSQL (Prisma) → `GET /api/tournaments` → React frontend

Key architectural layers:

- **Scraping** (`src/lib/scraper.ts`): Cheerio-based HTML scraper for `chess-results.com/fed.aspx?lan=1&fed=LTU`. Pure functions are extracted to `scraper-utils.ts` for testability.
- **API routes** (`src/app/api/`): Next.js Route Handlers. `POST /api/scrape` triggers a scrape and upserts tournaments. `GET /api/tournaments` returns paginated, filterable results.
- **Database** (`prisma/schema.prisma`): PostgreSQL via Neon. Core models: `Tournament`, `TournamentPlayer`, `ScrapeLog`. The Prisma singleton is in `src/lib/db.ts`.
- **UI components** (`src/components/`): shadcn/ui components in `ui/`, app-specific components in `tournaments/` and `layout/`.
- **Types** (`src/types/tournament.ts`): Shared types for scraped data and API responses. Both server-side `ScrapedTournament` and client-safe serializable `Tournament`.

## Conventions

- **UI components**: Use shadcn/ui (`npx shadcn@latest add <component>`). Components live in `src/components/ui/`. Do not manually create base UI components.
- **Path alias**: Use `@/` for imports from `src/` (e.g., `import { prisma } from "@/lib/db"`).
- **Scraper logic**: Keep pure/testable functions in `scraper-utils.ts`. The main `scraper.ts` handles HTTP fetching and DOM parsing.
- **API route pattern**: Use Next.js Route Handlers (`route.ts` files). The scrape endpoint is protected by a `CRON_SECRET` bearer token in production.
- **Database changes**: Modify `prisma/schema.prisma`, then run `npx prisma generate` and `npx prisma db push` (dev) or `npx prisma migrate dev` (with migration history).
- **Environment variables**: Never commit `.env`. Use `.env.example` as template. Required: `DATABASE_URL`. Optional: `CRON_SECRET`.
- **Time controls**: Tournaments are categorized as `STANDARD` (St), `RAPID` (Rp), or `BLITZ` (Bz) — these map to chess-results.com's abbreviations.
- **CI pipeline**: GitHub Actions runs lint → test → build on every push/PR to `main`. The build step uses a fake `DATABASE_URL` since it only needs the Prisma client generated.
