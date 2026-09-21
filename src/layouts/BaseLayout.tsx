import type { User } from "../db/schema";
import { env } from "../backend/env";

interface BaseLayoutProps {
  user?: User;
  title?: string;
  stylesheets?: string[];
  scripts?: string[]
  showTopBar?: boolean;
  children: any;
}

const TIMER_SCRIPT = "/static/assets/js/test-account-timer.js";

function formatTestRemaining(ms: number): string {
  if (ms <= 0) return "0s";
  const hours = Math.floor(ms / 3_600_000);
  if (hours >= 1) return `${hours}h`;
  const minutes = Math.floor(ms / 60_000);
  if (minutes >= 1) return `${minutes}m`;
  return `${Math.ceil(ms / 1000)}s`;
}

function testSeverity(ratio: number): string {
  if (ratio <= 0.2) return "is-critical";
  if (ratio <= 0.5) return "is-warning";
  return "";
}

export function BaseLayout({ user, title = "Slice of Life", stylesheets = [], scripts = [], showTopBar = true, children }: BaseLayoutProps) {
  const username = Boolean(user) ? (user as User).username : "";
  const testExpiresAt = user?.testExpiresAt ?? null;

  const createdAtMs = user?.createdAt ? new Date(user.createdAt).getTime() : NaN;
  const testTotalMs = testExpiresAt
    ? Number.isFinite(createdAtMs)
      ? testExpiresAt - createdAtMs
      : env.TEST_ACCOUNT_TTL_MINUTES * 60_000
    : 0;
  const testRemainingMs = testExpiresAt ? testExpiresAt - Date.now() : 0;
  const testRatio = testTotalMs > 0 ? testRemainingMs / testTotalMs : 1;
  const testClass = testExpiresAt ? testSeverity(testRatio) : "";

  const loadedScripts = testExpiresAt && !scripts.includes(TIMER_SCRIPT)
    ? [...scripts, TIMER_SCRIPT]
    : scripts;

  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title}</title>

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet" />

        <link rel="stylesheet" href="/static/assets/css/main.css" />

        {stylesheets.map((href) => (
          <link rel="stylesheet" href={href} />
        ))}

        {loadedScripts.map((href) => (
          <script src={href}></script>
        ))}

        <script type="module" src="https://esm.run/@material/web/all.js"></script>
      </head>
      <body class="m3-surface">
        {showTopBar && (
        <header class="m3-top-app-bar">
          <div class="left">
            <a class="no-link-style m3-title m3-logo" href="/">
              Slice of Life
            </a>
          </div>
          <div class="right">
            {
              testExpiresAt ? (
                <span
                  class={`m3-test-pill${testClass ? ` ${testClass}` : ""}`}
                  data-expires-at={String(testExpiresAt)}
                  data-total-ms={String(testTotalMs)}
                  title="Temporary test account"
                >
                  <span class="material-symbols-outlined m3-test-pill__icon">timer</span>
                  <span data-countdown>{formatTestRemaining(testRemainingMs)}</span>
                </span>
              ) : null
            }
            {
              username ? (
                <a href="/profile" class="m3-title no-link-style m3-username">
                  <span class="material-symbols-outlined m3-username__icon">person</span>
                  {username}
                </a>
              ) : null
            }
            {
              username !== "" ? (
                <md-filled-button class="m3-logout-button" onclick="window.location.href='/logout'">
                  Log Out
                </md-filled-button>
              ) : null
            }
          </div>
        </header>
        )}

        <main class="m3-main-container">
          {children}
        </main>
      </body>
    </html>
  );
}
