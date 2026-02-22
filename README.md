# Noel Newman News Network

A modern dark-mode news and blog platform built with Next.js, Prisma, and TypeScript.

## Features

- Public multimedia newsroom experience
- Mixed media blocks in each post:
  - YouTube embeds
  - External video URLs
  - Images
  - Audio
  - Generic embed iframe URLs
- Private staff portal at `/staff/login`
- Staff post management:
  - Draft posts
  - Scheduled publishing
  - Published posts
- Proprietor profiles:
  - Noel Fleming
  - Phil Newman

## Tech Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS (plus custom CSS theme)
- Prisma + SQLite
- Cookie-backed staff sessions

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Configure environment:

```bash
cp .env.example .env
```

3. Create database and run migrations:

```bash
npm run db:migrate
```

4. Seed staff accounts and a sample post:

```bash
npm run db:seed
```

5. Start development server:

```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000)

## Default Staff Credentials

Set in `.env` as `SEED_STAFF_PASSWORD` (default is `NNNN-ChangeMe-2026!`):

- Username: `noelfleming`
- Username: `philnewman`

Both users are seeded as admin-level staff.

## Project Scripts

- `npm run dev` - Start dev server
- `npm run build` - Build production app
- `npm run start` - Run production server
- `npm run lint` - Run lint checks
- `npm run db:migrate` - Apply Prisma migrations
- `npm run db:seed` - Seed database
- `npm run db:studio` - Open Prisma Studio
