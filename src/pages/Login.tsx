import { AuthLayout } from '../layouts/AuthLayout';

interface LoginPageProps {
  errorCode?: string;
}

export function LoginPage(props: LoginPageProps) {
  return (
    <AuthLayout
      errorCode={props.errorCode}

      pageTitle="Login - Slice of Life"
      title="Login"
      subtitle="Enter your login credentials"
      submitMessage="Login"
      bottomMessage="Not registered?"
      bottomLink="/register"
      bottomLinkMessage="Create account"
      cardImage="/static/assets/images/login-illustration.png"
    >
    </AuthLayout>
  )
}
