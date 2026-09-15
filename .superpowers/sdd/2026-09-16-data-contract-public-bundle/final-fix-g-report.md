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

## Fix round 1: strict scalar and recursion serialization failures

The chunked canonical encoder initially used `json.dumps()` for floats without
its strict finite-number setting, so defensive projected `NaN`, positive
infinity, and negative infinity values could be written as non-standard JSON.
It also did not convert a `RecursionError` from an unexpectedly deep projected
value into the builder's documented I/O error boundary.

- Floats now use `allow_nan=False`; every non-finite float raises `ValueError`,
  which `_serialized()` maps to `PublicBuildIOError`, and the CLI returns 2
  without a traceback.
- `_serialized()` now maps `RecursionError` in the same way. This happens
  before staging can be committed, so both absent output and an existing output
  directory remain unchanged.
- The defensive tests begin with a real loaded package and only inject the
  otherwise schema-unreachable projected documents after public validation is
  deliberately bypassed. The deep-value regression invokes the actual encoder
  under a temporary, test-only low recursion limit rather than relying on a
  mocked exception.
- Cycle, unsupported-type, and Unicode serialization mappings remain covered;
  standard finite float output remains byte-compatible with the former JSON
  scalar behavior.

### Round-1 TDD and verification

The new non-finite build regressions were red because the prior float branch
emitted `NaN`/`Infinity`, and the deep projection regressions were red because
`RecursionError` escaped the public builder and CLI. The smallest corrective
change made both paths green.

- Public-builder plus integer-codec regressions: 46 tests, 0 failures.
- Updated public-builder regression suite: 42 tests, 0 failures.
- Focused integer-codec/public-builder/CLI/clean-wheel suite: 67 tests, 0
  failures, 0 errors, 0 skips.
- Full suite: 209 tests, 0 failures, 0 errors, 0 skips.
- `uv lock --check` and `git diff --check` passed.
