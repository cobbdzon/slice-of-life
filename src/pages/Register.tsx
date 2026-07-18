import { AuthLayout } from '../layouts/AuthLayout';

interface RegisterPageProps {
  errorCode?: string;
}

export function RegisterPage(props: RegisterPageProps) {
  return (
    <AuthLayout
      errorCode={props.errorCode}

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
