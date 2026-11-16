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

  notice?: string;

  passwordAutocomplete?: string;
}

const ERROR_MESSAGES: Record<string, string> = {
  INVALID_CREDENTIALS: "Invalid username or password.",
  INTERNAL_SERVER_ERROR: "Something went wrong. Please try again.",
  USERNAME_TAKEN: "This username is already taken.",
  VALIDATION_ERROR: "Please check your input and try again.",
};

export function AuthLayout(props: AuthLayoutProps) {
  const errorMessage = props.errorCode
    ? ERROR_MESSAGES[props.errorCode] ?? props.errorCode
    : undefined;

  const passwordAutocomplete = props.passwordAutocomplete ?? "current-password";

  return (
    <BaseLayout
      title={props.pageTitle}
      stylesheets={["/static/assets/css/auth.css"]}
      scripts={["/static/assets/js/auth-form.js"]}
      showTopBar={false}
    >
      <div class="auth-shell">

        <aside class="auth-cover" aria-hidden="true">
          <img
            class="auth-cover__image"
            src={props.cardImage || "/static/assets/images/login-illustration.svg"}
            alt=""
            loading="eager"
            decoding="async"
          />
          <div class="auth-cover__overlay">
            <a class="auth-cover__brand no-link-style" href="/">Slice of Life</a>
            <p class="auth-cover__tagline">A quiet place to remember.</p>
          </div>
        </aside>

        <section class="auth-panel">
          <div class="auth-panel__inner">
            <header class="auth-panel__header">
              <h1 class="auth-panel__title">{props.title}</h1>
              <p class="auth-panel__subtitle">{props.subtitle}</p>
            </header>

            {errorMessage && (
              <div class="auth-banner auth-banner--error" role="alert">
                <span class="material-symbols-outlined auth-banner__icon">error</span>
                <span class="auth-banner__text">{errorMessage}</span>
              </div>
            )}

            {props.notice && (
              <div class="auth-banner auth-banner--notice" role="status">
                <span class="material-symbols-outlined auth-banner__icon">info</span>
                <span class="auth-banner__text">{props.notice}</span>
              </div>
            )}

            <form action={props.formAction} method="post" class="auth-form" autocomplete="on">
              <md-outlined-text-field
                label="Username"
                name="username"
                id="username"
                required
                autocomplete="username"
              ></md-outlined-text-field>
              <md-outlined-text-field
                label="Password"
                type="password"
                name="password"
                id="password"
                required
                minlength="8"
                autocomplete={passwordAutocomplete}
              ></md-outlined-text-field>

              <md-filled-button type="submit" class="auth-submit">
                {props.submitMessage}
              </md-filled-button>
            </form>

            <p class="auth-switch">
              {props.bottomMessage}{" "}
              <a href={props.bottomLink} class="auth-switch__link">
                {props.bottomLinkMessage}
              </a>
            </p>
          </div>
        </section>

      </div>
    </BaseLayout>
  );
}