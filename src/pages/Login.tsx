import { AuthLayout } from '../layouts/AuthLayout';
import { env } from '../backend/env';

interface LoginPageProps {
  errorCode?: string;
  notice?: string;
}

export function LoginPage(props: LoginPageProps) {
  return (
    <AuthLayout
      errorCode={props.errorCode}
      notice={props.notice ?? (env.TEST_INSTANCE
        ? "Test instance: accounts are temporary and expire."
        : undefined)}
      passwordAutocomplete="current-password"

      pageTitle="Login - Slice of Life"
      title="Login"
      subtitle="Enter your login credentials"
      submitMessage="Login"
      formAction="/login"
      bottomMessage="Not registered?"
      bottomLink="/register"
      bottomLinkMessage="Create account"
      cardImage="/static/assets/images/login-illustration.png"
    >
    </AuthLayout>
  )
}