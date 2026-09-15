# Task 5 report — deterministic public bundles

## Delivered

- Added `BuildSummary` and `build_public_bundle`, which first invokes the
  existing public validation profile, then projects only explicitly public
  FeatureVersions and their reachable entities, evidence, and sources.
- Public output uses sorted record/feature IDs, sorted JSON keys, UTF-8,
  two-space indentation, and a final newline.  It is constructed from plain
  copies, so the frozen authoring package is never mutated.
- Added sibling staging plus output replacement with a backup and rollback;
  validation or staging failures leave a prior output unchanged, and staging
  and backup directories are cleaned after normal success or recoverable
  failure.
- Added `chronomap-data build-public DATASET_DIR --output OUTPUT_DIR` with
  exits 0 (success), 1 (public validation diagnostics), and 2 (I/O or usage).
- Added concise setup/command documentation and ignore rules for virtualenv,
  test/bytecode caches, and `public-bundles/`, without ignoring schemas,
  fixtures, or `uv.lock`.

## RED/GREEN evidence

The first builder test run was witnessed RED before production code existed:

```text
$ PYTHONDONTWRITEBYTECODE=1 uv run pytest tests/test_public_builder.py -q -p no:cacheprovider
ModuleNotFoundError: No module named 'chronomap_data.public_builder'
```

After the minimal builder implementation, the same focused suite was GREEN:

```text
4 passed in 5.70s
```

CLI behaviors were then added before changing the parser.  Their RED run
returned argparse's invalid-command exit 2 for `build-public`; after adding
the command and its error mapping, the focused suite was GREEN:

```text
7 passed in 5.73s
```

The post-cleanup focused rerun remained GREEN:

```text
8 passed in 5.55s
```

The additional ordering regression reverses every authoring record array and
Feature array.  Temporarily removing the sorting operation produced the
witnessed RED assertion, then restoring it returned the ordering test to
GREEN:

```text
1 failed in 5.50s
1 passed in 5.23s
```

## Final verification

The execution bridge has a foreground duration constraint, so the complete
106-test suite was verified in disjoint partitions:

```text
$ PYTHONDONTWRITEBYTECODE=1 uv run pytest tests/test_loader.py tests/test_geometry.py tests/test_schemas.py tests/test_semantic_validation.py tests/test_public_builder.py -q -p no:cacheprovider
93 passed in 8.16s

$ PYTHONDONTWRITEBYTECODE=1 uv run pytest tests/test_cli_validate.py -q -p no:cacheprovider -k 'not installed'
8 passed, 5 deselected in 5.28s

$ PYTHONDONTWRITEBYTECODE=1 uv run pytest tests/test_cli_validate.py::test_installed_validate_command_succeeds_for_a_valid_package tests/test_cli_validate.py::test_installed_validate_command_reports_a_complete_schema_diagnostic -q -p no:cacheprovider
2 passed in 16.13s

$ PYTHONDONTWRITEBYTECODE=1 uv run pytest 'tests/test_cli_validate.py::test_installed_validate_command_maps_input_errors_to_exit_2_without_a_traceback[missing]' 'tests/test_cli_validate.py::test_installed_validate_command_maps_input_errors_to_exit_2_without_a_traceback[malformed]' -q -p no:cacheprovider
2 passed in 16.17s

$ PYTHONDONTWRITEBYTECODE=1 uv run pytest 'tests/test_cli_validate.py::test_installed_validate_command_maps_input_errors_to_exit_2_without_a_traceback[nonfinite]' -q -p no:cacheprovider
1 passed in 11.22s
```

The 93 non-CLI tests, eight non-installed CLI tests, and five installed CLI
tests cover all 106 collected tests.

Both authoring and public profile validation accepted the synthetic fixture.
Two separate `build-public` outputs compared byte-for-byte for all five files;
the build reported 3 versions, 2 entities, 3 evidence records, and 2 sources.
A private-ID/content scan found no private FeatureVersion, entity, or label in
the output.

Final repository checks passed: `uv lock --check`, `git diff --check`, Markdown
relative-link validation, the placeholder scan, cache scan, and confirmation
that schemas, fixtures, and `uv.lock` remain tracked.  No generated caches
remain outside the ignored virtualenv.
