import { Bar } from "../components/Bar";
import type { User } from "../db/schema";
import { BaseLayout } from "../layouts/BaseLayout";

export type ProfilePageProps = {
  user: User;
}

export function ProfilePage({ user }: ProfilePageProps) {
  return (
    <BaseLayout user={user}>
      <md-title>
        Hello there
      </md-title>
      <Bar value={0.5}></Bar>
    </BaseLayout>
  )
}
