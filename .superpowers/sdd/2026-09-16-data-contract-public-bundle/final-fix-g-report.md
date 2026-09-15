# Final correction Task G report

Base: `cfe3aa8`.

## Correction

- The package loader now supplies `json.loads()` a local decimal-integer
  parser. It converts at most 18 decimal digits at a time and accumulates in
  base `10^18`, so it never invokes a whole-token decimal conversion subject
  to CPython's digit guard.
- Public-bundle serialization now uses a local canonical JSON encoder. Its
  integer formatter repeatedly divides by `10^18`, preserving the exact
  decimal value without `int.__repr__`. It retains the established UTF-8,
  Unicode-scalar, sorted-key, two-space indentation, trailing-newline, and
  array-order behavior; strings and floats retain the standard JSON scalar
  encoding.
- Neither path reads or writes `sys.int_max_str_digits`; the change is wholly
  local to parsing and formatting.

## Regression coverage

- Both positive and negative 5,001-digit coordinate tokens load rather than
  raising `PackageLoadError`, then produce a normal `geometry.invalid`
  validation diagnostic with CLI exit status 1 and no traceback.
- A public-valid `Source.publishedYear` containing a positive or negative
  5,001-digit integer builds byte-identically twice, retains the exact decimal
  token, and reloads/revalidates as public-valid.
- A clean wheel is installed in a fresh virtual environment and its CLI runs
  both signed coordinate cases with exit status 1/no traceback.
- Unit coverage checks zero, negative zero canonicalization, sign preservation,
  leading-zero JSON grammar rejection, standard scalar serialization, and a
  subprocess configured with a 640-digit process limit. That subprocess
  parses/formats 641 digits exactly and proves the configured limit is not
  changed.
- Existing serialization-failure coverage remains green: Unicode serialization
  errors are still mapped before replacement, preserving absent and existing
  outputs.

## TDD evidence

The coordinate regression was witnessed red on `cfe3aa8`: the default decoder
raised a digit-limit `ValueError`, which the loader mapped to
`PackageLoadError`. After the local `parse_int` implementation it passed.

The public-builder regression was then witnessed red: `json.dumps()` raised a
digit-limit `ValueError` while formatting `publishedYear`. After the local
canonical encoder and chunked formatter it passed.

## Verification

- Focused loader/schema/geometry/public-builder/direct-CLI/wheel/codec suite:
  167 tests, 0 failures, 0 errors, 0 skips.
- Isolated clean-wheel integration: 1 test, 0 failures, 0 errors, 0 skips.
- Full suite: 198 tests, 0 failures, 0 errors, 0 skips.
- `uv lock --check` and `git diff --check` passed.

## Scope and concern

The chunked algorithms intentionally impose no application-level digit bound.
Like arbitrary-precision integer arithmetic generally, extremely large values
still consume time and memory proportional to their size; no process-global
interpreter setting is changed to accommodate them.
