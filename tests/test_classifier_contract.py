import json
import unittest
from pathlib import Path

from benchmarks.classification.classification_benchmark import (
    build_report,
    load_cases,
    score_result,
)
from scripts.validate_context import (
    PROTECTED_SIGNALS,
    Validator,
    derive_routing,
)

ROOT = Path(__file__).resolve().parents[1]
VENDOR_PATTERN = ("codex", "opencode", "gemini", "claude", "cursor", "copilot", "ollama", "qwen", "openai", "anthropic", "jev")


def case_by_id(case_id: str) -> dict:
    return next(case for case in load_cases()["cases"] if case["id"] == case_id)


class ClassifierContractTest(unittest.TestCase):
    def test_same_agent_path_remains_valid_without_configuration(self):
        self.assertTrue((ROOT / ".context/classification/classifier-contract.md").is_file())
        self.assertEqual(Validator(ROOT, strict=True).run(), 0)

    def test_canonical_classification_contracts_name_no_vendor(self):
        for path in (ROOT / ".context/classification").glob("*.md"):
            text = path.read_text(encoding="utf-8").lower()
            for vendor in VENDOR_PATTERN:
                self.assertNotIn(vendor, text, f"{path.name} mentions {vendor}")

    def test_valid_classifier_result_scores_exact(self):
        case = case_by_id("security-sensitive-change")
        result = {
            "case": case["id"],
            "classification": case["expected"]["classification"],
            "detected_protected_signals": case["expected"]["protected_signals"],
            "applied_routing": "extended",
            "runtime": {"input_tokens": None, "output_tokens": None, "cached_input_tokens": None, "latency_ms": None, "cost": None},
        }
        scored = score_result(case, result)
        self.assertTrue(scored["classification_exact"])
        self.assertTrue(scored["routing_match"])
        self.assertFalse(scored["under_routing"])
        self.assertEqual(scored["missed_protected_signals"], [])
        self.assertFalse(scored["malformed"])

    def test_malformed_classifier_results_are_rejected(self):
        case = case_by_id("local-implementation")
        with_routing = dict(case_id=case["id"], routing="minimal", classification=case["expected"]["classification"])
        self.assertTrue(score_result(case, with_routing)["malformed"])

        missing_dimension = {"case": case["id"], "classification": {"complexity": "low", "impact": "local", "security": "none"}}
        self.assertTrue(score_result(case, missing_dimension)["malformed"])

        invalid_value = {"case": case["id"], "classification": {"complexity": "huge", "impact": "local", "security": "none", "confidence": "high"}}
        self.assertTrue(score_result(case, invalid_value)["malformed"])

    def test_low_confidence_fallback_metadata_is_recognized(self):
        case = case_by_id("ambiguous-task")
        result = {"case": case["id"], "fallback": {"reason": "low confidence: scope unclear"}}
        scored = score_result(case, result)
        self.assertTrue(scored["fallback_triggered"])
        self.assertEqual(scored["fallback_rate_event"], "expected-fallback")

    def test_protected_signal_fallback_and_missed_signals(self):
        case = case_by_id("security-sensitive-change")
        deferred = {"case": case["id"], "fallback": {"reason": "protected signal requires main-agent confirmation"}}
        self.assertEqual(score_result(case, deferred)["fallback_rate_event"], "unexpected-fallback")

        accepted_without_signals = {
            "case": case["id"],
            "classification": case["expected"]["classification"],
            "detected_protected_signals": [],
        }
        scored = score_result(case, accepted_without_signals)
        self.assertEqual(sorted(scored["missed_protected_signals"]), ["authorization", "security"])

    def test_routing_is_derived_deterministically_from_classifier_output(self):
        case = case_by_id("cross-module-feature")
        classification = case["expected"]["classification"]
        self.assertEqual(derive_routing(classification, case["risk"]), case["expected"]["derived_routing"])
        self.assertTrue(PROTECTED_SIGNALS >= {"cross-module-impact"})

    def test_external_classifier_cannot_override_derived_routing(self):
        case = case_by_id("local-implementation")
        under_routed = {
            "case": case["id"],
            "classification": case["expected"]["classification"],
            "applied_routing": "minimal",
        }
        scored = score_result(case, under_routed)
        self.assertTrue(scored["under_routing"])
        self.assertTrue(scored["false_minimal"])

        upward_observation = {
            "case": case["id"],
            "classification": case["expected"]["classification"],
            "applied_routing": "extended",
        }
        observed = score_result(case, upward_observation)
        self.assertFalse(observed["under_routing"])
        self.assertFalse(observed["false_minimal"])
        self.assertTrue(observed["routing_match"])
        self.assertFalse(observed["malformed"])

    def test_golden_fixtures_validate_offline(self):
        report = build_report(None)
        self.assertEqual(report["fixture_validation"]["cases"], 10)
        self.assertTrue(report["fixture_validation"]["passed"])
        self.assertIsNone(report["scoring"])

    def test_under_routing_false_minimal_and_mismatch_are_detected(self):
        case = case_by_id("local-implementation")
        result = {
            "case": case["id"],
            "classification": {"complexity": "low", "impact": "local", "security": "none", "confidence": "high"},
            "detected_protected_signals": [],
        }
        scored = score_result(case, result)
        self.assertFalse(scored["classification_exact"])
        self.assertEqual(scored["dimension_mismatches"], ["impact"])
        self.assertTrue(scored["routing_match"])

        under_applied = {
            "case": case["id"],
            "classification": case["expected"]["classification"],
            "applied_routing": "minimal",
        }
        scored = score_result(case, under_applied)
        self.assertTrue(scored["under_routing"])
        self.assertTrue(scored["false_minimal"])

        case = case_by_id("database-migration")
        result = {
            "case": case["id"],
            "classification": case["expected"]["classification"],
            "detected_protected_signals": [],
        }
        scored = score_result(case, result)
        self.assertTrue(scored["classification_exact"])
        self.assertTrue(scored["routing_match"])
        self.assertEqual(sorted(scored["missed_protected_signals"]), ["irreversible-operation", "migration"])

    def test_fallback_expected_but_not_triggered_is_detected(self):
        case = case_by_id("ambiguous-task")
        result = {
            "case": case["id"],
            "classification": {"complexity": "low", "impact": "local", "security": "none", "confidence": "high"},
        }
        scored = score_result(case, result)
        self.assertEqual(scored["fallback_rate_event"], "fallback-expected-but-not-triggered")

    def test_runtime_token_and_cost_fields_may_be_null(self):
        report = build_report([
            {"case": "documentation-trivial", "classification": {"complexity": "low", "impact": "local", "security": "none", "confidence": "high"}, "runtime": None},
            {"case": "local-implementation", "classification": {"complexity": "low", "impact": "module", "security": "none", "confidence": "high"}, "runtime": {"input_tokens": None, "cost": None}},
        ])
        self.assertIsNotNone(report["scoring"])
        self.assertEqual(report["scoring"]["results_scored"], 10)
        supplied = {item["case"] for item in report["scoring"]["per_case"] if item["case"] in {"documentation-trivial", "local-implementation"}}
        self.assertEqual(supplied, {"documentation-trivial", "local-implementation"})
        scored_supplied = [item for item in report["scoring"]["per_case"] if item["case"] == "documentation-trivial"][0]
        self.assertTrue(scored_supplied["classification_exact"])
        self.assertEqual(report["scoring"]["malformed_result_count"], 8)
        json.dumps(report)

    def test_fixture_checker_rejects_invalid_golden_case(self):
        from scripts.validate_context import check_classification_fixture

        bad_case = {
            "id": "bad",
            "risk": "low",
            "expected": {
                "classification": {"complexity": "low", "impact": "galaxy", "security": "none", "confidence": "high"},
                "derived_routing": "extended",
                "protected_signals": ["luck"],
                "context_signals": ["kubernetes"],
                "fallback_expected": False,
            },
        }
        errors = check_classification_fixture(bad_case, {"core"})
        self.assertTrue(any("invalid expected impact" in error for error in errors))
        self.assertTrue(any("does not match derivation" in error for error in errors))
        self.assertTrue(any("unknown protected signals" in error for error in errors))
        self.assertTrue(any("unknown context signals" in error for error in errors))


if __name__ == "__main__":
    unittest.main()
