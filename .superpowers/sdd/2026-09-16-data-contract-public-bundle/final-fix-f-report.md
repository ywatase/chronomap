# Final correction F report

Base: `bc7f313`

## Input-boundary corrections

- The loader's post-read source identity check now uses `lstat()` on the
  captured canonical pathname. It accepts only that pathname being a directory
  with the captured device/inode identity; a renamed directory restored at its
  former name through a symlink is rejected even when the symlink resolves to
  the original inode.
- Public builds make the same non-following `lstat()` check before validation
  or staging. Therefore a stale loaded package whose canonical source name was
  replaced by a same-inode symlink cannot replace an absent or existing output.
- JSON load/freeze recursion failures are converted to `PackageLoadError` with
  `invalid JSON: JSON structure is too deeply nested`. This includes both the
  standard decoder and the immutable recursive freeze operation.
- JSON values and object member names reject UTF-16 surrogate code points.
  Escaped lone high/low surrogates receive the loader's invalid-JSON diagnostic,
  while genuine supplementary Unicode scalars (literal and escaped pairs)
  continue to load.
- Deterministic public serialization converts `UnicodeError`, including UTF-8
  encoding errors, to `PublicBuildIOError` before the atomic replacement path.
  Staging cleanup leaves an absent output absent and preserves pre-existing
  output bytes.

## TDD evidence

The same-inode symlink-back loader regression was run red against the base:
after reading the first file, the real package directory was renamed and a
directory symlink was put back at the canonical name; the base loader accepted
it. The test passed after the non-following directory identity change.

The added regressions exercise real filesystem source replacement, 2,000-level
JSON nesting through the loader and installed CLI, both escaped surrogate
values and object keys, literal/escaped supplementary scalar acceptance, and
serialization failure with both absent and pre-existing output directories.

## Verification

- Focused loader boundary/deep/freeze/surrogate coverage: `7 passed`.
- Focused public-builder source/serialization coverage: `5 passed`.
- Installed CLI deep/surrogate coverage: `3 passed`.
- Full suite: `PYTHONDONTWRITEBYTECODE=1 uv run pytest -q -p no:cacheprovider
  --junitxml=/tmp/chronomap-task-f-full.xml` recorded `187` tests, `0`
  failures, `0` errors, and `0` skips (105.910 seconds), including clean-wheel
  installation and installed CLI execution.
- `uv lock --check` and `git diff --check` completed successfully.

## Scope and concern

The canonical-path checks deliberately retain support for an initial user
supplied directory alias: it is resolved once, then the resulting canonical
pathname itself must remain a direct directory entry. Earlier focused test
runs created only ignored Python/pytest cache artifacts; they do not appear in
the version-control status.

## Fix round 1: portable symlink setup

The two same-inode symlink-back regressions now catch `OSError` only around
their directory `symlink_to()` setup and call `pytest.skip`, matching the
existing symlink fixture pattern. Assertions and the loader/build operation
remain outside that handler, so an unavailable platform feature skips solely
the setup-dependent test and cannot mask a behavioral failure.

Focused normal execution of those two regressions passed (`2 passed`), while a
subprocess that replaced `Path.symlink_to()` with an `OSError` simulation
reported exactly those two tests as skipped (`2 skipped`).
