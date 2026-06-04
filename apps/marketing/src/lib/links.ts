const base =
  process.env.NEXT_PUBLIC_SIMULATOR_URL?.replace(/\/$/, "") ??
  "http://localhost:5173";

export function simulatorHref(path = "/?showcase=1"): string {
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
