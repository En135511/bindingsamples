# 🎓 Graduation Invitation

Personal, animated graduation invitations that you share on WhatsApp.

Each guest gets their own private link. When they open it they see a sealed envelope with their
name on it. They tap it, and it opens into an invitation card with the event details, a
countdown, "add to calendar" buttons and an RSVP form. You track who opened their link and who
is coming from a private dashboard.

| Envelope | Invitation | Dashboard |
|---|---|---|
| ![Envelope](docs/screenshots/2-envelope.png) | ![Invitation](docs/screenshots/4-invitation.png) | ![Dashboard](docs/screenshots/7-dashboard-after.png) |

## How it works

1. Go to `/admin`, log in with your password and create your event.
2. Add guests, one per line: `Aunt Mary, +254 712 345678, 2` (name, optional WhatsApp number,
   optional number of seats).
3. Press **WhatsApp** next to a guest. WhatsApp opens with a ready-made message and their link.
   The link shows a preview card with their name, your name and the date.
4. Watch the dashboard as people open their invitations and RSVP.

## Tech stack

- **Next.js 16** (App Router, server actions) with TypeScript
- **Tailwind CSS 4** for styling, **Framer Motion** for the envelope and confetti animations
- **Postgres** through **Drizzle ORM**
- Hosting: **Vercel** (free Hobby plan) and **Neon** Postgres (free tier)

## Run it locally

You need Node.js 20+ and a Postgres database.

```bash
npm install
cp .env.example .env          # then fill in DATABASE_URL and ADMIN_PASSWORD
npm run db:migrate            # creates the tables
npm run dev                   # http://localhost:3000/admin
```

Other commands: `npm run lint`, `npm run typecheck`, `npm run build`.
After changing `src/db/schema.ts`, run `npm run db:generate` to create a new migration.

## Deploy for free (Vercel + Neon)

1. Push this repository to GitHub (already done if you're reading this there).
2. Go to [vercel.com](https://vercel.com), sign in with GitHub, choose **Add New → Project** and
   import this repository.
3. In the project, open **Storage → Create Database → Neon (Postgres)** and connect it. This sets
   `DATABASE_URL` for you.
4. Under **Settings → Environment Variables**, add `ADMIN_PASSWORD`. Pick a strong password.
5. Deploy. The `vercel-build` script runs the database migrations before every build.
6. Open `https://<your-project>.vercel.app/admin`.

Optional: add a custom domain under **Settings → Domains** and set `NEXT_PUBLIC_SITE_URL` to it so
every invitation link uses that domain.

## Project layout

```
src/
  app/
    admin/                 Host dashboard (password protected by src/proxy.ts)
    i/[token]/             The guest's invitation page
      Envelope.tsx         Sealed-envelope opening animation
      Invitation.tsx       The invitation card
      RsvpForm.tsx         RSVP form + thank-you message
      opengraph-image.tsx  WhatsApp/social link preview image
      calendar/route.ts    .ics download for Apple/Outlook calendars
  db/schema.ts             Database tables (events, guests)
  lib/                     Auth, date/time and link helpers
drizzle/                   SQL migrations
```

## Ideas for later

- More themes (wedding, birthday) and a theme picker
- Photo upload instead of a photo link
- Guest-count limits, meal choices, plus-one names
- Reminders before the RSVP deadline
- Multiple hosts with their own accounts
