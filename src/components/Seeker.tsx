import { getMonthNames } from '../backend/entry';

export type SeekerProps = {
  year: number;
  month?: number;
  singleMonthView?: boolean;
}

export function Seeker({ year, month, singleMonthView }: SeekerProps) {
  const currentDate = new Date();
  const monthIndex = (month !== undefined ? month : currentDate.getMonth());
  const monthName = getMonthNames()[monthIndex];
  const isLatestYear = year >= currentDate.getFullYear();
  const isOldestYear = year <= 1975;
  const isLatestMonth = isLatestYear && monthIndex === 11;

  return (
    <nav class="seeker" data-year={year} data-month={monthIndex} data-mode={singleMonthView ? "month" : "year"}>
      <div class="seeker-row">
        <span class="seeker-label">Year</span>
        {
          isOldestYear ? (
            <button class="seeker-btn" disabled aria-label="Previous year">
              <span class="material-symbols-outlined">chevron_left</span>
            </button>
          ) : (
            <a href={`/?year=${year - 1}`} class="seeker-btn no-link-style" aria-label="Previous year">
              <span class="material-symbols-outlined">chevron_left</span>
            </a>
          )
        }
        <span class="seeker-value seeker-value--year">{year}</span>
        {
          isLatestYear ? (
            <button class="seeker-btn" disabled aria-label="Next year">
              <span class="material-symbols-outlined">chevron_right</span>
            </button>
          ) : (
            <a href={`/?year=${year + 1}`} class="seeker-btn no-link-style" aria-label="Next year">
              <span class="material-symbols-outlined">chevron_right</span>
            </a>
          )
        }
      </div>
      <div class="seeker-row">
        <span class="seeker-label">Month</span>
        <button class="seeker-btn" data-month-step="-1" aria-label="Previous month">
          <span class="material-symbols-outlined">chevron_left</span>
        </button>
        <span class="seeker-value seeker-value--month">{monthName}</span>
<button class="seeker-btn" data-month-step="1" disabled={isLatestMonth} aria-label="Next month">
  <span class="material-symbols-outlined">chevron_right</span>
</button>
      </div>
    </nav>
  );
}