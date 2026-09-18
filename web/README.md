# Chronomap web app

This is Chronomap's static, responsive historical-map pilot. It reads the
Japanese public bundle at `/data/ogurike/` by default, which contains a small,
approximate set of cited 巨椋池 snapshots for 1590, 1596, 1910, and 1942. The
allow-listed `tonegawa` bundle adds a three-snapshot Tone River eastward-shift
pilot, and `heijokyo` adds a single-year pilot for the Heijokyo capital and
Suzaku Avenue. Restricted source pages are represented by citation-only
metadata; the browser does not receive private authoring records or copied
source body text.

## Setup and commands

The unit suite regenerates the public bundles through the repository's
`chronomap-data` command. Prepare the repository virtual environment and put it
on `PATH` before running the web commands:

```sh
cd ..
uv sync
export PATH="$PWD/.venv/bin:$PATH"
cd web
```

From this directory, install Node dependencies and start the development server:

```sh
npm install
npm run dev
```

Create a production static build:

```sh
npm run build
```

The build bundles MapLibre's worker with Vite (`?worker&url`), so the
production preview can parse and render the historical GeoJSON source without
depending on a package-relative worker URL.

Run the unit tests or Chromium browser acceptance tests:

```sh
npm test
npm run test:browser
```

The browser tests run both 390×844 smartphone and 1440×900 desktop projects.
Install Playwright's Chromium browser if it is not already available with
`npx playwright install chromium`.

If `npm test` reports that `chronomap-data` is missing, confirm that the
repository `.venv/bin` directory is still present on `PATH` in the same shell.

## Shareable views

Use the `この表示を共有` button to copy a permalink containing the dataset,
year, selected feature, and map camera. A shared URL can also be opened
directly, for example:

```text
/?dataset=ogurike&year=1910&feature=ogurike%3Aversion%3Awaterbody-1910&lng=135.75&lat=34.89&z=11.5
```

Only public bundle records are restored from URL parameters. Invalid or
out-of-range parameters fall back to the safe default view. Camera links use
the Web Mercator-safe latitude range and MapLibre's default zoom ceiling.

## Start hub

The root page (`/`) starts with three work-oriented choices: explore a region's
historical map, make a classroom pack from the featured lesson, or resume a
draft file saved on the current device. The root also states the current pilot
coverage and the teacher workflows being validated. Existing `dataset=...`
direct links continue to open the requested map or lesson view without the
root hub.

To resume a draft from the root, choose the UTF-8 JSON file created by
`下書きをファイル保存`. Chronomap validates its dataset, lesson, steps, and
size before loading the matching allow-listed public bundle. Draft contents are
held in memory only during the handoff; they are not put in the URL or browser
storage. An invalid file or unavailable dataset leaves the hub in place and
shows an error.

## Comparing snapshots

When the public bundle contains two or more exact, single-year versions of the
same entity, the sidebar exposes a comparison card. The pilots currently offer
the Ujigawa 1590/1596 pair and the Tone River 1590/1654 pair. Selecting either
side updates the map, detail panel, and share URL together; the card remains
usable when the basemap is unavailable.

## Printable reports

After selecting a public feature, use `レポートを出力` to open a citation-ready
brief containing the selected year, possible period, explanation, uncertainty,
evidence locators, source rights, and a reproducible share URL. The browser print
dialog can save the report as a PDF. The report is generated entirely in the
browser; restricted source body text and images are never copied into it. If the
GSI basemap is unavailable, the text evidence and share URL remain printable.

## Map display settings

Open `表示設定` on the map to adjust basemap and historical-feature opacity,
toggle historical features, and read the point/line/area/selected-feature legend.
These controls change only the MapLibre presentation layers; the selected
feature list, detail metadata, and share URL remain available even when the
historical overlay is hidden. Settings survive a basemap retry for the current
view.

## Guided lesson

The static `巨椋池と宇治川の変化をたどる`, `利根川東遷を概略地図でたどる`,
and `平城京の都市軸をたどる` lessons turn their public snapshots into short
guided routes. The Ogurike route covers 1590, 1596, 1910, and 1942; the Tone
River route covers 1590, 1594, and 1654; the Heijokyo route covers three
observations in 710. Each final step offers sharing, a printable report, and
the classroom pack. Lesson state is encoded as `lesson=...&step=...` alongside
the normal year, feature, and camera parameters, so a copied URL and a reload
restore the same step. Lesson JSON is optional static content: if it is missing
or does not match the validated public bundle, the map still opens in normal
mode.

