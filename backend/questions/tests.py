from decimal import Decimal
from django.test import SimpleTestCase
from questions.scoring import score_short, score_choice, score_mcq_snapshot


class ScoringTests(SimpleTestCase):
    def test_empty_alias_not_zero(self):
        # B09 regression: "" must not match numeric 0
        ok, pts = score_short(["", "7"], "0", tolerance=0, points=Decimal("1"))
        self.assertFalse(ok)
        self.assertEqual(pts, Decimal("0"))

    def test_numeric_tolerance(self):
        ok, pts = score_short(["3.14"], "3.141", tolerance=0.01, points=Decimal("1"))
        self.assertTrue(ok)

    def test_choice(self):
        ok, pts, chosen = score_choice(1, ["B"], Decimal("2"))
        self.assertTrue(ok)
        self.assertEqual(chosen, 1)
        self.assertEqual(pts, Decimal("2"))

    def test_mcq_snapshot(self):
        qs = [
            {"correct": 1, "points": 1, "id": 1},
            {"answer_key": {"correct": 0}, "points": 2, "id": 2},
        ]
        total, mx, rows = score_mcq_snapshot(qs, {0: ["B"], 1: ["A"]})
        self.assertEqual(total, Decimal("3"))
        self.assertEqual(mx, Decimal("3"))
        self.assertTrue(rows[0]["is_correct"])
