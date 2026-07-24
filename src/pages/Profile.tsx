import { Bar } from "../components/Bar";
import { getUserTotalFilesSize } from "../db/queries/uploads";
import type { User } from "../db/schema";
import { BaseLayout } from "../layouts/BaseLayout";

export type ProfilePageProps = {
  user: User;
}

export async function ProfilePage({ user }: ProfilePageProps) {
  const userRole = "Free"
  const userAvatarUrl = `https://api.dicebear.com/10.x/glyphs/svg?seed=${encodeURIComponent(user.username)}`;
  const memberSinceText = new Date(user.createdAt as string).toLocaleString("en-US", {
    dateStyle: "long",
  });

  const userFileSizeTaken = await getUserTotalFilesSize(user.id) / (1024 * 1024); // In MiB
  const userFileSizeLimit = 10;   // In MiB
  const usageRatio = userFileSizeTaken / userFileSizeLimit;
  const usagePercentage = Math.round(usageRatio * 100);

  return (
    <BaseLayout user={user} stylesheets={["/static/assets/css/profile.css"]}>
      <div class="profile-container">
        <div class="m3-user-card">
          {/* Header Section */}
          <div class="m3-user-card__header">
            <div class="m3-user-card__avatar-wrapper">
              <img
                src={userAvatarUrl}
                alt={user.username}
                class="m3-user-card__avatar"
              />
            </div>
            <div class="m3-user-card__info">
              <h1 class="m3-user-card__name">{user.username}</h1>
              <div class="m3-user-card__badge-row">
                <span class="m3-chip m3-chip--primary">{userRole}</span>
                <span class="m3-chip m3-chip--outline">Member since {memberSinceText}</span>
              </div>
            </div>
          </div>

          <hr class="m3-divider" />

          {/* Storage Details Section */}
          <div class="m3-user-card__storage">
            <div class="m3-storage-header">
              <div class="m3-storage-header__title-group">
                <svg class="m3-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM19 18H6c-2.21 0-4-1.79-4-4 0-2.05 1.53-3.76 3.56-3.97l1.07-.11.5-.95C8.08 7.14 9.94 6 12 6c2.62 0 4.88 1.86 5.39 4.43l.3 1.5 1.53.11c1.56.1 2.78 1.41 2.78 2.96 0 1.65-1.35 3-3 3z" />
                </svg>
                <span class="m3-storage-header__label">Storage Space</span>
              </div>
              <span class="m3-storage-header__percentage">{usagePercentage}% used</span>
            </div>

            <div class="m3-storage-bar-wrapper">
              <Bar value={usageRatio} />
            </div>

            <div class="m3-storage-footer">
              <span class="m3-storage-footer__stats">
                <strong>{userFileSizeTaken.toFixed(2)} MiB</strong> of {userFileSizeLimit} MiB
              </span>
              <span class="m3-storage-footer__remaining">
                {(userFileSizeLimit - userFileSizeTaken).toFixed(2)} MiB remaining
              </span>
            </div>
          </div>
        </div>
      </div>
    </BaseLayout>
  );
}