## Classroom pack (beta)

After starting or completing the guided lesson, `この教材を授業用に整える`
opens a browser-only editor. A teacher can set a lesson title and optional class
label, choose existing steps, rewrite observation prompts, and include or omit
the teacher reference before opening the print preview. The same editor is the
primary action for lesson cards in the catalog and can be opened directly with
`/?dataset=tonegawa&lesson=tonegawa-eastward&view=builder`.
Unsaved edits stay in memory and are discarded when the page reloads.

Use `下書きをファイル保存` when you need to continue later, then use
`下書きファイルを開く` after reopening the same dataset and lesson. The browser
downloads a UTF-8 JSON file named
`chronomap-{dataset}-{lesson}-draft.json`. It contains only the current title,
class label, selected steps, selected-step prompts, and teacher-reference flag.
It does not contain source bodies, evidence, URLs, map positions, feedback, or
account data, and it is never sent to Chronomap. Files are limited to 64 KiB and
are rejected when they target another dataset/lesson or contain unknown fields.

The existing `授業用教材パックを作成（β版無料）` action opens a print preview with
three sections: a student worksheet, a teacher reference sheet, and a
sources/rights sheet. The student worksheet includes one locally generated
black-and-white SVG QR code for the exact start URL, plus the original
clickable URL as a fallback. Each lesson step keeps its exact href while showing
a short online-link label. It includes one start URL and one share URL
for each lesson step, observation prompts and writing space, feature
descriptions, uncertainty notes, evidence locators, and deduplicated source
metadata. Restricted sources remain citation-only; source body text, images, and
inscriptions are not reproduced. The browser print dialog can save the pack as
an A4 portrait PDF without a server or PDF library.

After a print/PDF attempt, the preview reveals a collapsed one-minute feedback
form. It asks whether the pack is usable in class, which next teacher workflow
would help most, and optionally accepts a 500-character comment. `回答文を作成`
generates copy-only text containing the dataset slug, lesson ID, selected-step
count, and teacher-material flag; it never includes the edited title, class
label, prompts, or map position. `回答文をコピー` uses the Clipboard API when
available and falls back to a selectable answer textarea. Nothing is sent to a
server or stored in browser storage, and the in-memory answers disappear on
reload.

## Dataset catalog

Use `地域・教材を選ぶ` in the header to open the allow-listed region and lesson
catalog. Each card derives its recorded years and public feature/entity/source
counts from the bundle, and its lesson duration/step count from the validated
manifest. Available cards link to a free map view and, when published, a guided
lesson plus the classroom editor; a failed card shows the failure without hiding the other dataset. The
catalog itself can be opened directly and restored with `?view=catalog`, for
example `/?dataset=tonegawa&view=catalog`. The page distinguishes current free
pilot functions from future teacher-workflow candidates and does not assert a
price, contract, or billing state. The Tone River and Heijokyo geometries are
explicitly approximate reconstructions; external source text and images remain
citation-only.

## Teacher quick start

Opening `/` shows a lightweight welcome flow before the map header. It explains
the three-step path—choose evidence, shape an observation prompt, and share a
PDF—and links directly to the Ogurike finished example. The root welcome is a
normal page region, so the map and existing dataset controls remain available
after scrolling. The finished example uses an allow-listed deep link:

```text
/?dataset=ogurike&lesson=ogurike-intro&view=pack
```

The pack preview can return to the browser-only editor, then to print/PDF and
the copy-only feedback form. Reloading the pack URL restores the same preview;
invalid dataset or lesson combinations do not open a pack. The welcome copy
describes the current pilot output—student worksheet, teacher reference, QR
code, source list, and PDF—without implying saving, accounts, or billing.

## Pilot data

The checked-in public files under `public/data/ogurike/` are generated with the
repository's Python builder:

```sh
cd .. && uv run chronomap-data build-public data/ogurike --output web/public/data/ogurike
```

Only the public projection files are served to the browser. Authoring data,
including private feature versions and source body text, is not copied here.

The Tone River bundle is generated with the same command:

```sh
cd .. && uv run chronomap-data build-public data/tonegawa --output web/public/data/tonegawa
```

The Heijokyo bundle is generated with the same command:

```sh
cd .. && uv run chronomap-data build-public data/heijokyo --output web/public/data/heijokyo
```
