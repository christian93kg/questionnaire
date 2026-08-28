#!/usr/bin/env -S npx tsx
/**
 * Build-time og:image generator. Renders one 1200x630 PNG per character to
 * static/og/<pack>/<character>.png so shared result links get a real preview card in
 * chat apps, which never execute the client JS that decodes `?a=` — see
 * src/routes/[pack]/r/[character]/+page.ts.
 *
 *   npx tsx scripts/og.ts [packId ...]
 *
 * With no packId, renders every pack in `$lib/packs`' `PACKS` export — the packs the
 * site actually ships and routes. Deliberately *not* `scripts/lib/pack.ts`'s
 * `listPacks()` (a raw directory scan): that would also pick up `src/lib/packs/_fixture`,
 * a synthetic pack that exists only for scripts/calibrate.ts, scripts/audit.ts and the
 * engine unit tests and is never in `PACKS` or reachable from a route.
 *
 * Wired into `npm run prebuild` (after `npm run audit`, before `vite build`, since
 * static/ is only read at build time).
 */

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import type { Character, QuizPack } from '../src/lib/engine/types';
import { PACKS } from '../src/lib/packs';
import { paletteFor, type Palette } from './og/palette';
import { REPO_ROOT } from './lib/pack';

const WIDTH = 1200;
const HEIGHT = 630;
const OG_ROOT = join(REPO_ROOT, 'static', 'og');
const FONTS_DIR = join(dirname(fileURLToPath(import.meta.url)), 'og', 'fonts');
const MANIFEST_PATH = join(OG_ROOT, '.manifest.json');

/**
 * Bump this when the card template changes in a way that should force a regeneration
 * even though no character field, palette value, or font changed (e.g. a layout tweak).
 * Folded into the content hash below.
 */
const CARD_LAYOUT_VERSION = 5;

// --- optional glyph.ts integration point -------------------------------------------------
//
// src/lib/engine/glyph.ts exports `glyphFor(pack: QuizPack, characterId, cols, rows):
// string[]` — a deterministic procedural box-drawing readout of the character's axis
// vector. Loaded read-only here (this script does not own or edit that file — see the
// task boundary at the top of the repo's parallel-agent split). If it's ever absent or
// fails to load, the card still renders, just without the glyph panel.
type GlyphFor = (pack: QuizPack, characterId: string, cols: number, rows: number) => string[];

async function loadGlyphFor(): Promise<GlyphFor | null> {
	const glyphPath = join(REPO_ROOT, 'src', 'lib', 'engine', 'glyph.ts');
	if (!existsSync(glyphPath)) return null;
	try {
		const mod: Record<string, unknown> = await import(pathToFileURL(glyphPath).href);
		return typeof mod.glyphFor === 'function' ? (mod.glyphFor as GlyphFor) : null;
	} catch {
		// glyph.ts exists but doesn't load cleanly (e.g. mid-edit by another agent) — skip
		// the art rather than fail the whole og build over a decorative extra.
		return null;
	}
}

// --- fonts --------------------------------------------------------------------------------

const FONT_REGULAR_PATH = join(FONTS_DIR, 'JetBrainsMono-Regular.ttf');
const FONT_BOLD_PATH = join(FONTS_DIR, 'JetBrainsMono-ExtraBold.ttf');

function loadFonts() {
	const regular = readFileSync(FONT_REGULAR_PATH);
	const bold = readFileSync(FONT_BOLD_PATH);
	return {
		regular,
		bold,
		options: [
			{ name: 'JetBrains Mono', data: regular, weight: 400 as const, style: 'normal' as const },
			{ name: 'JetBrains Mono', data: bold, weight: 800 as const, style: 'normal' as const }
		]
	};
}

