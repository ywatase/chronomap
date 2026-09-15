import os
import json
from pathlib import Path
import subprocess
import sys

from chronomap_data import loader, public_builder


ROOT = Path(__file__).parents[1]


def test_decimal_integer_parse_and_format_preserve_zero_sign_and_exact_digits():
    for token, expected in (("0", "0"), ("-0", "0"), ("-42", "-42"), ("9" * 5_001, "9" * 5_001)):
        value = loader._parse_json_integer(token)

        assert public_builder._format_json_integer(value) == expected


def test_canonical_serialization_retains_standard_json_scalars_key_sorting_and_indentation():
    value = {"z": [True, False, None, 1.25, "😀"], "a": {"second": 2, "first": 1}}

    assert public_builder._serialized(value) == (
        json.dumps(value, ensure_ascii=False, indent=2, sort_keys=True) + "\n"
    ).encode("utf-8")


def test_chunked_decimal_conversion_works_past_a_low_process_digit_limit_without_mutating_it():
    script = """
import sys

from chronomap_data import loader, public_builder

sys.set_int_max_str_digits(640)
configured_limit = sys.get_int_max_str_digits()
token = '-' + '9' * 641
value = loader._parse_json_integer(token)
encoded = public_builder._serialized({'integer': value})
expected = ('{\\n  \\"integer\\": ' + token + '\\n}\\n').encode('utf-8')
if encoded != expected:
    raise SystemExit('decimal round-trip changed digits')
if sys.get_int_max_str_digits() != configured_limit:
    raise SystemExit('codec changed the process digit limit')
"""
    environment = dict(os.environ)
    environment["PYTHONPATH"] = str(ROOT / "src")

    result = subprocess.run(
        [sys.executable, "-c", script],
        cwd=ROOT,
        env=environment,
        text=True,
        capture_output=True,
        check=False,
    )

    assert result.returncode == 0, result.stderr
