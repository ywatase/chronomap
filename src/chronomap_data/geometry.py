"""Pure geometry invariants for two-dimensional WGS84 GeoJSON."""

from collections.abc import Mapping, Sequence
import math

from .models import ValidationIssue


Bounds = tuple[int | float, int | float, int | float, int | float]


def _pointer(base: str, *parts: object) -> str:
    suffix = "/".join(str(part).replace("~", "~0").replace("/", "~1") for part in parts)
    return base if not suffix else f"{base}/{suffix}"


def _issue(file: str, pointer: str, message: str) -> ValidationIssue:
    return ValidationIssue("geometry.invalid", file, pointer, message)


def _number(value: object) -> bool:
    if isinstance(value, bool):
        return False
    if isinstance(value, int):
        return True
    return isinstance(value, float) and math.isfinite(value)


def validate_bbox(bbox: object) -> tuple[list[ValidationIssue], Bounds | None]:
    """Return dataset bbox diagnostics and usable bounds for coordinate containment."""
    if (
        not isinstance(bbox, Sequence)
        or isinstance(bbox, str | bytes)
        or len(bbox) != 4
        or not all(_number(value) for value in bbox)
    ):
        return [_issue("dataset.json", "/bbox", "bbox must contain four finite WGS84 numbers")], None
    west, south, east, north = bbox
    if not (-180 <= west <= east <= 180 and -90 <= south <= north <= 90):
        return [_issue("dataset.json", "/bbox", "bbox must be ordered and within WGS84 bounds")], None
    return [], (west, south, east, north)


def validate_geometry(
    geometry: object,
    bbox: object,
    file: str,
    pointer: str,
) -> list[ValidationIssue]:
    """Return WGS84, containment, and GeoJSON primitive invariant issues."""
    bbox_issues, bounds = validate_bbox(bbox)
    return validate_geometry_with_bounds(geometry, bounds, file, pointer, bbox_issues)


def validate_geometry_with_bounds(
    geometry: object,
    bounds: Bounds | None,
    file: str,
    pointer: str,
    initial_issues: Sequence[ValidationIssue] = (),
) -> list[ValidationIssue]:
    """Return geometry issues using already-validated dataset bounds."""
    issues = list(initial_issues)

    if not isinstance(geometry, Mapping):
        return sorted(issues + [_issue(file, pointer, "geometry must be an object")], key=lambda issue: (issue.file, issue.pointer, issue.code, issue.message))
    geometry_type = geometry.get("type")
    coordinates = geometry.get("coordinates")

    def position(value: object, position_pointer: str) -> None:
        if not isinstance(value, Sequence) or isinstance(value, str | bytes) or len(value) != 2 or not all(_number(item) for item in value):
            issues.append(_issue(file, position_pointer, "position must contain exactly two finite numbers"))
            return
        longitude, latitude = value
        if not (-180 <= longitude <= 180 and -90 <= latitude <= 90):
            issues.append(_issue(file, position_pointer, "position must be within WGS84 longitude and latitude limits"))
            return
        if bounds is not None:
            west, south, east, north = bounds
            if not (west <= longitude <= east and south <= latitude <= north):
                issues.append(_issue(file, position_pointer, "position must be contained by the dataset bbox"))

    def positions(value: object, positions_pointer: str, minimum: int | None = None) -> None:
        if not isinstance(value, Sequence) or isinstance(value, str | bytes):
            issues.append(_issue(file, positions_pointer, "coordinate sequence must be an array"))
            return
        if minimum is not None and len(value) < minimum:
            issues.append(_issue(file, positions_pointer, f"coordinate sequence must contain at least {minimum} positions"))
        for index, item in enumerate(value):
            position(item, _pointer(positions_pointer, index))

    def ring(value: object, ring_pointer: str) -> None:
        if not isinstance(value, Sequence) or isinstance(value, str | bytes):
            issues.append(_issue(file, ring_pointer, "polygon ring must be an array"))
            return
        if len(value) < 4:
            issues.append(_issue(file, ring_pointer, "polygon ring must contain at least four positions"))
        elif value[0] != value[-1]:
            issues.append(_issue(file, ring_pointer, "polygon ring must be closed"))
        positions(value, ring_pointer)

    coordinates_pointer = _pointer(pointer, "coordinates")
    if geometry_type == "Point":
        position(coordinates, coordinates_pointer)
    elif geometry_type == "MultiPoint":
        positions(coordinates, coordinates_pointer, 1)
    elif geometry_type == "LineString":
        positions(coordinates, coordinates_pointer, 2)
    elif geometry_type == "MultiLineString":
        if not isinstance(coordinates, Sequence) or isinstance(coordinates, str | bytes):
            issues.append(_issue(file, coordinates_pointer, "multi-line coordinates must be an array"))
        elif not coordinates:
            issues.append(_issue(file, coordinates_pointer, "multi-line must contain a line"))
        else:
            for index, line in enumerate(coordinates):
                positions(line, _pointer(coordinates_pointer, index), 2)
    elif geometry_type == "Polygon":
        if not isinstance(coordinates, Sequence) or isinstance(coordinates, str | bytes):
            issues.append(_issue(file, coordinates_pointer, "polygon coordinates must be an array"))
        elif not coordinates:
            issues.append(_issue(file, coordinates_pointer, "polygon must contain an exterior ring"))
        else:
            for index, value in enumerate(coordinates):
                ring(value, _pointer(coordinates_pointer, index))
    elif geometry_type == "MultiPolygon":
        if not isinstance(coordinates, Sequence) or isinstance(coordinates, str | bytes):
            issues.append(_issue(file, coordinates_pointer, "multi-polygon coordinates must be an array"))
        elif not coordinates:
            issues.append(_issue(file, coordinates_pointer, "multi-polygon must contain a polygon"))
        else:
            for polygon_index, polygon in enumerate(coordinates):
                if not isinstance(polygon, Sequence) or isinstance(polygon, str | bytes):
                    issues.append(_issue(file, _pointer(coordinates_pointer, polygon_index), "polygon coordinates must be an array"))
                    continue
                if not polygon:
                    issues.append(_issue(file, _pointer(coordinates_pointer, polygon_index), "polygon must contain an exterior ring"))
                    continue
                for ring_index, value in enumerate(polygon):
                    ring(value, _pointer(coordinates_pointer, polygon_index, ring_index))
    else:
        issues.append(_issue(file, _pointer(pointer, "type"), "unsupported geometry type"))
    return sorted(issues, key=lambda issue: (issue.file, issue.pointer, issue.code, issue.message))
