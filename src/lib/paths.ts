// Shared by Next.js configuration and public-file consumers. Rebuild if changed.
// GitHub Actions sets NEXT_PUBLIC_BASE_PATH from the repository name, so a fork
// or renamed copy deploys without edits. Local development defaults to /aksharam.
export const BASE_PATH = normalizeBasePath(
  process.env.NEXT_PUBLIC_BASE_PATH ?? "/aksharam",
);
function normalizeBasePath(value: string): string {
  const trimmed = value.trim().replace(/^\/+|\/+$/g, "");
  return trimmed ? `/${trimmed}` : "";
}

/** Prefix public files (audio, images, downloads); Next Link handles routes itself. */
export function publicAssetPath(path: string): string {
  if (/^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(path)) return path;
  const rooted = path.startsWith("/") ? path : `/${path}`;
  if (
    rooted === BASE_PATH ||
    rooted.startsWith(`${BASE_PATH}/`) ||
    rooted.startsWith(`${BASE_PATH}?`)
  )
    return rooted;
  return `${BASE_PATH}${rooted}`;
}
