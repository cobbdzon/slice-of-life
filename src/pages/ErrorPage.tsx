import { BaseLayout } from "../layouts/BaseLayout";
import type { User } from "../db/schema";

export interface ErrorPageProps {
  status: number;
  title: string;
  message?: string;
  user?: User;
}

export function ErrorPage({ status, title, message, user }: ErrorPageProps) {
  const icon = status === 404 ? "search_off" : "error";

  return (
    <BaseLayout
      user={user}
      title={`${status} · ${title}`}
      stylesheets={["/static/assets/css/error.css"]}
    >
      <div class="m3-error-page">
        <div class="m3-error-card">
          <div class="m3-error-card__icon">
            <span class="material-symbols-outlined">{icon}</span>
          </div>
          <h1 class="m3-error-card__title">{title}</h1>
          <p class="m3-error-card__message">
            {message ?? "Something went wrong while handling your request."}
          </p>
          <span class="m3-error-card__status">{status}</span>
          <div class="m3-error-card__actions">
            <md-filled-button onclick="window.location.href='/'">
              Go Home
            </md-filled-button>
            <md-outlined-button onclick="window.location.reload()">
              Refresh
            </md-outlined-button>
          </div>
        </div>
      </div>
    </BaseLayout>
  );
}