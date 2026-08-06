This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Fonts

GT America is licensed from Grilli Type and supplied by Taco Bell. The
`.woff2` files are **not committed** — `app/fonts/*` is gitignored.

Before running the app, copy these five files into `app/fonts/`:

```
GT-America-Standard-Regular.woff2
GT-America-Standard-Regular-Italic.woff2
GT-America-Standard-Bold.woff2
GT-America-Condensed-Bold.woff2
GT-America-Expanded-Bold.woff2
```

Without them the build fails with a module-not-found from `app/fonts.ts`.
That is deliberate — a missing licensed font should be loud, not silently
substituted.

Because the fonts are gitignored, **git-connected Vercel deploys will fail**.
Deploy from your machine instead, with a `.vercelignore` that does not exclude
them:

```bash
npx vercel --prod
```

## Environment

Copy `.env.example` to `.env.local` and fill it in. `SUPABASE_SERVICE_ROLE_KEY`
bypasses row level security — it is server-only and must never gain a
`NEXT_PUBLIC_` prefix.

## Database

Migrations live in `supabase/migrations/`. Apply with `npx supabase db push`.

The safe code, the mapping of code positions to QR codes, and the QR slugs all
live in the database only. None of them are in this repo, and none of them
should ever be.
