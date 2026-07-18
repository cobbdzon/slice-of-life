import { BaseLayout } from '../layouts/BaseLayout';

export interface AuthLayoutProps {
  pageTitle: string;

  title: string;
  subtitle: string;
  submitMessage: string;
  formAction: string;

  bottomMessage: string;
  bottomLink: string;
  bottomLinkMessage: string;

  cardImage?: string;

  errorCode?: string;
}

export function AuthLayout(props: AuthLayoutProps) {
  const errorMessage = props.errorCode;

  return (
    <BaseLayout
      title={props.pageTitle}
      stylesheets={["/static/assets/css/auth.css"]}
      scripts={["/static/assets/js/auth-form.js"]}
    >
      <div class="main m3-login-card">

        <div class="card-image-side">
          <img src={props.cardImage || "/static/assets/images/login-illustration.png"} alt="Login Graphic" />
        </div>

        <div class="card-content-side">
          <h1 style="margin-bottom: 4px;">{props.title}</h1>
          <h3 style="font-weight: 400; margin-top: 0; margin-bottom: 24px; color: var(--md-sys-color-on-surface-variant, #49454f);">
            {props.subtitle}
          </h3>

          {errorMessage && (
            <div class="m3-error-banner" style="color: var(--md-sys-color-error, #ba1a1a); margin-bottom: 20px; font-weight: 500;">
              <span class="material-symbols-outlined" style="vertical-align: middle; margin-right: 8px;">error</span>
              <span style="vertical-align: middle;">{errorMessage}</span>
            </div>
          )}

          <form action={props.formAction} method="post" style="display: flex; flex-direction: column; gap: 20px;">
            <md-outlined-text-field label="Username" name="username" id="username" required></md-outlined-text-field>
            <md-outlined-text-field label="Password" type="password" name="password" id="password" required minlength="8"></md-outlined-text-field>

            <div class="wrap" style="margin-top: 12px;">
              <md-filled-button type="submit" style="width: 100%;">{props.submitMessage}</md-filled-button>
            </div>
          </form>

          <p style="margin-top: 24px; font-size: 14px;">
            {props.bottomMessage}{" "}
            <a href={props.bottomLink} style="text-decoration: none; color: var(--md-sys-color-primary, #6750a4); font-weight: 500;">
              {props.bottomLinkMessage}
            </a>
          </p>
        </div>

      </div>
    </BaseLayout>
  );
}
