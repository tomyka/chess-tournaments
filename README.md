# Chess Tournaments LT ♚

A web application for browsing FIDE-registered chess tournaments in Lithuania. Data is sourced from [chess-results.com](https://chess-results.com/fed.aspx?lan=1&fed=LTU) and refreshed on a schedule.

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router, TypeScript)
- **UI**: [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) + [Framer Motion](https://www.framer.com/motion/)
- **Database**: PostgreSQL via [Neon](https://neon.tech/) (serverless)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Scraping**: [Cheerio](https://cheerio.js.org/)
- **Testing**: [Vitest](https://vitest.dev/)
- **CI/CD**: GitHub Actions
- **Hosting**: [Vercel](https://vercel.com/)

## Getting Started

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your Neon database URL

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm test` | Run tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to database |
| `npm run db:migrate` | Create and apply migration |
| `npm run db:studio` | Open Prisma Studio |

## Data Source

Tournament data is scraped from chess-results.com's Lithuanian federation page. The scraper runs as a Vercel Cron Job every 6 hours, hitting `POST /api/scrape`. It can also be triggered manually.

## License

MIT