// --- footer branding label -----------------------------------------------------------------
//
// Purely cosmetic — this string is baked into the PNG pixels, unlike the actual og:image /
// og:url values (those are computed at request time by src/lib/site.ts's `absolute()` from
// the real PUBLIC_SITE_ORIGIN + base). It reads the same env vars pages.yml sets for the
// Build step so a fork's cards say the fork's domain, with a fallback matching the deployed
// site so local `npm run og` (no env vars set) still renders something sensible.
const SITE_LABEL = (() => {
	const origin = (process.env.PUBLIC_SITE_ORIGIN ?? 'https://christian93kg.github.io').replace(/^https?:\/\//, '');
	const base = process.env.BASE_PATH ?? '/questionnaire';
	return `${origin}${base}`;
})();

// --- card ----------------------------------------------------------------------------------

/** Plain satori element form: {type, props: {style, children}}. No React needed. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Node = any;

/** Cuts on a word boundary; a mid-word ellipsis reads as a rendering bug. */
function truncateWords(text: string, max: number): string {
	if (text.length <= max) return text;
	const cut = text.slice(0, max);
	const lastSpace = cut.lastIndexOf(' ');
	return `${cut.slice(0, lastSpace > 0 ? lastSpace : max).replace(/[.,;:]$/, '')}\u2026`;
}

function buildCard(
	pack: QuizPack,
	character: Character,
	glyphLines: string[] | null,
	palette: Palette
): Node {
	const eyebrowRow: Node = {
		type: 'div',
		props: {
			style: {
				display: 'flex',
				justifyContent: 'space-between',
				alignItems: 'center',
				fontSize: 20,
				letterSpacing: 4,
				textTransform: 'uppercase',
				color: palette.textFaint
			},
			children: [
				{ type: 'span', props: { children: pack.title } },
				{ type: 'span', props: { children: `FORM ${pack.formCode}` } }
			]
		}
	};

	const rule: Node = {
		type: 'div',
		props: {
			style: { display: 'flex', height: 1, width: '100%', background: palette.ruleStrong, marginTop: 28 }
		}
	};

	const glyphBlock: Node | null = glyphLines
		? {
				type: 'div',
				props: {
					style: {
						display: 'flex',
						flexDirection: 'column',
						fontSize: 16,
						lineHeight: 1.3,
						// accentPrimaryDim vanished against the near-black field at this size.
						color: palette.accentPrimary,
						opacity: 0.55,
						whiteSpace: 'pre',
						marginLeft: 40
					},
					children: glyphLines.map((line) => ({ type: 'span', props: { children: line } }))
				}
			}
		: null;

	const nameBlock: Node = {
		type: 'div',
		props: {
			style: { display: 'flex', flexDirection: 'column', flex: 1 },
			children: [
				{
					type: 'div',
					props: {
						style: {
							display: 'flex',
							fontSize: 40,
							letterSpacing: 3,
							textTransform: 'uppercase',
							color: palette.textFaint,
							marginBottom: 8
						},
						children: 'Disposition'
					}
				},
				{
					// Epithet leads: it reads even to someone who doesn't know the name
					// underneath it. Same treatment the live card's headline uses --
					// bright, glowing, and given the display-weight slot the name used to
					// hold. truncateWords is a guard rail, not a live constraint -- the
					// longest epithet on the roster today is well under this cap; it just
					// keeps a future long one from overrunning the fixed 630px canvas.
					type: 'div',
					props: {
						style: {
							display: 'flex',
							fontFamily: 'JetBrains Mono',
							fontWeight: 800,
							fontSize: 72,
							lineHeight: 0.98,
							letterSpacing: -2,
							textTransform: 'uppercase',
							color: palette.textPrimary,
							textShadow: `0 0 30px ${palette.glowText}`
						},
						children: truncateWords(character.epithet, 70)
					}
				},
				{
					// Name drops to a filed-under line -- small, faint, monospace, the way
					// the rest of this card treats metadata (see eyebrowRow, footerRow).
					type: 'div',
					props: {
						style: {
							display: 'flex',
							fontFamily: 'JetBrains Mono',
							fontWeight: 700,
							fontSize: 28,
							letterSpacing: 3,
							textTransform: 'uppercase',
							marginTop: 18,
							color: palette.textFaint
						},
						children: character.name
					}
				}
			]
		}
	};

	const contentRow: Node = {
		type: 'div',
		props: {
			style: { display: 'flex', flexDirection: 'row', alignItems: 'flex-start', flex: 1, marginTop: 44 },
			children: glyphBlock ? [nameBlock, glyphBlock] : [nameBlock]
		}
	};

	const footerRow: Node = {
		type: 'div',
		props: {
			style: {
				display: 'flex',
				justifyContent: 'space-between',
				alignItems: 'baseline',
				gap: 32,
				fontSize: 20,
				letterSpacing: 2,
				color: palette.textFaint,
				borderTop: `1px solid ${palette.ruleHairline}`,
				paddingTop: 20
			},
			children: [
				{
					type: 'span',
					props: {
						// Truncates with an ellipsis instead of wrapping onto a second line and
						// colliding with the URL column — `strength` runs up to ~80 chars.
						style: { flex: 1, minWidth: 0, overflow: 'hidden', whiteSpace: 'nowrap' },
						children: truncateWords(character.strength, 34)
					}
				},
				{ type: 'span', props: { style: { flexShrink: 0, whiteSpace: 'nowrap' }, children: SITE_LABEL } }
			]
		}
	};

	return {
		type: 'div',
		props: {
			style: {
				display: 'flex',
				flexDirection: 'column',
				width: WIDTH,
				height: HEIGHT,
				padding: '56px 64px',
				background: palette.bgBase,
				backgroundImage: `repeating-linear-gradient(180deg, ${palette.scanlineStripe} 0px, ${palette.scanlineStripe} 1px, transparent 1px, transparent 3px)`,
				fontFamily: 'JetBrains Mono',
				color: palette.textPrimary,
				border: `1px solid ${palette.ruleHairline}`,
				borderTop: `4px solid ${palette.accentPrimary}`
			},
			children: [eyebrowRow, rule, contentRow, footerRow]
		}
	};
}

// --- hashing / caching ----------------------------------------------------------------------

interface Manifest {
	[packId: string]: Record<string, string>;
}

function readManifest(): Manifest {
	if (!existsSync(MANIFEST_PATH)) return {};
	try {
		return JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')) as Manifest;
	} catch {
		return {};
	}
}

function writeManifest(manifest: Manifest) {
	mkdirSync(OG_ROOT, { recursive: true });
	writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
}

/** character fields + this pack's resolved palette + font mtimes (+ glyph.ts, if any). */
function contentHash(
	pack: QuizPack,
	character: Character,
	paletteSource: string,
	fontMtimes: string,
	glyphState: string
): string {
	const h = createHash('sha256');
	h.update(String(CARD_LAYOUT_VERSION));
	h.update(pack.id);
	h.update(pack.title);
	h.update(pack.formCode);
	h.update(
		JSON.stringify({
			id: character.id,
			name: character.name,
			epithet: character.epithet,
			strength: character.strength,
			blindspot: character.blindspot,
			region: character.region
		})
	);
	h.update(paletteSource);
	h.update(fontMtimes);
	h.update(glyphState);
	return h.digest('hex');
}

/** Presence + mtime of the optional glyph.ts, so it appearing/changing busts the cache. */
function glyphState(): string {
	const glyphPath = join(REPO_ROOT, 'src', 'lib', 'engine', 'glyph.ts');
	return existsSync(glyphPath) ? `present:${statSync(glyphPath).mtimeMs}` : 'absent';
}

// --- render -----------------------------------------------------------------------------

async function renderPng(
	pack: QuizPack,
	character: Character,
	fonts: ReturnType<typeof loadFonts>,
	glyphFor: GlyphFor | null,
	palette: Palette
): Promise<Buffer> {
	const glyphLines = glyphFor ? glyphFor(pack, character.id, 22, 14) : null;
	const element = buildCard(pack, character, glyphLines, palette);
	const svg = await satori(element, { width: WIDTH, height: HEIGHT, fonts: fonts.options });
	const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: WIDTH } });
	return resvg.render().asPng();
}

