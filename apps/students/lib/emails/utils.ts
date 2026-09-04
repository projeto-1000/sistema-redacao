export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function escapeAttribute(value: string) {
  return escapeHtml(value);
}

export function normalizeAppUrl(url: string) {
  return url.replace(/\/$/, "");
}
