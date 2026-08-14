# Karigar Workshop

A responsive order and production tracker for small glass, tile, acrylic, and fabrication shops.
It replaces a paper register or spreadsheet with simple owner and worker screens.

## Technology

- Next.js 16 App Router and TypeScript
- PostgreSQL with Drizzle ORM
- Database-backed username/password sessions
- Cloudflare R2 for private work images
- Plain responsive CSS with light and dark themes
- Prettier and ESLint for consistent code quality

## Access model

| Role                   | Access                                                                                 |
| ---------------------- | -------------------------------------------------------------------------------------- |
| Platform Administrator | Creates customer shops and gives the first Owner access                                |
| Owner                  | Full access inside their shop, including orders, payments, images, Owners, and Workers |
| Worker                 | Views shop orders and updates production or delivery status                            |

Every shop is isolated by `shop_id`. An Owner cannot access another shop. An Owner can add more
Owners or Workers, but cannot disable their own account or the final active Owner.

## 1. Create the PostgreSQL database with Neon

1. Create an account at [Neon](https://neon.tech/).
2. Create a project, choosing the region closest to your users.
3. Open **Connect** and copy the pooled PostgreSQL connection string.
4. Copy the environment template:

```bash
cp .env.example .env
```

5. Set the copied value as `DATABASE_URL` in `.env`:

```env
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
INITIAL_SETUP_TOKEN=use-a-long-random-private-value
```

The application uses normal PostgreSQL, not Neon-specific APIs. The database can later move to
Railway, Render, AWS RDS, or another PostgreSQL provider without changing the data model.

## 2. Install and prepare the database

Node.js 20.9 or newer and pnpm are required.

```bash
pnpm install
pnpm db:migrate
pnpm dev
```

Open [http://localhost:3000/setup](http://localhost:3000/setup). Enter the
`INITIAL_SETUP_TOKEN` and create your Platform Administrator username and password. This setup page
automatically closes permanently after the first account is created.

Platform Administrator login:

```text
Shop code: ADMIN
Username: the username created at /setup
Password: the password created at /setup
```

From `/admin`, create a customer shop, its shop code, and its first Owner. That Owner signs in using
the shop code and can create more Owners and Workers.

## 3. Configure Cloudflare R2 images

Create a private R2 bucket and an R2 API token with object read/write access. Add these values to
`.env.local`:

```env
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
```

Add an R2 CORS policy for the local and production website origins. The required browser method is
`PUT`, and the required header is `Content-Type`. Images are uploaded through five-minute signed
URLs and displayed through short-lived signed read URLs. Accepted files are JPG, PNG, or WebP up to
10 MB.

## Selectable spreadsheet values

- Order: Confirmed, Hold, Cancelled
- Payment: Advance received, Payment done, Balance
- Thickness: 4, 5, 8, 10, 12, 18, 24, 28, and 30 mm
- Materials: Glass, Acrylic, Tiles, Granite, Door, Almirah, SS-Sheet, ACP, MDF, and LED
- Production: Design, Cutting, Pre-coat, Printing, and Post-coat
- Work status: Waiting, In process, Completed
- Delivery: Pending, Delivered

## Commands

```bash
pnpm dev           # local development
pnpm build         # production build
pnpm lint          # ESLint
pnpm format        # format all source files
pnpm format:check  # verify formatting in CI
pnpm db:generate   # generate a migration after schema changes
pnpm db:migrate    # apply pending PostgreSQL migrations
```

## Deploy on Vercel

1. Push the repository to GitHub and import it into Vercel.
2. Add all production environment variables in Vercel Project Settings.
3. Run `pnpm db:migrate` once against the production `DATABASE_URL`.
4. Deploy, visit `/setup`, and create the Platform Administrator.
5. Keep `INITIAL_SETUP_TOKEN` private. It cannot be reused after setup.

Hosting and database credentials must never be committed to Git. `.env` and `.env.local` are
already ignored.