// --- main -----------------------------------------------------------------------------

async function generatePack(pack: QuizPack, fonts: ReturnType<typeof loadFonts>, glyphFor: GlyphFor | null, manifest: Manifest) {
	const dir = join(OG_ROOT, pack.id);
	mkdirSync(dir, { recursive: true });

	// Was the SOURCE TEXT of palette.ts, which meant editing a comment there regenerated
	// every card in every pack. The resolved palette is both narrower and per-pack: a
	// star-wars colour change no longer busts harry-potter's cache.
	const palette = paletteFor(pack.theme);
	const paletteSource = JSON.stringify(palette);
	const fontMtimes = `${statSync(FONT_REGULAR_PATH).mtimeMs}:${statSync(FONT_BOLD_PATH).mtimeMs}`;
	const glyph = glyphState();
	const packManifest = (manifest[pack.id] ??= {});

	let generated = 0;
	let skipped = 0;

	for (const character of pack.characters) {
		const hash = contentHash(pack, character, paletteSource, fontMtimes, glyph);
		const outPath = join(dir, `${character.id}.png`);
		const cached = packManifest[character.id] === hash && existsSync(outPath) && statSync(outPath).size > 0;

		if (cached) {
			skipped++;
			continue;
		}

		const png = await renderPng(pack, character, fonts, glyphFor, palette);
		writeFileSync(outPath, png);
		packManifest[character.id] = hash;
		generated++;
	}

	// Drop stale files for characters that no longer exist in the pack (renamed/removed ids).
	const expected = new Set(pack.characters.map((c) => `${c.id}.png`));
	for (const file of readdirSync(dir)) {
		if (!expected.has(file)) {
			rmSync(join(dir, file));
			delete packManifest[file.replace(/\.png$/, '')];
		}
	}

	console.log(`  ${pack.id}: ${generated} generated, ${skipped} unchanged (cached), ${pack.characters.length} total`);
	return dir;
}

