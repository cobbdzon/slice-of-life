import { Bar } from "../components/Bar";
import { getUserTotalFilesSize } from "../db/queries/uploads";
import type { User } from "../db/schema";
import { BaseLayout } from "../layouts/BaseLayout";

export type ProfilePageProps = {
  user: User;
}

export async function ProfilePage({ user }: ProfilePageProps) {
  const userFileSizeTaken = await getUserTotalFilesSize(user.id) / (1024 * 1024);
  const userFileSizeLimit = user.fileUploadLimit / (1024 * 1024);

  return (
    <BaseLayout user={user}>
      <md-title>
        Hello there
      </md-title>
      <span> {userFileSizeTaken.toFixed(2)} / {userFileSizeLimit} MiB </span>
      <Bar value={ userFileSizeTaken / userFileSizeLimit }></Bar>
    </BaseLayout>
  )
}
