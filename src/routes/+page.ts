import { redirect } from '@sveltejs/kit';
import { base } from '$app/paths';
import { DEFAULT_PACK_ID } from '$lib/packs';

export const prerender = true;

export function load() {
	redirect(307, `${base}/${DEFAULT_PACK_ID}/`);
}
