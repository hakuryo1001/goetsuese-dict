# ngven romanization

Keep this document in sync across:

- `goetsusioji-mapping/docs/ngven.md`
- `goetsuese-master-app-monorepo/docs/ngven.md`
- `goetsuese-dict/docs/ngven.md` (this file)

When the Latin scheme changes, edit all three copies in the same change. Glyph charts live in the mapping repo’s `docs/goetsu-xiaozi-charts.md`; this note is only the spelling.

---

The typer’s romanization is **通用吳語拼音** (Common Wu Pinyin), in the **吳語協會** letter system, with two house changes that [ngven.org](https://www.ngven.org/words/) states outright: the entering-tone coda is **q**, and the app calls that spelling **ngven**.

## Pipeline

1. Handfill inventory → canonical syllables in `goetsusioji-mapping/mapping/goetsusioji.json`
2. Export script in the monorepo (`frontend/scripts/goetsusioji/export-syllables.mjs`) writes lookup `syllables.json` and letter `atlas.json`
3. Typer and dict load `syllables.json`; lookup ignores tone marks via `removeTone` / aliases in each checkout’s `normalize.ts`

`atlas.json` holds components, spelling rules, and tone marks. It is not the syllable lexicon.

## How a syllable is built

Initial + optional medial + final. 陰陽 is in the consonant, not in a tone number. Each stop/affricate row is three-way: aspirated, plain, voiced (`ph p b`, `th t d`, `tsh ts dz`, `ch c j`, `kh k g`). Fricatives are pairs (`f v`, `s z`, `sh zh`, `h gh`).

| Row | 陰次濁 | plain | voiced | 清擦 | 濁擦 |
| --- | --- | --- | --- | --- | --- |
| 唇 | mh | m | | f | v |
| 唇塞 | ph | p | b | | |
| 舌 | nh | n | | | |
| 舌塞 | th | t | d | | |
| 邊 | lh | l | | | |
| 舌面塞 | ch | c | j | sh | zh |
| 舌面鼻 | nyh | ny | | | |
| 齒 | tsh | ts | dz | s | z |
| 牙 | kh | k | g | | |
| 牙鼻 | nk | ng | | | |
| 喉 | h | (empty 影母) | gh | | |
| 云 / 危 onset | | i, u | y, w | | |

`y` and `w` here are **onsets** (云 / 危 pairs with `i` / `u`), not medials. Apical `y` (資雌斯 / 空韻) is a **final**. Medials are listed below.

`c ch j sh zh` already contain medial **i**, so 向 is `shian`, not `shiian`. Accepted aliases in `normalize.ts` are `ch(i)`, `c(i)`, `j(i)`, `sh(i)`, `zh(i)`.

Finals:

- Open: `a o e i u`, diphthongs `au ou eu`, 撮口 `iu` (not `ü` / `yu`)
- Checked (喉塞): `aq oq eq iq`, plus compounds `aeq oeq eoq`
- Historical nasal that has often lost nasalization: `ae oe ie` (also accepted as `ae(n) oe(n) ie(n)`)
- Still nasal: `an on en eon in aon` — one **n**, no `ng` coda and no `-m`
- Apical vowel: `y` (資雌斯). Syllabic `r` (而)
- Medials: `i` 齊齒, `u` 合口, `iu` 撮口, `r` 翹舌

`n` is nasalization or a nasal ending, not a contrast of `-n` vs `-ng`. `q` is the single entering coda (no `-p/-t/-k`).

Chart-only extras (dialect `ai` / `ei`, attachments such as `aoq` / `iuq`) live in the Xiaozi chart doc, not in this spelling note.

Tone marks (the lexicon itself is toneless):

| 調類 | mark | note |
| --- | --- | --- |
| 平 | `-` | usually left off |
| 上 | `'` | |
| 去 | `` ` `` | |
| 入 | `-q` | already the final |
| 連讀 | `-x`, `-·` | sandhi |

`removeTone` strips a trailing `-x` or `-·`, then one character from `- ' \ <`. A 去 mark typed as a trailing backtick is not stripped today.

### Samples

Phrase list (monorepo `frontend/lib/goetsusioji/examples.ts`): `zaon he` 上海, `taon nyie` 當年, `taon nyiq` 當日, `wu ngiu` 吳語, `wo yoq` 吳越, `yoq zhiq ku` 越絕歌, `zie se nyie` 前歲年, `gheu khe le` 去起來.

Chart / atlas rule examples: `keq` 個, `tiau` 鳥, `shian` 向, `maeq` 襪.

## What online matches it

**Closest: 吳語協會拼音** — [wu-chinese.com/romanization](http://wu-chinese.com/romanization/) (initials, vowels, tones). Same letters for the whole obstruent set, same `ny` (not `gn`), same finals `ae/oe/ie`, `an/aon/on/en`, medial `iu`, apical `y`, and the same rule that `c(i)` already includes `i`. Their ordinary style also leaves 舒聲 tones off and treats 陰陽 as a property of the initial.

Two systematic rewrites:

| | this repo / ngven | 吳語協會 |
| --- | --- | --- |
| 入聲 | `aq eq oq iq aeq` | `ah eh oh ih aeh` |
| 陰次濁 | `mh nh lh nyh nk` | `'m 'n 'l 'ny 'ng` |
| 調號, when used | `-` `'` `` ` `` | `1 2 3 4` (入聲 usually just `-h`) |

So 當日 is `taon nyiq` here and `taon nyih` there; 襪 is `maeq` vs `maeh`. [ngven.org/words](https://www.ngven.org/words/) tells readers to use this Latin scheme and to write 入聲 as **q**, not h or k.

**Same shape, different nasal letter: 吳語學堂拼音 (Wugniu)** — [wugniu.com](https://www.wugniu.com/), comparison on [Romanization of Wu Chinese](https://en.wikipedia.org/wiki/Romanization_of_Wu_Chinese). It uses the same vowels and the same **-q**. 上海 `zaon he`, 黨 `taon`, 越 `yoq`, 個 `keq`, 向 `shian` match. It does not match on the palatal nasal or the yin sonorants: 年 is **gnie**, not `nyie`, and `mh/nh/lh/nyh/nk` are usually collapsed into `m n l gn ng`. Tones are **1–8**. The site’s own name is the Wugniu spelling of 吳語 (`wu` + `gniu`); this repo’s sample is `wu ngiu`.

**Partial only:**

- **法吳** (吳語拉丁式注音法) shares `mh nh lh nk` and `-q`, but writes the palatal nasal as `gn`/`kn` and uses different vowel letters (上海 is `Zahnheh`, not `zaon he`).
- **錢拼** (上海話拼音方案) is a different alphabet (`b/p/bh`, 入聲 `-k`).

## In this checkout

| Path | Role |
| --- | --- |
| [`packages/goetsusioji/src/normalize.ts`](../packages/goetsusioji/src/normalize.ts) | Same `removeTone` / alias table as the monorepo typer |
| [`apps/web/public/goetsusioji/syllables.json`](../apps/web/public/goetsusioji/syllables.json) | Lookup lexicon (toneless keys) |
| [`apps/web/src/lib/goetsusioji.ts`](../apps/web/src/lib/goetsusioji.ts) | Server-side mapper over that lexicon |

Dictionary readings use `phonetic.ngven` for the canonical romanization; `phonetic.original` keeps each source book’s own notation.
