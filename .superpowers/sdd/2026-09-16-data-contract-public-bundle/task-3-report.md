# Task 3 report — package loading, structural validation, and CLI diagnostics

## Scope delivered

- Added frozen, slotted `DatasetPackage` and `ValidationIssue` values plus the `ValidationProfile` enum.
- Added five-file filesystem loading with immutable nested JSON values and actionable missing-file, read, and JSON-parser failures.
- Added Draft 2020-12 schema dispatch using the repository schemas, a populated `FormatChecker`, stable escaped JSON Pointers, deterministic issue sorting, and the `schema.invalid` / `schema.unsupported_version` diagnostic codes.
- Added `chronomap-data validate DATASET_DIR [--profile authoring|public]`, including documented exit statuses and traceback-free usage/I/O/parser diagnostics.
- Added packaging configuration so the declared console script resolves from the `src/` layout.

No Task 4 semantic, BCP 47 case-folded duplicate, temporal, geometry, reference, or publication-policy validation was added. Both Task 3 profiles intentionally run the same structural layer; public-profile semantics remain Task 4 work.

## TDD evidence

### Loader RED

```text
$ PYTHONDONTWRITEBYTECODE=1 uv run pytest tests/test_loader.py -q -p no:cacheprovider
ImportError while importing test module '.../tests/test_loader.py'.
E   ModuleNotFoundError: No module named 'chronomap_data'
1 error in 0.42s
```

The test could not import the absent production package, before any Task 3 source files existed.

### Loader GREEN

```text
$ PYTHONDONTWRITEBYTECODE=1 uv run pytest tests/test_loader.py -q -p no:cacheprovider
...                                                                      [100%]
3 passed in 0.11s
```

### CLI RED

```text
$ PYTHONDONTWRITEBYTECODE=1 uv run pytest tests/test_cli_validate.py -q -p no:cacheprovider
ImportError while importing test module '.../tests/test_cli_validate.py'.
E   ModuleNotFoundError: No module named 'chronomap_data.cli'
1 error in 0.48s
```

The CLI module was absent before schema dispatch and command handling were implemented.

### CLI GREEN

```text
$ PYTHONDONTWRITEBYTECODE=1 uv run pytest tests/test_cli_validate.py -q -p no:cacheprovider
......                                                                   [100%]
6 passed in 5.66s
```

The first CLI implementation run exposed that `jsonschema` does not treat immutable mapping proxies and tuples as native JSON objects/arrays. Validation now projects the immutable loaded value to a transient plain JSON value, preserving the immutable package boundary.

## Final verification

```text
$ PYTHONDONTWRITEBYTECODE=1 uv run pytest tests/test_loader.py tests/test_cli_validate.py -q -p no:cacheprovider && PYTHONDONTWRITEBYTECODE=1 uv run chronomap-data validate tests/fixtures/valid/synthetic-package --profile public
.........                                                                [100%]
9 passed in 6.00s

$ uv lock && uv lock --check && PYTHONDONTWRITEBYTECODE=1 uv run pytest -q -p no:cacheprovider && git diff --check
Resolved 27 packages in 3ms
Resolved 27 packages in 4ms
................................xx...........................            [100%]
59 passed, 2 xfailed in 7.52s
```

`git diff --check` exited successfully with no output. The two strict xfails are the previously recorded Task 4 BCP 47 case-folded duplicate-tag cases. A cache scan excluding `.venv` found no `__pycache__` or `.pytest_cache` paths.
