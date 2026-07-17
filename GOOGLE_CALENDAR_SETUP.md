# Google Calendar Sync — Setup & Deployment Guide

Two-way sync between the platform's booking calendar and each clinic's Google
Calendar.

- **App → Google:** when an appointment is created, rescheduled, cancelled,
  no-showed or deleted, the change is pushed to the clinic's Google Calendar.
- **Google → App:** events created directly in the clinic's Google Calendar
  become **blocked/busy time** in the app so the availability engine won't
  double-book. (External Google events are never turned into appointments.)

## Architecture at a glance

- **One OAuth app (ours), many clinics.** There is a single Google Cloud
  project / OAuth client shared by every clinic. Each clinic authorizes with
  *its own* Google account; we store a per-clinic refresh token (encrypted).
  Clinics never need their own API keys.
- **The clinic picks which calendar to sync.** After connecting, the clinic
  chooses one of its Google calendars (e.g. its "Clinic Bookings" calendar), or
  has the app create a new one. Both sync directions use that chosen calendar.
  This avoids dragging personal events into the app as fake "busy" time.
  Disconnecting is clean.
- **Real-time inbound** via Google push notifications (watch channels), with a
  **10-minute polling fallback** and **hourly watch-channel renewal** so it keeps
  working even if a webhook is dropped or the callback URL isn't set yet.
- The whole feature is **inert until configured** — if `GOOGLE_CLIENT_ID` /
  `GOOGLE_CLIENT_SECRET` / `GOOGLE_OAUTH_REDIRECT_URI` are unset, nothing syncs
  and no endpoints do anything meaningful. Safe to deploy dark.

## 1. Google Cloud Console (one-time)

1. Create (or pick) a Google Cloud **project**.
2. **APIs & Services → Library →** enable **Google Calendar API**.
3. **APIs & Services → OAuth consent screen**:
   - User type **External**.
   - Add the scope `https://www.googleapis.com/auth/calendar`.
   - Add support + developer contact emails.
   - While in **Testing** you may add up to 100 **test users**. See the
     verification note below before going live.
4. **APIs & Services → Credentials → Create credentials → OAuth client ID**:
   - Application type **Web application**.
   - **Authorized redirect URIs:** add your `GOOGLE_OAUTH_REDIRECT_URI`
     (e.g. `https://api.yourdomain.com/api/google-calendar/oauth/callback`).
   - Copy the **Client ID** and **Client secret**.
5. **Domain verification** (required for push notifications): verify the domain
   of `GOOGLE_WEBHOOK_CALLBACK_URL` in
   [Google Search Console](https://search.google.com/search-console) and add it
   under the project's verified domains. The webhook URL must be **public HTTPS**
   with a valid certificate.

### ⚠️ OAuth verification (plan ahead)

`.../auth/calendar` is a **sensitive/restricted** scope. In **Testing** mode
only listed test users can connect and their refresh tokens expire ~7 days.
For production launch, **publish the app** and complete **Google's OAuth
verification** (can take days–weeks). The app handles a dead token gracefully:
it flags the connection as `error` and notifies clinic staff to reconnect.

## 2. Environment variables

| Var | Where it comes from |
|---|---|
| `GOOGLE_CLIENT_ID` | OAuth client (step 4) |
| `GOOGLE_CLIENT_SECRET` | OAuth client (step 4) |
| `GOOGLE_OAUTH_REDIRECT_URI` | You define; must match the Authorized redirect URI |
| `GOOGLE_WEBHOOK_CALLBACK_URL` | You define; public HTTPS on a verified domain |
| `GOOGLE_TOKEN_ENC_KEY` | Generate: `openssl rand -hex 32` (32-byte key; encrypts stored tokens) |
| `GOOGLE_CALENDAR_SCOPES` | `https://www.googleapis.com/auth/calendar` (default) |
| `APP_FRONTEND_URL` | Where to send the browser after OAuth completes |

Redis (already used by the app's Bull queues) is required — the sync jobs run on
a new `calendar-sync` queue. No other new infra.

## 3. Database migrations

Three migrations ship with the feature:

- `CreateClinicCalendarConnections…` — new `clinic_calendar_connections` table.
- `AddGoogleCalendarFieldsToAppointments…` — `googleCalendarEventId`,
  `googleCalendarSyncedAt`, `googleCalendarSyncStatus` on `appointments`.
- `AddSourceFieldsToBlockedTimeSlots…` — `source`, `externalEventId`,
  `externalSyncedAt` on `blocked_time_slots` (+ a partial unique index for
  idempotent inbound upserts).

Run: `npm run migration:run` (prod: `npm run migration:prod`). All three are
idempotent (`IF NOT EXISTS`) and self-contained (no cross-table FKs added).

## 4. Deployment checklist

- [ ] Google Cloud project + Calendar API enabled
- [ ] OAuth consent screen configured (+ verification submitted for prod)
- [ ] OAuth client created; redirect URI registered
- [ ] Webhook domain verified; HTTPS cert valid
- [ ] 7 env vars set in the server's secrets
- [ ] `npm install` (adds `googleapis`) and `npm run build`
- [ ] `npm run migration:run`
- [ ] Redis reachable

## 5. API surface

All under the global `/api` prefix.

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/google-calendar/clinics/:clinicId/status` | owner/admin | Connection status (`connected`, `needsCalendarSelection`, `calendarSummary`, …) |
| `GET` | `/google-calendar/clinics/:clinicId/connect` | owner/admin | Returns `{ url }` — the Google consent URL to redirect to |
| `GET` | `/google-calendar/clinics/:clinicId/calendars` | owner/admin | Lists the account's writable calendars to choose from |
| `PUT` | `/google-calendar/clinics/:clinicId/calendar` | owner/admin | Body `{ calendarId }` or `{ createNewName }` — pick the calendar to sync; starts backfill + inbound |
| `DELETE`| `/google-calendar/clinics/:clinicId` | owner/admin | Disconnect (stops watch, revokes token, deletes row) |
| `GET` | `/google-calendar/oauth/callback` | public (signed `state`) | Google redirect target |
| `POST` | `/google-calendar/webhook` | public (channel token) | Google push receiver |

**Frontend flow:**
1. Call `connect` → redirect the browser to the returned `url`.
2. User approves on Google → Google redirects to `oauth/callback` → the app
   stores tokens and redirects to
   `APP_FRONTEND_URL/settings/calendar?google=connected&select=1`.
3. Because `select=1` (and `status` returns `needsCalendarSelection: true`), the
   UI calls `GET …/calendars`, shows the list, and the clinic picks one.
4. UI calls `PUT …/calendar` with the chosen `calendarId` (or `createNewName`).
   The app registers the watch channel, backfills existing appointments → Google,
   and pulls current Google events in. Sync is now live both ways.

## 6. How it behaves (operational notes)

- **Source of truth:** the app owns appointments. App-created Google events are
  tagged (`extendedProperties.private.appAppointmentId`) and are **never**
  re-imported (loop prevention). If someone edits an app-created event in
  Google, the app overwrites it on the next push.
- **Availability:** inbound Google events are written as `blocked_time_slots`
  with `source = 'google_calendar'`, which the existing availability engine
  already treats as busy — no changes to booking logic.
- **Booking flows are never blocked by Google:** sync runs on a background queue
  with retries/backoff; Google latency or outages can't slow or fail a booking.
- **Retries:** outbound jobs retry 5× with exponential backoff. Dead tokens flip
  the connection to `error` and notify clinic staff to reconnect.
- **All-day Google events are skipped** for now (they don't map to a precise
  busy interval); timed events sync normally.
