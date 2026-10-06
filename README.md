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
   Upload a photo of yourself under **Your photo** on the event page.
2. Add invitations. For each one choose who it's for — you decide the seats, guests only
   accept or decline:
   - **One person** — "Dear Aunt Mary," (1 seat)
   - **Couple** — write it as you'd address them, e.g. "Mr. and Mrs. Otieno" (2 seats)
   - **Family** — "John Kamau **and family**", with as many seats as you choose

   Or paste a list under **Add many at once**, one per line, e.g.
   `John Kamau and family, +254 712 345678, 5`. Anything it can't read is reported and nothing is
   added until it's fixed. Names, types and seats can be changed in the list afterwards.
3. Press **WhatsApp** next to a guest. WhatsApp opens with a ready-made message and their link
   (save numbers with the country code, e.g. +254…). The link shows a preview card with their
   name, your name and the date.
4. Watch the dashboard as people open their invitations and RSVP: it shows seats invited,
   people attending and the seats still awaiting a reply.

The invitation adapts to phones, tablets and computers — on a computer your photo fills the
left half and stays in view while the details scroll past.

## Tech stack

- **Next.js 16** (App Router, server actions) with TypeScript
- **Tailwind CSS 4** for styling, **Framer Motion** for the envelope and confetti animations
- **Postgres** through **Drizzle ORM**
- Hosting: **Render** (free web service) and **Neon** Postgres (free tier)

## Run it on your computer

You need [Node.js](https://nodejs.org) 20 or newer (choose the LTS version) and
[Git](https://git-scm.com).

```bash
git clone -b claude/modest-goodall-6vw9ep https://github.com/En135511/bindingsamples.git
cd bindingsamples
npm install
npm run dev
```

Open http://localhost:3000/admin and log in with the password **`admin`**.

No database setup is needed. When `DATABASE_URL` isn't set, the app uses a built-in database
saved in the `.data/` folder. Only one copy of the app can use it at a time, so run `npm run dev`
in one terminal only. To start over, stop the app and delete the `.data/` folder.

To see the invitation on your phone, connect it to the same Wi-Fi and open the **Network**
address that `npm run dev` prints (e.g. `http://192.168.1.20:3000`). Then open the guest links
from the dashboard there. Guest links copied from the dashboard use whatever address you opened
it with.

Optional settings go in a `.env` file (copy `.env.example` and uncomment what you need):
`ADMIN_PASSWORD` to change the password, and `DATABASE_URL` to use a real Postgres database
(then run `npm run db:migrate` once).

Other commands: `npm run lint`, `npm run typecheck`, `npm run build`.
After changing `src/db/schema.ts`, run `npm run db:generate` to create a new migration.

## Deploy for free (Render + Neon)

### 1. Create the database on Neon (free, doesn't expire)

1. Sign in at [neon.tech](https://neon.tech) with GitHub and create a project (pick the region
   closest to you).
2. On the project dashboard, click **Connect** and copy the connection string. It looks like
   `postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`.

Render's own free Postgres is deleted after 30 days, which is why we use Neon.

### 2. Create the app on Render

1. In the [Render dashboard](https://dashboard.render.com), choose **New → Blueprint**, connect
   GitHub if asked, and select this repository. Render reads `render.yaml`.
2. When asked, paste the Neon connection string as `DATABASE_URL` and choose an `ADMIN_PASSWORD`.
3. Click **Apply**. The first build takes a few minutes and creates the database tables.
4. Open `https://<your-service>.onrender.com/admin` and log in.

If Render deploys from a branch other than the one containing this code, change the branch under
the service's **Settings → Build & Deploy → Branch**.

### 3. Keep it awake (recommended)

Render's free apps go to sleep after 15 minutes without visitors, and the next visitor then waits
about a minute. To make sure guests never wait:

1. Create a free account at [UptimeRobot](https://uptimerobot.com) (or
   [cron-job.org](https://cron-job.org)).
2. Add an HTTP monitor for `https://<your-service>.onrender.com/api/health` every 5–10 minutes.

One always-on service fits within Render's 750 free hours a month.

Optional: if you add a custom domain, set `NEXT_PUBLIC_SITE_URL` to it so every invitation link uses
that domain.

## Project layout

```
src/
  app/
    api/health/            Health check for Render and uptime monitors
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
- Guest-count limits, meal choices, plus-one names
- Reminders before the RSVP deadline
- Multiple hosts with their own accounts
