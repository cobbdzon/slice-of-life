import type { User } from "../db/schema";

interface BaseLayoutProps {
  user?: User;
  title?: string;
  stylesheets?: string[];
  scripts?: string[]
  showTopBar?: boolean;
  children: any;
}

export function BaseLayout({ user, title = "Slice of Life", stylesheets = [], scripts = [], showTopBar = true, children }: BaseLayoutProps) {
  const username = Boolean(user) ? (user as User).username : "";
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

        {scripts.map((href) => (
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
              username ? (
                <a href="/profile" class="m3-title no-link-style m3-username">
                  <span class="material-symbols-outlined m3-username__icon">person</span>
                  {username}
                </a>
              ) : null
            }
            {
              username !== "" ? (
                <md-filled-button onclick="window.location.href='/logout'">
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
