# Codebase Issues — slice-of-life

Generated from a full code review. Organized by severity.

---

## CRITICAL

### 1. `stringToDate` adds +1 to every day (FIXED)

**File:** `src/backend/entry.ts:33`

```js
return new Date(year as number, (month as number - 1), (day ? day + 1 : 0) as number);
```

The `day + 1` shifts all parsed dates forward by one day. Input `"2024-01-15"` produces January 16. Affects every entry date display parsed from URL strings.
**Note:** `stringToDate` now builds the date from `Date.UTC(year, month - 1, day)`, and the read side (`getMonthNames`, `getDaysInMonth`, Dashboard placement, `dateToStringUTC` in `src/backend/entry.ts`) is UTC-coherent, so `"2024-01-15"` maps to January 15. Existing DB rows were intentionally **not** migrated (they render correctly through the UTC getters). Caveat: `Date.UTC` fills missing components with 0, so parsed dates are UTC-midnight rather than the "UTC-noon" of the original plan — midnight is strictly safer (no day-boundary drift).

---

### 2. `getJournalEntriesFromDate` has no user scoping (FIXED)

**File:** `src/db/queries/entry.ts:33-45`
Fetches ALL entries from ALL users, then filters in JS. No `userId` parameter. If User A creates an entry for Jan 15, User B is blocked from that date. Cross-user data leak and denial-of-service.

---

### 3. Missing `return` before `c.redirect` in register error handler

**File:** `src/routes/auth.tsx:65-67`

```js
c.redirect("/register?error=INTERNAL_SERVER_ERROR"); // missing return
return c.text(message); // raw error leaked to user
```

The redirect never fires. Execution falls through to `c.text(message)`, leaking internal error details.

---

### 4. No file type validation on uploads (FIXED)

**File:** `src/backend/uploads.ts:32-72`
No MIME type, magic bytes, or extension allowlisting. Users can upload `.html`, `.js`, `.svg` etc. These are served as static assets — an uploaded `.html` or `.js` file can execute in the app domain (stored XSS).
**Note:** All uploads are now fully re-encoded by `sharp` before ever reaching disk (`src/backend/imageProcessing.ts::sanitizeImageUpload`). Stored bytes are always sharp's own output — never client bytes — with EXIF/ICC/IPTC stripped, dimensions bounded to 4000px, and animation preserved for multi-frame GIFs (loaded with `{ pages: -1 }`; static GIFs become PNG). Any input sharp cannot decode+re-encode (HTML, SVG, executables, video, polyglots) is rejected with `415 UNSUPPORTED_FILE` and leaves no residue; SVG/video are denied outright since they cannot be safely neutralized. Filenames are always `randomUUID()` + a `sharp`-derived extension, never the client's filename. Files are written to a `.tmp-` file then atomically renamed into `UPLOAD_DIR`. The `/static/*` mount also sends `X-Content-Type-Options: nosniff`.

---

### 5. `imagePaths` values unvalidated — path traversal / arbitrary file deletion (FIXED)

**File:** `src/schemas/entryPayload.ts:8` + `src/db/queries/uploads.ts:107-108`
`imagePaths` accepts any string with no pattern validation. Stored paths are used in `deleteJournalAssets` which operates on the filesystem. A malicious path like `../../etc/passwd` could delete arbitrary files.
**Note:** `entryPayload` now validates each `imagePaths` item against `/^<UPLOAD_URL_PREFIX>/<uuid>\.(jpe?g|png|webp|gif|avif)$/i` (traversal/absolute/foreign names → 400). Every disk-touch site in `src/db/queries/uploads.ts` now resolves paths via `toSafeUploadFilename()` (`src/backend/imageProcessing.ts`), which returns `null` for anything not shaped like our own uploads, so no filesystem path is ever derived from an unvalidated client string. Missing-file check (`MISSING_IMAGES` → 422) retained.

---

### 6. Weak JWT secret with no entropy validation

**File:** `.env:6` + `src/backend/env.ts:11`
The JWT secret is `sikretongmalibagnapwet` — short, human-readable, low entropy. The Zod schema only checks `z.string()` with no minimum length. An attacker who obtains this can forge arbitrary JWTs.

---

### 7. No rate limiting on login/register endpoints

**File:** `src/routes/auth.tsx:21-69`
No rate limiting, account lockout, or CAPTCHA anywhere. Unlimited password guesses and unlimited account creation.

---

### 8. `/static/*` serves from `./src` — source code disclosure (FIXED)

**File:** `src/index.tsx:17`

