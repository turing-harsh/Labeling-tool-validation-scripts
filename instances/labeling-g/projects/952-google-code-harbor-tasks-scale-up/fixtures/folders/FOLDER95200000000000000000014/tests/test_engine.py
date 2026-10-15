import unittest
from engine import run


class TestEngine(unittest.TestCase):
    def test_returns_score(self):
        self.assertEqual(run({"x": 1})["score"], 1)

    def test_is_deterministic(self):
        self.assertEqual(run({"x": 2}), run({"x": 2}))
