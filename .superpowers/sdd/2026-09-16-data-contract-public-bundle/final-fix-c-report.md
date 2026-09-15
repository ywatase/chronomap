# Final correction C report

Base: `2f3bb72`
Scope: semantic language tags, geometry diagnostics, bbox validation, and contract clarification.

## Decisions

- A whole-tag BCP 47 private-use value whose first subtag is `x` has no
  variant or extension-singleton duplicate restriction.  Its remaining
  private-use subtags are therefore not inspected by semantic duplicate
  detection.
- Semantic duplicate-tag diagnostics use `language.invalid`.  Scalar
  `defaultLanguage` diagnostics target `/defaultLanguage`; text-map
  diagnostics target the escaped offending map key.
- Non-boolean JSON integers are finite regardless of their magnitude.
  Floats remain subject to finite-value checks.  Geometry validation now
  validates a dataset bbox once and passes usable bounds to each feature.
- Public serialization canonicalizes record and ID-reference arrays only;
  coordinates and non-ID semantic arrays retain authored order.

## Tests and checks

- RED: 9 focused regressions failed before implementation, covering private
  use tags, `language.invalid`, empty-collection and duplicate bbox reports,
  empty MultiLineString, and huge-integer coordinate/bbox handling.
- GREEN: focused regression selection — `10 passed`.
- `uv run pytest tests/test_semantic_validation.py tests/test_geometry.py tests/test_schemas.py -q` — `99 passed`.
- `uv lock --check` completed successfully.
- `uv run pytest -q` completed successfully, including the isolated wheel
  installation coverage; `tests/test_wheel_installation.py` was also run
  directly.
- Documentation local-link inventory and placeholder scan were clean.
- `git diff --check` was clean. Cache/artifact scan found only ignored local
  virtualenv and pytest/Python cache files; no generated artifacts are staged.

## Concern

No project linter or type checker is declared in `pyproject.toml`; `ruff` is
not installed, so no non-configured lint command was added to the gate.

## Fix round 1 — serialization wording

- Corrected the Task 1 plan wording to limit canonical sorting to public
  top-level record arrays and ID-reference arrays, with Features sorted by
  Feature ID. Coordinate and non-ID semantic arrays retain authored order.
- Confirmed that this matches `docs/data/model.md`, the public builder, and
  the builder regression that preserves coordinates and Evidence `supports`.