```js
app.use('/static/*', serveStatic({ root: './src' }));
```

Any file under `./src` is accessible via `/static/*`. This exposes environment config, DB schemas, route logic, and internal implementation details.
**Note:** Publishable assets moved from `src/static/assets` to `public/assets`, and the uploads + assets mounts merged into a single `/static/*` mount at `app.use('/static/*', serveStatic({ root: './public', rewriteRequestPath: (path) => path.replace(/^\/static/, '') }))`. `root` now points at the real published directory (`./public`) instead of `./src`, so source files resolve to 404. Compiled Sass output (`public/assets/css/*.css(.map)`) is now gitignored (source of truth = `src/styles`); `public/uploads/.gitkeep` added. Note: the old `root: './src'` was only accidentally safe because Hono resolves `join(root, requestPath)` and the `/static/` URL prefix mirrored `src/static`. Assets and uploads still served from `/static/*`; source paths (`/static/routes/entry.tsx`, etc.) return 404.

---

## HIGH

### 9. Upload writes file to disk BEFORE DB insert, no cleanup on failure (FIXED)

**File:** `src/backend/uploads.ts:55-70`
If `insertJournalAsset()` fails, the file remains orphaned on disk with no DB record. The catch block should delete the file.

---

### 10. Entry deletion not transactional (FIXED)

**File:** `src/routes/entry.tsx:218-221`
Assets are deleted from DB + disk, then entry deletion runs separately. If entry deletion fails after assets are deleted, the entry references files that no longer exist. Should use `db.transaction()`.
**Note:** `deleteJournalEntryWithAssets()` deletes asset rows + entry in a single `db.transaction()`. Disk files are deleted best-effort after commit via `deleteFilesFromDisk()`, orphaned files being cleaned by GC.

---

### 11. Entry update deletes assets before updating entry (FIXED)

**File:** `src/routes/entry.tsx:185-196`
Removed assets are deleted from DB + disk before the entry update. If `updateJournalEntry` fails, removed assets are permanently lost but the old entry still references them.
**Note:** `updateJournalEntryWithRemovedAssets()` updates the entry and deletes removed asset rows in a single `db.transaction()`. Disk files are deleted best-effort after commit via `deleteFilesFromDisk()`.

---

### 12. No global error handler (FIXED)

**File:** `src/index.tsx`
No `app.onError()` handler. Unhandled exceptions produce default error pages that may include stack traces depending on Hono/Bun defaults.
**Note:** `app.onError()` + `app.notFound()` now return a Material 3 styled error page (`ErrorPage`) for HTML requests and JSON for `/api` requests. Errors are logged server-side; no stack traces leak to the client.

---

### 13. User enumeration via distinct login error messages (FIXED)

**File:** `src/routes/auth.tsx:28-36`
`USER_DOES_NOT_EXIST` vs `INCORRECT_PASSWORD` are distinct, allowing an attacker to enumerate valid usernames. Both should return a single generic message.
**Note:** Both failure cases now return a single generic `INVALID_CREDENTIALS`. A dummy bcrypt verify runs when the user is not found to mitigate timing-based enumeration. `AuthLayout` maps the code to `"Invalid username or password."`.

---

### 14. Registration success message never displayed

**File:** `src/routes/auth.tsx:60` + `src/pages/Login.tsx:7`
After registration, redirect goes to `/login?registration=SUCCESS` but the login page has a TODO comment and never reads or displays this parameter.

---

### 15. Auth validation errors return JSON for form POSTs

**File:** `src/schemas/auth.ts:11-16`
When validation fails, `c.json({ errors: [...] }, 400)` is returned. The browser receives raw JSON instead of a redirect or HTML error page.

---

### 16. Missing database indexes

**File:** `src/db/schema.ts`
No indexes on frequently queried columns:

- `journalEntries.userId` — used in every entry query
- `journalAssets.userId` — used in asset queries
- `journalEntries.date` — needed for date filtering

---

### 17. No CSRF tokens on form-based auth routes

**File:** `src/routes/auth.tsx`
Relies entirely on `sameSite: "Lax"` for CSRF protection. No CSRF token implementation. Form-based POSTs (login, register) are sent as top-level navigations which include the cookie.

---

## MEDIUM

### 18. `validateRequestedYear` never returns falsy — dead validation guards (FIXED)

