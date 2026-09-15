"""Immutable public values for Chronomap dataset validation."""

from dataclasses import dataclass
from enum import StrEnum
from pathlib import Path
from types import MappingProxyType
from typing import TypeAlias


JsonValue: TypeAlias = None | bool | int | float | str | tuple["JsonValue", ...] | MappingProxyType[str, "JsonValue"]
JsonObject: TypeAlias = MappingProxyType[str, JsonValue]


class ValidationProfile(StrEnum):
    AUTHORING = "authoring"
    PUBLIC = "public"


@dataclass(frozen=True, slots=True)
class ValidationIssue:
    code: str
    file: str
    pointer: str
    message: str


@dataclass(frozen=True, slots=True)
class DatasetPackage:
    """Loaded package data bound to its canonical source directory identity."""

    path: Path
    directory_identity: tuple[int, int]
    dataset: JsonValue
    entities: JsonValue
    sources: JsonValue
    evidence: JsonValue
    feature_versions: JsonValue
