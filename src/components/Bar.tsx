export type BarProps = {
  value: number;
  className?: string;
  label?: string;
}

export function Bar({ value, className, label }: BarProps) {
  value = Math.min(Math.max(0, value), 1);
  const percentage = value * 100;
  return (
      <div
        class={`m3-progress-bar ${className}`}
        role="progressbar"
        aria-label={label}
        aria-valuenow={Math.round(percentage)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          class="m3-progress-bar__indicator"
          style={{ width: `${percentage}%` }}
        />
      </div>
    );
}
