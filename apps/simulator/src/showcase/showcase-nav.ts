export function isShowcaseView(): boolean {
  return new URLSearchParams(window.location.search).has("showcase");
}

export function openShowcase(): void {
  const url = new URL(window.location.href);
  url.searchParams.set("showcase", "1");
  window.location.href = url.toString();
}

export function closeShowcase(): void {
  const url = new URL(window.location.href);
  url.searchParams.delete("showcase");
  window.history.replaceState({}, "", url.pathname + url.search);
}
