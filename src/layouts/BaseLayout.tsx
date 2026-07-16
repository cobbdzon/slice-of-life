interface BaseLayoutProps {
  title?: string;
  stylesheets?: string[]; // Array sa mga dugang nga CSS paths
  children: any;
}

export function BaseLayout({ title = "Slice of Life", stylesheets = [], children }: BaseLayoutProps) {
  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title}</title>

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet" />

        {/* Imong global baseline styles */}
        <link rel="stylesheet" href="/static/assets/css/main.css" />

        {/* Dynamic injection sa mga dugang nga stylesheets */}
        {stylesheets.map((href) => (
          <link rel="stylesheet" href={href} />
        ))}

        <script type="module" src="https://esm.run/@material/web/all.js"></script>
      </head>
      <body class="m3-surface">
        {/* TODO: ADD ACCOUNT NAME */}
        <header class="m3-top-app-bar">
          {/* <span class="material-symbols-outlined icon-btn">menu</span> */}
          <span class="m3-title">Slice of Life</span>
        </header>

        <main class="m3-main-container">
          {children}
        </main>
      </body>
    </html>
  );
}