**File:** `src/routes/entry.tsx:234, 255` + `src/backend/entry.ts:36-55`
The function returns the validated year or `currentYear` (a number), never falsy. The `if (!validateRequestedYear(year))` checks never trigger.
**Note:** `validateRequestedYear` now returns `number | null`, and the `/` route guards on `null` to redirect with `?error=INVALID_YEAR`. The old `/:year`/`/:year/:month` routes were removed (dashboard filtering now uses `?year=`/`?month=` query params).

---

### 19. Inconsistent auth redirect targets

**File:** `src/routes/profile.tsx:11-12, 24-25`
`/profile` redirects to `/` on auth failure while all other routes redirect to `/login`. Unauthenticated users hitting `/profile` are silently sent to the dashboard with no indication auth is required.

---

### 20. API endpoints return redirects on auth failure instead of 401 JSON

**File:** `src/routes/entry.tsx:134-136, 168-170, 202-204`
POST/PUT/DELETE API endpoints return `c.redirect("/login")` on auth failure. Fetch/XHR clients follow the redirect, turning it into a GET and losing user data. Should return 401 JSON.

---

### 21. Unsafe `as User` casts on nullable return — TOCTOU race

**Files:** `src/routes/entry.tsx` (multiple), `src/routes/profile.tsx:15`, `src/backend/uploads.ts:38`
`getUserFromContext` returns `Promise<User | null>`. The `as User` cast suppresses null checks. If the user is deleted between token validation and the getUser query, this crashes at runtime.

---

### 22. N+1 filesystem I/O in `getJournalAssetsWithMissingFile`

**File:** `src/db/queries/uploads.ts:38-51`
Individual `Bun.file().exists()` call per asset. Should batch with `readdir` or compare against a file list.

---

### 23. `getUserTotalFilesSize` fetches all rows instead of SQL SUM

**File:** `src/db/queries/uploads.ts:24-30`
Fetches every asset record for the user, then sums in JS. Should use `SELECT SUM(file_size) FROM journal_assets WHERE user_id = ?`.

---

### 24. O(n²) array `.includes()` in `getOrphanedJournalAssets`

**File:** `src/db/queries/uploads.ts:53-70`
Uses `.includes()` on an array (O(n) per call). Should use a `Set` with `.has()` for O(1) lookups.

---

### 25. `getJournalEntriesFromDate` filters in JS instead of SQL WHERE (FIXED)

**File:** `src/db/queries/entry.ts:33-45`
Fetches ALL entries from ALL users, then filters by date in JavaScript. Should use SQL `WHERE` clause.
**Note:** Now scoped by `userId` and filtered with `eq(journalEntries.userId, userId)` + date condition directly in the SQL `WHERE` via drizzle (`src/db/queries/entry.ts:51-66`).

---

### 26. `Bar` component renders `class="m3-progress-bar undefined"` when className is omitted (FIXED)

**File:** `src/components/Bar.tsx:12`

```jsx
class={`m3-progress-bar ${className}`}
```

When `className` is `undefined`, the string `"undefined"` is interpolated.
**Note:** Now conditionally includes className only when provided (`m3-progress-bar${className ?` ${className}`: ""}`).

---

### 27. File size check after full body parse — memory exhaustion

**File:** `src/backend/uploads.ts:40-55`
Entire file is parsed into memory via `c.req.parseBody()` before the size check. A 2GB upload with a 10MB limit exhausts memory before rejection.

---

### 28. No unique constraint on `(userId, date)` for journal entries

**File:** `src/db/schema.ts:24-45`
No compound unique index. Concurrent requests can bypass the one-per-day-per-user rule enforced in application code.

---

### 29. Double `.split("/").pop()` in orphan detection

**File:** `src/db/queries/uploads.ts:72-87`
`assetFilenames` already contains extracted filenames after `.split("/").pop()`, but the `dbSet` mapping applies `.split("/").pop()` again. Redundant.

---

### 30. Dashboard `.map(async ...)` returns unresolved Promises

**File:** `src/pages/Dashboard.tsx:47`

```js
const entriesGalleryElements = monthGroup.journalEntries.map(async (journalEntry, dayIndex) => {
```

`.map()` with `async` callback produces an array of Promises, not resolved JSX. No `await Promise.all()`. Entries may render as `[object Promise]`.
**Note:** Investigated — the earlier "entries not showing up" bug was **not** this; it was the whole-year `visibleEntries.length === 0` early-return (now removed, so all 12 months render). The `async` map with `await getFileSizeOfImagePaths(...)` still resolves in practice under Hono's JSX renderer, so this remains a latent code smell (the `var` + `await` inside render is also covered by #35) rather than a manifesting bug.

---

## LOW

