document.addEventListener("DOMContentLoaded", () => {
  const root = document.querySelector("[data-expires-at]");
  if (!root) return;

  const expiresAt = Number(root.dataset.expiresAt);
  const output = root.querySelector("[data-countdown]");
  if (!Number.isFinite(expiresAt) || !output) return;

  const pad = (n) => String(n).padStart(2, "0");

  const format = (ms) => {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return hours > 0
      ? `${hours}h ${pad(minutes)}m ${pad(seconds)}s`
      : `${minutes}m ${pad(seconds)}s`;
  };

  const tick = () => {
    const remaining = expiresAt - Date.now();
    if (remaining <= 0) {
      output.textContent = "expired";
      window.location.href = "/logout";
      return;
    }
    output.textContent = format(remaining);
  };

  tick();
  setInterval(tick, 1000);
});
