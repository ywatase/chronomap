"""Command-line interface for Chronomap data validation."""

import argparse
from collections.abc import Sequence
import sys

from .audit import audit_package, render_audit_markdown
from .loader import PackageLoadError, load_package
from .models import ValidationIssue, ValidationProfile
from .public_builder import PublicBuildIOError, PublicBuildValidationError, build_public_bundle
from .schema_validation import validate_package


def _parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="chronomap-data")
    commands = parser.add_subparsers(dest="command", required=True)
    validate = commands.add_parser("validate")
    validate.add_argument("dataset_dir")
    validate.add_argument(
        "--profile",
        choices=tuple(profile.value for profile in ValidationProfile),
        default=ValidationProfile.AUTHORING.value,
    )
    audit = commands.add_parser("audit")
    audit.add_argument("dataset_dir")
    audit.add_argument(
        "--profile",
        choices=tuple(profile.value for profile in ValidationProfile),
        default=ValidationProfile.PUBLIC.value,
    )
    build_public = commands.add_parser("build-public")
    build_public.add_argument("dataset_dir")
    build_public.add_argument("--output", required=True)
    return parser


def format_issue(issue: ValidationIssue) -> str:
    return f"{issue.file}:{issue.pointer} [{issue.code}] {issue.message}"


def main(argv: Sequence[str] | None = None) -> int:
    """Run the command and return its documented process status."""
    try:
        arguments = _parser().parse_args(argv)
    except SystemExit as error:
        return int(error.code)

    try:
        package = load_package(arguments.dataset_dir)
    except PackageLoadError as error:
        print(f"error: {error}", file=sys.stderr)
        return 2

    if arguments.command == "validate":
        issues = validate_package(package, ValidationProfile(arguments.profile))
        for issue in issues:
            print(format_issue(issue), file=sys.stderr)
        return 1 if issues else 0

    if arguments.command == "audit":
        profile = ValidationProfile(arguments.profile)
        issues = validate_package(package, profile)
        for issue in issues:
            print(format_issue(issue), file=sys.stderr)
        if issues:
            return 1
        try:
            report = audit_package(package, profile)
            rendered = render_audit_markdown(report)
        except ValueError as error:
            print(f"error: {error}", file=sys.stderr)
            return 1
        print(rendered, end="")
        return 0

    try:
        summary = build_public_bundle(package, arguments.output)
    except PublicBuildValidationError as error:
        for issue in error.issues:
            print(format_issue(issue), file=sys.stderr)
        return 1
    except PublicBuildIOError as error:
        print(f"error: {error}", file=sys.stderr)
        return 2
    print(
        f"built public bundle: {summary.versions} versions, {summary.entities} entities, "
        f"{summary.evidence} evidence, {summary.sources} sources -> {summary.output}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
