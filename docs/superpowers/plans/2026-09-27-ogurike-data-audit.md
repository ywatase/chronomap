# 巨椋池データ信頼性ゲート Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 巨椋池の公開FeatureVersionを出典・不確実性・権利まで決定的に監査でき、Web UIで代表的な点・線・面の根拠を確認できる状態にする。

**Architecture:** Authoring packageを変更せず、既存のvalidation済み`DatasetPackage`を公開監査モデルへ純粋投影する。Python CLIはMarkdownをstdoutへ出し、チェックインした監査資料はその出力のレビュー用スナップショットとする。Web側は既存metadata panelのE2E境界だけを強化する。

**Tech Stack:** Python 3.12, pytest, existing `chronomap-data` CLI, TypeScript/Vite, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-27-ogurike-data-audit-design.md`

## Global Constraints

- 公開監査は`ValidationProfile.PUBLIC`を通過したデータだけを扱う。
- 原資料本文・画像・碑文全文を取得または転載しない。
- Source URLの外部取得、保存、認証、決済、分析を追加しない。
- 監査出力は日時・環境依存値を含めず、Feature／Evidence／SourceをID順に並べる。
- 日本語Web UI、390×844／1440×900、既存の横overflow・外部通信なしの境界を維持する。

## Review Focus

- 公開Featureではないprivate featureが監査資料へ混入しないこと — audit unit test。
- restricted Sourceが本文や画像ではなくcitation-only metadataだけになること — audit render test。
- Evidence／Source配列の入力順が変わってもMarkdownが同じこと — determinism test。
- validation失敗時に成功レポートがstdoutへ出ないこと — CLI failure test。
- 代表的な点・線・面のUI選択で不確実性・Evidence・Source・権利が欠落しないこと — Playwright test。

---

### Task 1: 監査モデルとMarkdownレンダラー

**Files:**
- Create: `src/chronomap_data/audit.py`
- Test: `tests/test_audit.py`

**Interfaces:**
- Consumes: `DatasetPackage`, `ValidationProfile`、既存の公開Feature/Evidence/Source JSON契約
- Produces: `AuditReport`, `audit_package(package: DatasetPackage, profile: ValidationProfile = ValidationProfile.PUBLIC) -> AuditReport`, `render_audit_markdown(report: AuditReport) -> str`

- [ ] **Step 1: Write the failing tests** — 公開Featureだけを選び、Feature ID順・Evidence locator・Source権利・4次元assessmentを出すこと、入力配列順を入れ替えても出力が同じこと、restricted Sourceの本文相当フィールドを出さないことを`tests/test_audit.py`に固定する。
- [ ] **Step 2: Run tests to verify they fail** — `PATH="$PWD/.venv/bin:$PATH" pytest -q tests/test_audit.py`。Expected: `ModuleNotFoundError`または未定義APIで失敗。
- [ ] **Step 3: Implement `audit_package` and `render_audit_markdown`** — validation済みpackageから公開featureをID順に投影し、feature/evidence/sourceを明示的なfrozen dataclassで保持する。欠落参照は空欄にせず`ValueError`とし、Markdownは固定見出し・表・注意書きを返す。
- [ ] **Step 4: Run tests to verify they pass** — `PATH="$PWD/.venv/bin:$PATH" pytest -q tests/test_audit.py`。Expected: 全テスト成功。
- [ ] **Step 5: Commit** — `git add src/chronomap_data/audit.py tests/test_audit.py && git commit -m "feat: add deterministic dataset audit report"`

### Task 2: CLI audit command and Ogurike audit snapshot

**Files:**
- Modify: `src/chronomap_data/cli.py`
- Modify: `tests/test_cli_validate.py`
- Modify: `tests/test_ogurike_package.py`
- Create: `docs/data/ogurike-audit.md`

**Interfaces:**
- Consumes: Task 1 `audit_package` and `render_audit_markdown`
- Produces: `chronomap-data audit DATASET_DIR [--profile ...]`, stdout Markdown on success, existing issue format and exit code on validation failure

- [ ] **Step 1: Write the failing tests** — CLI成功時にstdoutへ監査見出し・Feature IDが出てstderrが空、壊れたpackageではexit 1かつstdout空、巨椋池の4公開Featureがレポートに1回ずつ出ることを追加する。
- [ ] **Step 2: Run tests to verify they fail** — `PATH="$PWD/.venv/bin:$PATH" pytest -q tests/test_cli_validate.py tests/test_ogurike_package.py`。Expected: `audit`サブコマンド未認識または期待出力不一致。
- [ ] **Step 3: Implement CLI routing** — `audit` parserを追加し、package load後にpublic validationを実行、issue時は既存`format_issue`でstderrへ出してexit 1、成功時だけrendererのstdoutを出す。authoring profile指定も許可するが、既定はpublicにする。
- [ ] **Step 4: Run tests and generate the snapshot** — `PATH="$PWD/.venv/bin:$PATH" pytest -q tests/test_cli_validate.py tests/test_ogurike_package.py` の後、`PATH="$PWD/.venv/bin:$PATH" chronomap-data audit data/ogurike` の出力を`docs/data/ogurike-audit.md`へapply_patchで反映する。Expected: package testsとCLI testsが成功し、監査資料が決定的なMarkdownになる。
- [ ] **Step 5: Commit** — `git add src/chronomap_data/cli.py tests/test_cli_validate.py tests/test_ogurike_package.py docs/data/ogurike-audit.md && git commit -m "docs: add ogurike data audit snapshot"`

### Task 3: Representative point/line/polygon Web evidence E2E

**Files:**
- Modify: `web/tests/browser/ogurike-data.spec.ts`

**Interfaces:**
- Consumes: Existing public Ogurike bundle and metadata panel selectors
- Produces: Desktop/mobile Playwright coverage for source, evidence, uncertainty, rights of representative geometry types

- [ ] **Step 1: Write the failing test** — 1590年線、1910年面、1942年点を選択し、metadata panel内に対応する不確実性、locator、Source citation、権利表示が存在することを追加する。
- [ ] **Step 2: Run the focused browser test to verify the boundary** — `cd web && PATH="/home/ywatase/.nvm/versions/node/v24.21.0/bin:$PATH" npx playwright test tests/browser/ogurike-data.spec.ts --project=mobile-chromium --workers=1 --trace=off`。Expected: 新しいassertionがまず失敗するか、既存DOMとの差異が明らかになる。
- [ ] **Step 3: Adjust only test selectors or UI copy if needed** — production UIの既存privacy boundaryを変えず、代表的な証拠が既存metadata panelで見えることを固定する。
- [ ] **Step 4: Run focused mobile and desktop tests** — 同specをmobile／desktopで実行。Expected: 両プロジェクト成功、横overflowなし。
- [ ] **Step 5: Commit** — `git add web/tests/browser/ogurike-data.spec.ts && git commit -m "test: verify ogurike evidence in the map UI"`

### Task 4: Full verification and documentation alignment

**Files:**
- Modify: `docs/product/roadmap.md`
- Modify: `docs/product/overview.md`
- Modify: `web/README.md` if command usage needs documenting

**Interfaces:**
- Consumes: Task 1–3 outputs and audit command
- Produces: Roadmap item for the completed credibility gate and reproducible verification record

- [ ] **Step 1: Update docs** — 実データ信頼性ゲート、監査コマンド、Ogurike audit snapshotの位置づけと非目標を追記する。
- [ ] **Step 2: Run Python verification** — `PATH="$PWD/.venv/bin:$PATH" pytest -q`。Expected: 全Pythonテスト成功。
- [ ] **Step 3: Run Web unit/build** — `cd web && PATH="/home/ywatase/.nvm/versions/node/v24.21.0/bin:$PATH" npm run build && npx vitest run --exclude tests/public-asset-sync.test.ts`。Expected: build成功、unit成功。
- [ ] **Step 4: Run production E2E and inspect screenshots** — production previewで`CHRONOMAP_PREVIEW=1 npm run test:browser -- --workers=2 --trace=off`を実行し、Ogurike evidence screenshotを`view_image`で確認する。Expected: 全E2E成功、desktop/mobile横overflowなし。
- [ ] **Step 5: Commit and final review** — docsと検証結果をコミットし、`git diff --check`、`git status --short`、最終ログを確認する。