function guard(pack: QuizPack, dir: string) {
	const files = readdirSync(dir).filter((f) => f.endsWith('.png'));
	if (files.length !== pack.characters.length) {
		throw new Error(
			`og: ${pack.id} wrote ${files.length} PNG(s) but the pack has ${pack.characters.length} character(s). ` +
				'A character added without a regenerated image ships a 404\'d og:image.'
		);
	}
	for (const file of files) {
		const size = statSync(join(dir, file)).size;
		if (size === 0) throw new Error(`og: ${pack.id}/${file} is 0 bytes.`);
	}
}

async function main(): Promise<void> {
	const requested = process.argv.slice(2).filter((a) => !a.startsWith('-'));
	const packs = requested.length ? PACKS.filter((p) => requested.includes(p.id)) : PACKS;

	if (!packs.length) {
		console.error(
			requested.length
				? `og: none of the requested pack(s) [${requested.join(', ')}] are in PACKS (${PACKS.map((p) => p.id).join(', ')}).`
				: 'og: PACKS is empty — nothing to render.'
		);
		process.exit(1);
	}

	const fonts = loadFonts();
	const glyphFor = await loadGlyphFor();
	if (!glyphFor) {
		console.log('og: src/lib/engine/glyph.ts not present yet — rendering cards without glyph art.');
	}

	const manifest = readManifest();
	console.log(`og: rendering ${packs.length} pack(s): ${packs.map((p) => p.id).join(', ')}`);

	let totalPngs = 0;
	for (const pack of packs) {
		const dir = await generatePack(pack, fonts, glyphFor, manifest);
		guard(pack, dir);
		totalPngs += pack.characters.length;
	}

	writeManifest(manifest);
	console.log(`og: done — ${totalPngs} PNG(s) verified across ${packs.length} pack(s).`);
}

main().catch((err: unknown) => {
	console.error(`og crashed: ${err instanceof Error ? err.stack : String(err)}`);
	process.exit(1);
});
