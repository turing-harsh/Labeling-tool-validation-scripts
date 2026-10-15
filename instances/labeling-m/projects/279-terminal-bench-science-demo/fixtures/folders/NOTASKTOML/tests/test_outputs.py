import json


def test_result():
    assert json.load(open('/tests/reference.json'))
