# Final Fix D: stable authoring-source identity

## Change

`load_package` now resolves the supplied dataset directory once, before it
lists or reads package entries. It captures that canonical directory's
`(st_dev, st_ino)` identity and checks it again after all five files have been
loaded. `DatasetPackage` immutably carries both the canonical `path` and the
captured `directory_identity`.

Before creating public-build staging, `build_public_bundle` stats the captured
source path and rejects a missing, non-directory, or identity-changed source as
`PublicBuildIOError`. Output is canonicalized independently and compared in
both ancestor directions with the captured canonical source path. The builder
does not re-resolve the package path, so a retargeted symlink supplied at load
time cannot redirect source protection.

## TDD evidence

The initial focused regression run on `8fb8342` produced four expected RED
failures:

- a normal directory symlink was retained instead of canonicalized;
- a directory replacement during loading was accepted;
- a retargeted load alias let a build target the originally loaded source; and
- a source directory replacement after loading was accepted.

After the implementation, the five initial focused regressions passed. The
suite now additionally covers relative missing-directory diagnostics and
missing/non-directory source states.

## Regression coverage

- normal directory-symlink load captures the target path and stat identity;
- source directory replacement during load is rejected;
- retargeting an alias after loading cannot replace the original private
  authoring directory;
- replacement, removal, and conversion to a regular file after loading all
  fail before staging;
- same, ancestor, descendant, and symlink-descendant outputs remain rejected;
  a sibling output succeeds;
- successful builds leave the original authoring tree byte-for-byte unchanged.

## Verification

The following completed successfully:

- `uv run pytest tests/test_loader.py tests/test_public_builder.py tests/test_cli_validate.py tests/test_wheel_installation.py -q`
- `uv run pytest -q` (167 collected tests)
- `uv lock --check`
- `git diff --check`
- authoring and public CLI validation of the synthetic package
- two independent CLI public builds followed by a recursive byte comparison

The safety probe output contained exactly `dataset.json`, `entities.json`,
`sources.json`, `evidence.json`, and `feature-versions.geojson`; a private-ID
and private-content scan found no matches.

## Remaining concerns

None identified within the requested contract. The source check intentionally
occurs immediately before staging; as with ordinary pathname-based filesystem
operations, an adversary with concurrent write access can still race after
that check without broader locking guarantees.
