# Task 4 report — historical data semantics

## Scope delivered

- Extended `validate_package` so it returns structural diagnostics first and
  short-circuits all shape-dependent semantic validation whenever any schema
  diagnostic exists.  Otherwise it invokes the semantic layer and sorts every
  diagnostic by `(file, pointer, code, message)`.
- Added pure temporal, cross-file reference, global resource-ID, default
  language, case-folded BCP 47 text-map, uncertainty, hypothesis, geometry,
  and public-profile validation without mutating the loaded package.
- Added pure WGS84 geometry validation for bbox ordering/containment, coordinate
  bounds, LineString length, Polygon ring length/closure, and exterior-ring
  presence for Polygon and MultiPolygon members.
- Enforced the public contract: publishable dataset/FeatureVersion rights,
  temporal plus geometry evidence, a derived-geometry publication basis,
  complete rights metadata for referenced open/permission sources, citation-only
  restricted/unknown-source use with a locator and rights terms, and at least
  two public members in each public hypothesis group.
- Converted the two Task 2 mixed-case BCP 47 duplicate cases from strict schema
  expected failures into passing semantic coverage.  The xfail markers were
  removed from `tests/test_schemas.py`; semantic tests now reject both repeated
  variants and repeated extension singletons after case-folding.

## Recovery assessment

The inherited implementation already covered the Task 4 brief's ID/reference,
bbox/coordinate, line/ring, temporal, hypothesis, uncertainty/evidence subset,
structural-short-circuit, deterministic-order, and public-profile rule groups.
The recovered focused baseline was:

```text
$ PYTHONDONTWRITEBYTECODE=1 uv run pytest tests/test_geometry.py tests/test_semantic_validation.py tests/test_schemas.py -q -p no:cacheprovider
71 passed in 6.90s
```

Review against the binding model found one missing geometry rule: an empty
`Polygon`, or an empty polygon member of a `MultiPolygon`, reached no ring
validator and was accepted.  The recovery also added direct public-profile
coverage for FeatureVersion rights, incomplete referenced open-source metadata,
and valid citation-only `unknown` sources.

## TDD evidence

The recovered empty-polygon behavior used two witnessed red-green cycles.

```text
$ PYTHONDONTWRITEBYTECODE=1 uv run pytest tests/test_geometry.py::test_geometry_validation_requires_polygons_to_contain_an_exterior_ring -q -p no:cacheprovider
1 failed in 0.15s

$ PYTHONDONTWRITEBYTECODE=1 uv run pytest tests/test_geometry.py -q -p no:cacheprovider
5 passed in 0.08s
```

The first failure showed `Polygon` coordinates `[]` incorrectly produced no
issues.  The minimal production change requires an exterior ring.

```text
$ PYTHONDONTWRITEBYTECODE=1 uv run pytest tests/test_geometry.py::test_geometry_validation_requires_each_multipolygon_to_contain_an_exterior_ring -q -p no:cacheprovider
1 failed in 0.12s

$ PYTHONDONTWRITEBYTECODE=1 uv run pytest tests/test_geometry.py -q -p no:cacheprovider
6 passed in 0.09s
```

The second failure independently proved the same omission for an empty member
of `MultiPolygon`; the follow-up change only covers that member shape.

## Final verification

Focused suites, with bytecode and pytest caching disabled:

```text
$ PYTHONDONTWRITEBYTECODE=1 uv run pytest tests/test_geometry.py -q -p no:cacheprovider
6 passed in 0.09s

$ PYTHONDONTWRITEBYTECODE=1 uv run pytest tests/test_semantic_validation.py -q -p no:cacheprovider
20 passed in 7.62s

$ PYTHONDONTWRITEBYTECODE=1 uv run pytest tests/test_schemas.py -q -p no:cacheprovider
47 passed in 7.15s
```

The execution bridge ends a single foreground process at roughly 28 seconds,
so its monolithic full-suite run did not return an exit summary after 12 CLI
cases.  The complete 95-test collection was therefore verified in disjoint
pytest partitions under the same options:

```text
$ PYTHONDONTWRITEBYTECODE=1 uv run pytest tests/test_loader.py tests/test_geometry.py tests/test_schemas.py tests/test_semantic_validation.py -q -p no:cacheprovider
82 passed in 7.73s

$ PYTHONDONTWRITEBYTECODE=1 uv run pytest tests/test_cli_validate.py -q -p no:cacheprovider -k 'not installed'
8 passed, 5 deselected in 5.21s

$ PYTHONDONTWRITEBYTECODE=1 uv run pytest tests/test_cli_validate.py -q -p no:cacheprovider -k 'installed and not nonfinite'
4 passed, 9 deselected in 28.07s

$ PYTHONDONTWRITEBYTECODE=1 uv run pytest 'tests/test_cli_validate.py::test_installed_validate_command_maps_input_errors_to_exit_2_without_a_traceback[nonfinite]' -q -p no:cacheprovider
1 passed in 11.04s
```

Together these partitions cover all 95 collected tests, including every
installed-process CLI case.  The package and repository checks were also run:

```text
$ uv lock --check
Resolved 27 packages in 2ms

$ git diff --check
# no output, exit 0

$ find . -path './.venv' -prune -o \( -name '__pycache__' -o -name '.pytest_cache' -o -name '*.pyc' \) -print
# no output, exit 0
```

No generated cache or bytecode artifact remains outside `.venv`.