### 31. Typo: `INCORRECT_PASDWORD` → `INCORRECT_PASSWORD` (FIXED)

**File:** `src/routes/auth.tsx:35`

### 32. Typo: `Pasword` → `Password` (FIXED)

**File:** `src/schemas/auth.ts:7`

### 33. Typo: `INVALID_ENTRY_DAT;` → `INVALID_ENTRY_DATE` (FIXED)

**File:** `src/routes/entry.tsx:144`

### 34. Typo: `sucessfully` → `successfully` (FIXED)

**File:** `src/routes/auth.tsx:41`

---

### 35. `var` usage should be `let`/`const`

**Files:**

- `public/assets/js/entry-editor.js:23` — `var MAX_FILE_SIZE`
- `src/pages/Dashboard.tsx:76` — `var fileSizeText`
- `src/pages/Entry.tsx:36` — `var fileSizeText`

---

### 36. Dead code: redundant expiry check in `validateTokenFromContext`

**File:** `src/backend/cookies.ts:88-95`
`hono/jwt`'s `verify()` already checks `exp`. The manual expiry check is unreachable dead code.

---

### 37. Dead code: `updateMultipleJournalEntries` never called

**File:** `src/db/queries/entry.ts:88-108`
Exported but never imported anywhere in the codebase.

---

### 38. Dead config: `IMAGE_UPLOAD_PATH` / `IMAGE_URL_PATH` env vars never used (FIXED)

**File:** `src/backend/env.ts:9-10, 18-27`
Required by the env schema and validated at startup, but never referenced anywhere. Upload code hardcodes paths instead.
**Note:** Renamed to `UPLOAD_DIR` and `UPLOAD_URL_PREFIX`, now wired into all upload path code.

---

### 39. Hardcoded `./public/uploads` path in multiple places (FIXED)

**Files:** `src/db/queries/uploads.ts:44`, `src/backend/uploads.ts:48, 106`
The upload path is hardcoded in 3+ locations instead of using the `IMAGE_UPLOAD_PATH` env var.
**Note:** All paths now use `env.UPLOAD_DIR` and `env.UPLOAD_URL_PREFIX`.

---

### 40. `/api/progress` is a debug stub returning random data

**File:** `src/routes/profile.tsx:22-31`
Returns `Math.floor(Math.random() * 100)` and logs to console on every call. Should be removed or implemented.
**Note:** `console.log` removed as part of logging system cleanup. Stub endpoint still returns random data.

---

### 41. Hardcoded `userRole` and `userFileSizeLimit` ignore DB schema

**File:** `src/pages/Profile.tsx:11, 18`

```js
const userRole = "Free"
const userFileSizeLimit = 10; // In MiB
```

The `User` schema has `fileUploadLimit` field that is never used.
**Status:** `userFileSizeLimit` now reads from `user.fileUploadLimit` with a fallback of 10. `userRole` remains hardcoded `"Free"` because the `User` schema has no role field (only `fileUploadLimit`).

---

### 42. Debug `console.log` statements left in production code (FIXED)

**Files:**

- `public/assets/js/entry-editor.js:29` — `console.log(MAX_FILE_SIZE)`
- `src/routes/auth.tsx:24, 41, 56` — login/register attempt logs
- `src/routes/profile.tsx:29` — progress value log

All server-side console statements replaced with structured `logger` module. Client-side debug log removed. Remaining client `console.error` calls are intentional browser error logging.

---

### 43. `==` used instead of `===` in multiple places (FIXED)

**Files:**
- `src/backend/cookies.ts:22`, `src/backend/env.ts:23, 27`, `src/backend/uploads.ts:78, 104`
- `src/db/queries/auth.ts:38`, `src/db/queries/uploads.ts:26`
- `src/routes/entry.tsx:181, 214` — userId comparison
- `src/routes/auth.tsx:65, 66` — message type check
- `src/layouts/BaseLayout.tsx:51`
- `src/pages/Dashboard.tsx:32, 35, 54-56, 60, 114, 122`
**Note:** All 20 occurrences converted to `===`/`!==`. The earlier mention of `src/db/queries/entry.ts:35` was stale (no `==` there anymore).

---

### 44. Logout route missing leading `/` (FIXED)

**File:** `src/routes/auth.tsx:75`

```js
app.get("/logout", async (c) => {
```

Without the leading slash, Hono treats this as a relative route. Fixed to `"/logout"`.

---

### 45. `JournalAsset` type uses `$inferInsert` instead of `$inferSelect`

**File:** `src/db/schema.ts:14`

