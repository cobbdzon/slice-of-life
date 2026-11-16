import { BaseLayout } from "../layouts/BaseLayout";

export function LandingPage() {
  return (
    <BaseLayout title="Slice of Life" showTopBar={false} stylesheets={["/static/assets/css/landing.css"]}>
      <header class="landing-nav">
        <a class="landing-logo no-link-style" href="/">Slice of Life</a>
        {/* <nav class="landing-nav__links"> */}
        {/*   <a href="/login" class="landing-nav__link">Log in</a> */}
        {/*   <md-filled-button href="/register" class="landing-cta">Get started</md-filled-button> */}
        {/* </nav> */}
      </header>

      <main class="landing-hero">
        <div class="landing-hero__text">
          <p class="landing-eyebrow">A personal journal</p>
          <h1 class="landing-title">One entry a day.<br /><span class="landing-title__keep">Yours to keep.</span></h1>
          <p class="landing-sub">
            Capture a slice of every day — a title, a note, and the photos or video that
            made it yours. Private by default. No feeds, no likes, no noise.
          </p>
          <div class="landing-actions">
            <md-filled-button href="/register" class="landing-btn landing-btn--primary">Start journaling</md-filled-button>
            <md-outlined-button href="/login" class="landing-btn">I already have an account</md-outlined-button>
          </div>
        </div>
        <img
          class="landing-hero__art"
          src="/static/assets/images/landing-hero-art.svg"
          alt=""
          aria-hidden="true"
          loading="eager"
          decoding="async"
        />
      </main>

      <section class="landing-features">
        <article class="landing-card landing-card--a">
          <span class="material-symbols-outlined landing-card__icon">calendar_today</span>
          <h2>One per day</h2>
          <p>Each date holds a single entry, so your journal reads like a calendar, not a feed.</p>
        </article>
        <article class="landing-card landing-card--b">
          <span class="material-symbols-outlined landing-card__icon">photo_library</span>
          <h2>Media that stays</h2>
          <p>Attach photos or video to any entry. They live with the day they belong to.</p>
        </article>
        <article class="landing-card landing-card--c">
          <span class="material-symbols-outlined landing-card__icon">lock</span>
          <h2>Just yours</h2>
          <p>No sharing, no followers. Your words and images stay between you and your journal.</p>
        </article>
      </section>

      <footer class="landing-footer">
        <p>Slice of Life — a quiet place to remember.</p>
      </footer>
    </BaseLayout>
  );
}
