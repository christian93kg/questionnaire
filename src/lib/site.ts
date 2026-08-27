import { base } from '$app/paths';
import { PUBLIC_SITE_ORIGIN } from '$env/static/public';

/**
 * `page.url.origin` is literally `http://sveltekit-prerender` during prerender, and even
 * outside prerender it wouldn't include `/questionnaire` — that comes from `base`, driven
 * by `BASE_PATH` (see vite.config.ts). Both halves are required for a link that survives
 * being shared outside the site; omitting either one 404s with no build-time signal.
 *
 * `PUBLIC_SITE_ORIGIN` is a real, always-defined env var, not an optional one: the default
 * lives in the committed `.env` at the repo root (safe — it's a public URL, not a secret),
 * and `.github/workflows/pages.yml` overrides it per-repository so a fork of this template
 * resolves to that fork's own Pages URL instead of hardcoding `christian93kg`.
 */
export const SITE_ORIGIN = PUBLIC_SITE_ORIGIN;

/** Build an absolute, shareable URL for a site-relative path (e.g. `/star-wars/r/vader/`). */
export const absolute = (path: string) => `${SITE_ORIGIN}${base}${path}`;