```ts
export type JournalAsset = typeof journalAssets.$inferInsert;
```

Should be `$inferSelect` for query return types. The insert type may not include fields with `$defaultFn`.

---

### 46. `getUser` swallows all DB errors as "user not found"

**File:** `src/db/queries/auth.ts:50-61`
Any database error (connection lost, disk full) is silently converted to `null`. Makes debugging auth failures impossible and masks infrastructure problems.

---

### 47. No touch events for carousel on mobile

**File:** `public/assets/js/entry-carousel.js:99-129`
Only handles `mousedown`/`mousemove`/`mouseup`/`mouseleave`. No `touchstart`/`touchmove`/`touchend`. Drag-to-scroll is desktop-only.

---

### 48. JSX uses `for` instead of `htmlFor` (FIXED)

**File:** `src/pages/EntryEditor.tsx:48`

```jsx
<label htmlFor="entryDate">Date of Entry</label>
```

In JSX, the attribute must be `htmlFor`. Hono JSX may handle this, but it is incorrect JSX syntax. Fixed to `htmlFor`.

---

### 49. `secure` cookie flag depends on potentially-undefined `NODE_ENV`

**File:** `src/backend/cookies.ts:21`

```js
secure: process.env.NODE_ENV == "production",
```

`NODE_ENV` is optional in the env schema. If undefined, `secure` is always `false`.

---

### 50. `sameSite: "Lax"` allows top-level POST CSRF

**File:** `src/backend/cookies.ts:22`
Form-based auth POSTs are sent as top-level navigations which include the cookie with `"Lax"`. `"Strict"` would be more secure for this use case.

---

### 51. No server-side token invalidation on logout

**File:** `src/routes/auth.tsx:71-74`
Logout only deletes the cookie client-side. The JWT remains valid for up to 1 hour. No token blacklist.

---

### 52. No maximum length on username or password validation

**File:** `src/schemas/auth.ts:4-9`
No upper bound on either field. bcrypt silently ignores password characters beyond 72 bytes.

---

### 53. `env.ts` validation does not abort on invalid paths

**File:** `src/backend/env.ts:18-23`
If the upload directory doesn't exist, logs an error but continues running. Should throw to fail fast.

---

### 54. Redundant userId ownership check (dead code)

**File:** `src/routes/entry.tsx:181, 214`
`getJournalEntryFromEntryId` already filters by `userId`. The `else if (existingEntry.userId != user.id)` branch can never be reached.

---

### 55. Inconsistent `userId` inclusion in query results

**File:** `src/db/queries/entry.ts:24-30, 38-44`
`getJournalEntryFromEntryId` includes `userId` in results, but `getJournalEntries` and `getJournalEntriesFromDate` do not. The `JournalEntry` type declares `userId?: number` as optional.

---

### 56. `==` used instead of `===` for string comparison (FIXED)

**File:** `src/db/queries/entry.ts`
Loose equality for string comparison. While functionally equivalent, it is inconsistent with best practices.
**Note:** Resolved by the #43 sweep — no `==` remains in `entry.ts` (stale line ref; line 126 already used `===`).

---

### 57. `Bar` component missing `aria-label` fallback (FIXED)

**File:** `src/components/Bar.tsx:13-14`
When `label` prop is not provided, `aria-label` renders as `undefined`. Screen readers get no label for the progress bar.
**Note:** Now defaults to `aria-label={label || "Progress"}`. Profile passes `label="Storage used"`.

---

### 58. No `app.notFound()` handler (FIXED)

**File:** `src/index.tsx`
404s return plain text "404 Not Found". Inconsistent with HTML responses elsewhere. The `/:year` route may catch paths that should 404.
**Note:** `app.notFound()` renders the Material 3 `ErrorPage` for HTML requests and JSON for `/api` requests. The greedy `/:year` and `/:year/:month` catch-all routes were removed in favor of `?year=`/`?month=` query params on `/`, so unknown paths now reach `notFound()`.

---

## SUGGESTED FIX ORDER

1. `stringToDate` off-by-one (#1)
2. `getJournalEntriesFromDate` user scoping (#2)
3. Missing `return` on redirect (#3)
4. Static serving from `./src` (#8)
5. Upload security — file type validation + path validation (#4, #5)
6. JWT secret strength (#6)
7. Rate limiting (#7)
8. Transactional consistency (#9, #10, #11)
9. Global error handler (#12)
10. Auth improvements (#13, #14, #15, #17)
11. Database indexes (#16)
12. Medium fixes (#18–#30)
13. Low priority cleanup (#31–#58)
