# Dictionary harvest scripts

Pipeline for importing Wu Chinese dictionaries into `apps/web/data-dictionaries`.

Catalogue of sources lives in sibling repo `../awesome-wu-dicts` (`data/sources.json`).

```bash
# From goetsuese-dict/
pnpm fetch-sources   # clone importable / reading_only repos into vendor/
pnpm import          # run all adapters
pnpm build-index     # write index.json (chunks large corpora)
# or:
pnpm harvest
```

Individual adapters:

- `import:ionkaon` — Ningbo lexicon + indices
- `import:dinishing` — standard Wu vocabulary + dialect TSVs
- `import:wiktionary` — Kaikki Chinese dump filtered for Wu tags (`vendor/kaikki/zh-extract.jsonl.gz`)
- `import:readings` — CjangCjengh IPA pronunciation layer

Romanization: `scripts/import/romanization/wugniu.mjs` converts Wugniu → ngven (gn→ny; tones stripped).
