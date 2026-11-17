import { Bar } from "../components/Bar";
import { getUserTotalFilesSize } from "../db/queries/uploads";
import type { User } from "../db/schema";
import { BaseLayout } from "../layouts/BaseLayout";

export type ProfilePageProps = {
  user: User;
}

export async function ProfilePage({ user }: ProfilePageProps) {
  const userRole = "Free plan";
  const monogram = Array.from(user.username.trim() || "?")[0]?.toUpperCase() ?? "?";

  const memberSinceDate = new Date(user.createdAt ?? Date.now());
  const memberSinceText = memberSinceDate.toLocaleString("en-US", {
    dateStyle: "long",
  });
  const memberSinceIso = Number.isNaN(memberSinceDate.getTime())
    ? undefined
    : memberSinceDate.toISOString();

  const userFileSizeTaken = (await getUserTotalFilesSize(user.id)) / (1024 * 1024); // In MiB
  const userFileSizeLimit = user.fileUploadLimit || 10; // In MiB (default 10 for Free plan)
  const usageRatio = userFileSizeLimit > 0 ? userFileSizeTaken / userFileSizeLimit : 0;
  const usagePercentage = Math.round(Math.min(Math.max(usageRatio, 0), 1) * 100);
  const remainingFileSize = Math.max(userFileSizeLimit - userFileSizeTaken, 0);
  const storageStateClass = usageRatio >= 0.9 ? " profile-card--storage-critical" : "";

  return (
    <BaseLayout user={user} title="Profile - Slice of Life" stylesheets={["/static/assets/css/profile.css"]}>
      <div class="profile-page">
        <article class={`profile-card${storageStateClass}`} aria-labelledby="profile-name">
          <header class="profile-card__identity">
            <div class="profile-card__monogram" aria-hidden="true">{monogram}</div>

            <div class="profile-card__intro">
              <h1 id="profile-name" class="profile-card__name">{user.username}</h1>
              <p class="profile-card__member">
                Keeping a journal since{" "}
                <time datetime={memberSinceIso}>{memberSinceText}</time>
              </p>
              <span class="profile-card__plan">{userRole}</span>
            </div>
          </header>

          <section class="profile-card__storage" aria-labelledby="profile-storage">
            <div class="profile-card__storage-head">
              <h2 id="profile-storage" class="profile-card__storage-title">Storage</h2>
              <p class="profile-card__usage">
                <span class="profile-card__usage-value">{usagePercentage}%</span>
                <span class="profile-card__usage-label">used</span>
              </p>
            </div>

            <Bar
              value={usageRatio}
              className="profile-card__bar"
              label={`Storage used: ${usagePercentage}%, ${userFileSizeTaken.toFixed(2)} of ${userFileSizeLimit} MiB`}
            />

            <div class="profile-card__figures">
              <p>
                <strong>{userFileSizeTaken.toFixed(2)} MiB</strong> of {userFileSizeLimit} MiB
              </p>
              <p>{remainingFileSize.toFixed(2)} MiB free</p>
            </div>

            <p class={`profile-card__storage-note${usageRatio >= 0.9 ? " profile-card__storage-note--critical" : ""}`}>
              {usageRatio >= 0.9
                ? "You're close to your plan limit. Remove unused media to free space."
                : "Photos and video count toward this limit."}
            </p>
          </section>

          <footer class="profile-card__actions">
            <md-filled-button class="profile-card__logout" onclick="window.location.href='/logout'">
              <span slot="icon" class="material-symbols-outlined" aria-hidden="true">logout</span>
              Log out
            </md-filled-button>
          </footer>
        </article>
      </div>
    </BaseLayout>
  );
}
