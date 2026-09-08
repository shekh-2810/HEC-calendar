# HEC Calendar — Manual Data Edition

A self-contained HEC calendar. It does **not** require Google Sheets, a service account, or a sheet-sharing step.

## What is included

- Public monthly calendar at `/`.
- Passcode-protected admin area at `/admin/login`.
- Add entries manually from the admin panel.
- Edit and delete entries.
- Upload calendar data as **CSV or JSON**.
- Import mode: **Replace** or **Append**.
- Export the current calendar as CSV.
- Date ranges are supported, so an exam from 10–18 August appears on every date in that range.
- Exam dates automatically make the previous 2 days yellow.
- Event = green, Exam = red, Sport/HPL = blue. Unknown/custom types default to green until a color rule is added.
- Initial data is based on the supplied HEC Calendar PDF.

## Initial calendar data

The supplied one-page calendar lists AURA '26 on 11 September 2026, Fall Semester 26–27 exam ranges, and Winter Semester 26–27 exam ranges. Those dates are preloaded into `data/calendar.json`.

The source states, among other ranges:

- AURA '26 — 11 September 2026 — 6 PM to 10 PM — Open Auditorium.
- Fall CAT-1 — 10–18 August 2026 for the first listed group, and 7–9 September 2026 for 2026 admitted B.Tech., Int. M.Tech., B.Arch. & B.B.A.
- Fall CAT-2 — 21–28 September 2026 for the first listed group, and 5–7 October 2026 for the 2026 admitted group.
- Fall FAT — 14–31 October 2026 for the first listed group, and 19–30 October 2026 for the 2026 admitted group.
- Winter CAT-1 — 17–24 December 2026.
- Winter CAT-2 — 5–12 February 2027.
- Winter FAT — 11–31 March 2027.

These ranges are represented as actual start/end dates rather than a single marker date.

## Setup

```bash
npm install
cp .env.example .env.local
```

Generate a session secret:

```bash
openssl rand -hex 32
```

Put the result in `.env.local`:

```env
ADMIN_PASSWORD=choose-your-admin-password
ADMIN_SESSION_SECRET=paste-your-generated-secret
```

Run locally:

```bash
npm run dev
```

Open `http://localhost:3000`.

For a production-style local run:

```bash
npm run build
npm run start
```

## Manual CSV upload

The admin panel accepts CSV with:

```csv
Start Date,End Date,Type,Title,Details
2026-09-11,2026-09-11,Event,AURA '26,"6 PM to 10 PM — Open Auditorium"
2026-09-07,2026-09-09,Exam,CAT-1,"Fall Semester 26-27"
```

`Date` is also accepted as a legacy single-day column. If `Date` is used, it becomes both Start Date and End Date.

JSON is also accepted as an array:

```json
[
  {
    "startDate": "2026-09-11",
    "endDate": "2026-09-11",
    "type": "Event",
    "title": "AURA '26",
    "details": "6 PM to 10 PM — Open Auditorium"
  }
]
```

### Replace vs Append

- **Replace**: replaces the entire calendar with the uploaded file. Use this when you have a complete master calendar.
- **Append**: keeps existing data and adds the uploaded rows. Use this for incremental additions.

The upload endpoint limits files to 2 MB.

## Data storage

Calendar data is stored in `data/calendar.json`. This keeps the project simple and easy to back up. The admin API writes the file atomically through a temporary file and rename operation.

This storage model is suitable for a local machine or a server with a persistent filesystem. **Do not deploy this version to a serverless platform expecting local file writes to persist between invocations.** For that later deployment case, `lib/dataStore.js` is the storage boundary and can be replaced with SQLite, Postgres, Vercel Blob, or another persistent backend without changing the calendar UI/API contract.

## Expansion path

The project is deliberately structured so more functionality can be added without adding a spreadsheet dependency:

1. More event types can be added to `TYPE_COLOR` in `lib/calendar.js`.
2. The admin type field already accepts custom type names.
3. Date ranges are already supported.
4. CSV/JSON import can become an Excel import later without changing the storage model.
5. An authenticated settings page can later manage colors, warning windows, academic years, and categories from the UI.
6. A persistent database adapter can replace `lib/dataStore.js` when deploying to a serverless host.

## Security notes

- Keep `.env.local` out of Git.
- Use a long random `ADMIN_SESSION_SECRET`.
- The session cookie is `HttpOnly` and only receives `Secure` when `NODE_ENV=production`, so local HTTP login works.
- The admin APIs reject requests without a valid session.
- Uploaded data is validated before it replaces the stored calendar.

## Routes

- `/` — public calendar
- `/admin/login` — admin login
- `/admin` — admin dashboard
- `/api/calendar` — public calendar data
- `/api/admin/add` — authenticated add
- `/api/admin/update` — authenticated edit
- `/api/admin/delete` — authenticated delete
- `/api/admin/entries` — authenticated list
- `/api/admin/upload` — authenticated CSV/JSON import
- `/api/admin/export` — authenticated CSV export
