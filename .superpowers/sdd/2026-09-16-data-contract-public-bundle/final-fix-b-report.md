# Final correction Task B report

Completed final correction Task B from clean base `cab8658`.

## Decisions and implementation

- The six v1 schemas remain in the normative repository location
  `schemas/v1/` and are duplicated byte-for-byte under
  `src/chronomap_data/schemas/v1/` for installed-package access. A regression
  test enforces synchronization.
- Schema validation now reads package resources through `importlib.resources`.
  Hatch wheel configuration packages `chronomap_data`, including the schema
  resources.
- The loader uses `object_pairs_hook` to reject duplicate JSON object member
  names at every nesting level, mapping them to `PackageLoadError` and hence
  CLI exit status 2 without a traceback.
- A dataset directory must contain exactly the five named entries, with no
  extra files or directories; each named entry must itself be a file. Missing
  required-file diagnostics remain distinct.
- Shared kind-specific ID schema definitions apply the portable
  CR/LF/U+2028/U+2029 rejection guard to every resource ID and reference ID
  field, including uncertainty evidence references and hypothesis groups.

## TDD evidence

Red tests were witnessed for duplicate nested object names and for a required
filename replaced by a directory. The initial new combined suite also exposed
the absent installed schema resources and ID final-terminator gaps. Minimal
loader, resource-loading, packaging, and shared-schema changes then made the
regressions green.

## Verification

- `pytest -q --junitxml=/tmp/chronomap-full-test.xml`: 140 tests, 0 failures,
  0 errors (101.132 seconds).
- Isolated wheel integration test: built a wheel, installed it with `pip` in a
  fresh temporary venv, removed `PYTHONPATH` and `VIRTUAL_ENV`, used an
  external working directory, validated the valid fixture through the
  installed CLI (exit 0), and verified duplicate-ID JSON fails through the
  installed CLI with exit 2 and no traceback (1 test, 0 failures/errors).
- Wheel archive inspection confirmed all six
  `chronomap_data/schemas/v1/*.schema.json` resources are present.
- `uv lock --check`, `git diff --check`, and byte-equality checks for every
  repository/package schema copy passed.

## Scope and concern

The only package-data duplication is intentional and guarded by the byte-sync
test. Fresh installed CLI processes are relatively slow in this environment,
but the clean-wheel integration and full suite completed successfully.

## Fix round 1: required-entry symlink boundary

The initial exact-five-file check used `Path.exists()` and `Path.is_file()`,
which follow symlinks. A required filename could therefore refer to a regular
file outside the package directory. The loader now uses `lstat()` and
`stat.S_ISREG` so the directory entry itself must be a non-symlink regular
file. A dangling symlink retains the required-file-missing diagnostic, while
an extant symlink, directory, FIFO, or other non-regular entry receives the
actionable required-entry type diagnostic before any attempt to read it.

TDD evidence: the real external-file symlink regression failed before the
change and passed afterwards. Focused loader coverage also passes for missing
names, dangling symlinks, extant external symlinks, directories, FIFOs, and
ordinary JSON loading.

Round-one verification: the focused loader/CLI/schema/wheel partition passed
94 tests with no failures or errors, and the complete suite passed 143 tests
with no failures or errors. Lock, whitespace, schema-sync, and cache checks
also passed; the cache check continues to list only the intentionally
force-added SDD reports.
