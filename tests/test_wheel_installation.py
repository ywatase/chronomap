import os
from pathlib import Path
import shutil
import subprocess
import sys


ROOT = Path(__file__).parents[1]
SYNTHETIC_PACKAGE = ROOT / "tests" / "fixtures" / "valid" / "synthetic-package"


def test_built_wheel_installs_schemas_and_runs_the_installed_cli_in_a_clean_environment(tmp_path: Path):
    dist_dir = tmp_path / "dist"
    subprocess.run(
        ["uv", "build", "--wheel", "--out-dir", str(dist_dir)],
        cwd=ROOT,
        text=True,
        capture_output=True,
        check=True,
    )
    wheel = next(dist_dir.glob("chronomap_data-*.whl"))
    venv_dir = tmp_path / "wheel-venv"
    subprocess.run([sys.executable, "-m", "venv", str(venv_dir)], text=True, capture_output=True, check=True)
    python = venv_dir / ("Scripts/python.exe" if os.name == "nt" else "bin/python")
    subprocess.run([str(python), "-m", "pip", "install", str(wheel)], text=True, capture_output=True, check=True)
    script_dir = venv_dir / ("Scripts" if os.name == "nt" else "bin")
    command = shutil.which("chronomap-data", path=str(script_dir))
    assert command is not None
    clean_environment = {key: value for key, value in os.environ.items() if key not in {"PYTHONPATH", "VIRTUAL_ENV"}}
    valid = subprocess.run(
        [command, "validate", str(SYNTHETIC_PACKAGE)], cwd=tmp_path, env=clean_environment, text=True, capture_output=True, check=False
    )
    assert valid.returncode == 0, valid.stderr
    invalid_dir = tmp_path / "invalid-package"
    shutil.copytree(SYNTHETIC_PACKAGE, invalid_dir)
    (invalid_dir / "dataset.json").write_text('{"id":"synthetic:dataset:contract-sample","id":"synthetic:dataset:other"}', encoding="utf-8")
    invalid = subprocess.run(
        [command, "validate", str(invalid_dir)], cwd=tmp_path, env=clean_environment, text=True, capture_output=True, check=False
    )
    assert invalid.returncode == 2
    assert "duplicate JSON object member name 'id'" in invalid.stderr
    assert "Traceback" not in invalid.stderr

    for coordinate in ("9" * 5_001, "-" + "9" * 5_001):
        huge_coordinate_dir = tmp_path / f"huge-coordinate-{len(coordinate)}-{coordinate.startswith('-')}"
        shutil.copytree(SYNTHETIC_PACKAGE, huge_coordinate_dir)
        feature_path = huge_coordinate_dir / "feature-versions.geojson"
        feature_path.write_text(
            feature_path.read_text(encoding="utf-8").replace("[0, 0]", f"[{coordinate}, 0]", 1),
            encoding="utf-8",
        )
        huge_coordinate = subprocess.run(
            [command, "validate", str(huge_coordinate_dir)],
            cwd=tmp_path,
            env=clean_environment,
            text=True,
            capture_output=True,
            check=False,
        )
        assert huge_coordinate.returncode == 1, huge_coordinate.stderr
        assert "geometry.invalid" in huge_coordinate.stderr
        assert "Traceback" not in huge_coordinate.stderr
