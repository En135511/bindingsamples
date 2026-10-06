# 🎓 Graduation Invitation

Personal, animated graduation invitations that you share on WhatsApp.

Each guest gets their own private link, and opening it is a **big reveal** inspired by video
games:

1. A cream envelope with gold trim floats in warm light, with the guest's name on it and a
   navy wax seal pulsing "tap me".
2. The tap charges it up — it trembles as golden light leaks out — then the seal **bursts** into
   glitter with a boom and a camera shake.
3. The flap flies open and **god rays** pour out; the card rises, then **spins toward you** like
   an item being revealed, with a shine sweep and a fanfare.
4. A bright flash, and the invitation lands with a springy bounce and confetti cannons: ivory paper,
   gold foil, a laurel wreath around the graduate's photo, a ribbon banner, a countdown and a
   game-style RSVP that celebrates when guests say yes.

| Envelope | The reveal | Invitation |
|---|---|---|
| ![Envelope](docs/screenshots/1-envelope.png) | ![Card reveal](docs/screenshots/3-card-reveal.png) | ![Invitation](docs/screenshots/4-invitation.png) |

All sound (riser, impact, sparkles, fanfare, music box) is synthesized in the browser — no audio
files — and guests can mute it. Phones that can't do 3D, or have "reduce motion" on, get a lighter
animated (or still) version. Add `&slowmo=20` to a preview link to watch the reveal in slow motion.

## How it works

1. Go to `/admin`, log in with your password and create your event.
   Upload a photo of yourself under **Your photo** on the event page.
2. Add guests, one per line: `Aunt Mary, +254 712 345678, 2` (name, optional WhatsApp number,
   optional number of seats).
3. Press **WhatsApp** next to a guest. WhatsApp opens with a ready-made message and their link.
   The link shows a preview card with their name, your name and the date.
4. Watch the dashboard as people open their invitations and RSVP.

## Tech stack

- **Next.js 16** (App Router, server actions) with TypeScript
- **Tailwind CSS 4** for styling, **Framer Motion** for page animations
- **three.js** with **React Three Fiber** and **drei** for the 3D scenes (loaded only when needed)
- **Web Audio API** for synthesized sound effects and music
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
saved in the `.data/` folder. Delete that folder to start over.

To see the invitation on your phone, connect it to the same Wi-Fi and open the **Network**
address that `npm run dev` prints (e.g. `http://192.168.1.20:3000`). Then open the guest links
from the dashboard there. Guest links copied from the dashboard use whatever address you opened
it with.

Optional settings go in a `.env` file (see `.env.example`):
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
      experience/          3D scenes (three/), sound engine, 3D card tilt, device detection
      Envelope.tsx         2D envelope animation (fallback when 3D isn't available)
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
