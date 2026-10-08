# 吳林 · Wulam

Local Next.js Wu Chinese (吳語 / Goetsuese) dictionary workspace, structurally based on [Jyutlam](https://github.com/) (粵語彙林).

Every reading can show **ngven** romanization next to **Goetsusioji** (吳小字 / Siauzy) glyphs. This app does **not** deploy and does **not** use MongoDB.

## Backend

There is a backend: **Next.js Route Handlers** in `apps/web/src/app/api/`. They load dictionary JSON from disk into memory on first request. There is no separate server process.

## Run locally

Requires Node 18+ and pnpm (`minimumReleaseAge: 1440` in `pnpm-workspace.yaml`).

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000

Dictionary data lives at `apps/web/data-dictionaries`. Override with `WULAM_DATA_DIR` if needed. The scaffold ships an empty `index.json` (`dictionaries: []`) so the app runs before any corpora are added.

## Layout

```
goetsuese-dict/          this Next.js workspace
  apps/web/              app + route handlers
  packages/goetsusioji/  ngven → Goetsusioji (Siauzy / Han)
```

## Empty data format

`apps/web/data-dictionaries/index.json`:

```json
{
  "dictionaries": [],
  "schema_version": "1"
}
```

Add dictionary metadata objects to `dictionaries` and place matching JSON files (or chunk dirs) beside the index when you are ready to populate content. Entry phonetics use `phonetic.ngven` for the canonical romanization; `phonetic.original` keeps each source book's own notation. Spelling note (synced with `goetsusioji-mapping` and `goetsuese-master-app-monorepo`): [`docs/ngven.md`](docs/ngven.md).

## What this ports (from Jyutlam)

- Home, search, word, browse, about
- Search / word / browse / suggest / random / dictionaries APIs
- Goetsusioji conversion from ngven (`packages/goetsusioji`)
- Light / dark theme and interface languages (en, zh-Hant, zh-Hans, wuu-Hant, wuu-Hans)

Skipped: MongoDB, TTS audio, GitHub issue feedback, sitemaps, Cloudflare/Vercel deploy, automatic Han → ngven conversion (stubbed until a Wu converter exists).
