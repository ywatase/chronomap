"""Pure WGS84 geometry semantic validation."""

from chronomap_data.geometry import validate_geometry


def issue_shapes(geometry, bbox=(-10, -10, 10, 10)):
    return {(issue.code, issue.pointer) for issue in validate_geometry(geometry, bbox, "feature-versions.geojson", "/features/0/geometry")}


def test_geometry_validation_rejects_an_invalid_dataset_bbox():
    issues = issue_shapes({"type": "Point", "coordinates": [0, 0]}, bbox=(10, -10, -10, 10))

    assert issues == {("geometry.invalid", "/bbox")}


def test_geometry_validation_rejects_coordinates_outside_wgs84_or_the_dataset_bbox():
    issues = issue_shapes({"type": "LineString", "coordinates": [[-11, 0], [181, 91]]})

    assert issues == {
        ("geometry.invalid", "/features/0/geometry/coordinates/0"),
        ("geometry.invalid", "/features/0/geometry/coordinates/1"),
    }


def test_geometry_validation_requires_lines_to_have_two_positions():
    issues = issue_shapes({"type": "LineString", "coordinates": [[0, 0]]})

    assert issues == {("geometry.invalid", "/features/0/geometry/coordinates")}


def test_geometry_validation_requires_polygon_rings_to_be_closed_and_have_four_positions():
    issues = issue_shapes({"type": "Polygon", "coordinates": [[[0, 0], [1, 0], [1, 1]]]})

    assert issues == {
        ("geometry.invalid", "/features/0/geometry/coordinates/0"),
    }


def test_geometry_validation_requires_polygons_to_contain_an_exterior_ring():
    issues = issue_shapes({"type": "Polygon", "coordinates": []})

    assert issues == {
        ("geometry.invalid", "/features/0/geometry/coordinates"),
    }


def test_geometry_validation_requires_each_multipolygon_to_contain_an_exterior_ring():
    issues = issue_shapes({"type": "MultiPolygon", "coordinates": [[]]})

    assert issues == {
        ("geometry.invalid", "/features/0/geometry/coordinates/0"),
    }


def test_geometry_validation_requires_multipolygons_to_contain_a_polygon():
    issues = issue_shapes({"type": "MultiPolygon", "coordinates": []})

    assert issues == {
        ("geometry.invalid", "/features/0/geometry/coordinates"),
    }
