"""Tests des algorithmes économiques KIVU (WMA, EOQ, Safety Stock)."""
import math
import unittest

from services.economics import (
    weighted_moving_average,
    forecast_demand_wma,
    economic_order_quantity,
    safety_stock,
    reorder_point,
    abc_analysis,
)


class WMATestCase(unittest.TestCase):
    def test_linear_weights(self):
        self.assertAlmostEqual(
            weighted_moving_average([10, 20, 30]),
            (10 * 1 + 20 * 2 + 30 * 3) / 6,
        )

    def test_custom_weights(self):
        self.assertAlmostEqual(
            weighted_moving_average([10, 20, 30], [1, 1, 1]),
            20.0,
        )

    def test_empty(self):
        self.assertEqual(weighted_moving_average([]), 0.0)


class EOQTestCase(unittest.TestCase):
    def test_wilson_formula(self):
        # D=1000, S=50, H=2 → sqrt(2*1000*50/2) = 223.6
        result = economic_order_quantity(1000, 50, 2)
        self.assertAlmostEqual(result["eoq"], 223.61, places=1)

    def test_invalid_inputs(self):
        result = economic_order_quantity(0, 50, 2)
        self.assertIn("warning", result)


class SafetyStockTestCase(unittest.TestCase):
    def test_zero_variance(self):
        result = safety_stock([10, 10, 10, 10], lead_time_days=5)
        self.assertEqual(result["safetyStock"], 0.0)

    def test_95_service_level(self):
        result = safety_stock([5, 7, 6, 8, 4, 9, 6], lead_time_days=7, service_level=0.95)
        self.assertGreater(result["safetyStock"], 0)
        self.assertAlmostEqual(result["zScore"], 1.65, places=2)


class ReorderPointTestCase(unittest.TestCase):
    def test_rop(self):
        result = reorder_point([5, 7, 6, 8, 4, 9, 6], lead_time_days=7)
        self.assertGreater(result["reorderPoint"], result["avgDailyDemand"] * 7)


class ABCTestCase(unittest.TestCase):
    def test_classification(self):
        items = [
            {"id": 1, "value": 1000},  # A (gros contributeur)
            {"id": 2, "value": 200},
            {"id": 3, "value": 50},
            {"id": 4, "value": 5},
        ]
        result = abc_analysis(items)
        self.assertEqual(result[0]["class"], "A")
        # Dernier = C
        self.assertEqual(result[-1]["class"], "C")


if __name__ == "__main__":
    unittest.main()
