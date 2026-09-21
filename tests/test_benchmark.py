import json
import unittest

from benchmarks.run import run_benchmark


class ContextBenchmarkTest(unittest.TestCase):
    def test_benchmark_runs_all_scenarios_with_computed_metrics(self):
        report = run_benchmark()
        self.assertEqual(len(report["scenarios"]), 5)
        scenario_ids = [item["scenario"] for item in report["scenarios"]]
        self.assertEqual(
            scenario_ids,
            [
                "B1-documentation-trivial",
                "B2-local-implementation",
                "B3-local-bug",
                "B4-cross-module-feature",
                "B5-security-sensitive",
            ],
        )
        for item in report["scenarios"]:
            self.assertGreater(item["baseline"]["context_chars"], 0)
            self.assertGreater(item["routed"]["bootstrap_files"], 0)
            self.assertLessEqual(item["routed"]["files_loaded"], item["baseline"]["files_loaded"])
            self.assertLessEqual(item["routed"]["context_chars"], item["baseline"]["context_chars"])
            self.assertIsNotNone(item["context_size_reduction_percent"])
            self.assertGreater(item["context_size_reduction_percent"], 0)
            self.assertIsNone(item["runtime_tokens"])
        self.assertIsNone(report["totals"]["input_token_reduction_percent"])
        json.dumps(report)

    def test_b1_trivial_task_loads_no_domains(self):
        report = run_benchmark()
        b1 = report["scenarios"][0]
        self.assertEqual(b1["domains_required"], [])
        self.assertEqual(b1["routed"]["domains_loaded"], 0)
        self.assertEqual(b1["routed"]["files_loaded"], b1["routed"]["bootstrap_files"])
        self.assertGreater(b1["context_size_reduction_percent"], 0)


if __name__ == "__main__":
    unittest.main()
