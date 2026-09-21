import { AuthLayout } from '../layouts/AuthLayout';
import { env } from '../backend/env';

interface RegisterPageProps {
  errorCode?: string;
}

export function RegisterPage(props: RegisterPageProps) {
  return (
    <AuthLayout
      errorCode={props.errorCode}
      notice={env.TEST_INSTANCE
        ? `Test instance: this account expires in ${env.TEST_ACCOUNT_TTL_MINUTES} minute(s) and all of its data (including uploads) is deleted afterwards.`
        : undefined}

      pageTitle="Register - Slice of Life"
      title="Register"
      subtitle="Create an account"
      submitMessage="Register"
      formAction="/register"
      bottomMessage="Already have an account?"
      bottomLink="/login"
      bottomLinkMessage="Login"
      cardImage="/static/assets/images/login-illustration.png"
    >
    </AuthLayout>
  )
}
