document.addEventListener("DOMContentLoaded", () => {
  const root = document.querySelector("[data-expires-at]");
  if (!root) return;

  const expiresAt = Number(root.dataset.expiresAt);
  const totalMs = Number(root.dataset.totalMs);
  const output = root.querySelector("[data-countdown]");
  if (!Number.isFinite(expiresAt) || !output) return;

  const format = (ms) => {
    if (ms <= 0) return "0s";
    const hours = Math.floor(ms / 3_600_000);
    if (hours >= 1) return `${hours}h`;
    const minutes = Math.floor(ms / 60_000);
    if (minutes >= 1) return `${minutes}m`;
    return `${Math.ceil(ms / 1000)}s`;
  };

  const severity = (ratio) => {
    if (ratio <= 0.2) return "is-critical";
    if (ratio <= 0.5) return "is-warning";
    return "";
  };

  const tick = () => {
    const remaining = expiresAt - Date.now();
    if (remaining <= 0) {
      output.textContent = "expired";
      window.location.href = "/logout";
      return;
    }

    output.textContent = format(remaining);

    root.classList.remove("is-warning", "is-critical");
    const cls = severity(totalMs > 0 ? remaining / totalMs : 1);
    if (cls) root.classList.add(cls);
  };

  tick();
  setInterval(tick, 1000);
});
