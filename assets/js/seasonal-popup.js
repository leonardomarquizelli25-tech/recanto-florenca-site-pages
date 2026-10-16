// Campaign controller kept at the existing URL to preserve the publishing contract.
(() => {
  const notice = document.querySelector("[data-holiday-note]");
  if (!notice) return;
  const expiresAt = Date.parse(notice.dataset.expiresAt);
  let timer;

  function updateVisibility() {
    window.clearTimeout(timer);
    const remaining = expiresAt - Date.now();
    const visible = Number.isFinite(remaining) && remaining > 0;
    notice.hidden = !visible;
    document.body.classList.toggle("holiday-note-visible", visible);
    if (visible) timer = window.setTimeout(updateVisibility, Math.min(remaining, 2147483647));
  }

  updateVisibility();
  window.addEventListener("pageshow", updateVisibility);
  document.addEventListener("visibilitychange", updateVisibility);
})();
