#!/usr/bin/env python3
"""Golden-dataset classification benchmark (offline-first).

Without adapter results (--results), validates the golden fixtures:
structure, dimension vocabularies, deterministic routing derivation,
protected-signal vocabulary and context-signal domain membership.

With adapter results (--results results.json), scores each supplied
classifier result against the golden expectation on independent quality,
safety, efficiency, operational and economic metrics. No composite score
is produced; under-routing is reported as the critical error direction.

Adapter results follow the standalone result shape in
.context/classification/classifier-contract.md. All runtime fields are
optional and nullable; this script never calls a model or provider.

Usage:
    python3 benchmarks/classification/classification_benchmark.py
    python3 benchmarks/classification/classification_benchmark.py \
        --results results.json [--json] [--output report.json]
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

from scripts.validate_context import (  # noqa: E402
    CLASSIFICATION_ENUMS,
    PROTECTED_SIGNALS,
    derive_routing,
    load_context_domains,
)

ROOT_PATH = Path(ROOT)
CASES_PATH = Path(__file__).resolve().parent / "cases.json"
CLASSIFICATION_DIMENSIONS = ("complexity", "impact", "security", "confidence")


def load_cases() -> dict:
    return json.loads(CASES_PATH.read_text(encoding="utf-8"))


def check_fixture(case: dict, domains: set[str]) -> list[str]:
    errors = []
    expected = case["expected"]
    classification = expected["classification"]
    if expected["fallback_expected"]:
        if classification is not None or expected["derived_routing"] is not None:
            errors.append(f"{case['id']}: fallback case must not expect a classification")
    else:
        if set(classification) != set(CLASSIFICATION_DIMENSIONS):
            errors.append(f"{case['id']}: expected classification must carry exactly {CLASSIFICATION_DIMENSIONS}")
        else:
            for dimension in CLASSIFICATION_DIMENSIONS:
                if classification[dimension] not in CLASSIFICATION_ENUMS[dimension]:
                    errors.append(f"{case['id']}: invalid expected {dimension}={classification[dimension]}")
            derived = derive_routing(classification, case.get("risk"))
            if derived != expected["derived_routing"]:
                errors.append(
                    f"{case['id']}: expected derived_routing={expected['derived_routing']} does not match derivation={derived}")
    unknown_protected = set(expected["protected_signals"]) - PROTECTED_SIGNALS
    if unknown_protected:
        errors.append(f"{case['id']}: unknown protected signals {sorted(unknown_protected)}")
    unknown_domains = set(expected["context_signals"]) - domains
    if unknown_domains:
        errors.append(f"{case['id']}: unknown context signals {sorted(unknown_domains)}")
    return errors


def valid_result_classification(result: dict) -> bool:
    classification = result.get("classification")
    if not isinstance(classification, dict) or set(classification) != set(CLASSIFICATION_DIMENSIONS):
        return False
    return all(classification[d] in CLASSIFICATION_ENUMS[d] for d in CLASSIFICATION_DIMENSIONS)


def score_result(case: dict, result: dict) -> dict:
    expected = case["expected"]
    metrics = {
        "case": case["id"],
        "classification_exact": None,
        "dimension_mismatches": [],
        "routing_match": None,
        "under_routing": False,
        "false_minimal": False,
        "missed_protected_signals": [],
        "fallback_expected": expected["fallback_expected"],
        "fallback_triggered": bool(result.get("fallback")),
        "fallback_rate_event": None,
        "malformed": False,
    }
    if result.get("routing") is not None:
        metrics["malformed"] = True
        metrics["fallback_rate_event"] = "malformed-classifier-output"
        return metrics

    if expected["fallback_expected"]:
        if metrics["fallback_triggered"]:
            metrics["fallback_rate_event"] = "expected-fallback"
        else:
            metrics["fallback_rate_event"] = "fallback-expected-but-not-triggered"
        return metrics

    if metrics["fallback_triggered"]:
        metrics["fallback_rate_event"] = "unexpected-fallback"
        return metrics

    if not valid_result_classification(result):
        metrics["malformed"] = True
        metrics["fallback_rate_event"] = "malformed-classifier-output"
        return metrics

    produced = result["classification"]
    expected_classification = expected["classification"]
    mismatches = [
        dimension for dimension in CLASSIFICATION_DIMENSIONS
        if produced[dimension] != expected_classification[dimension]
    ]
    metrics["classification_exact"] = not mismatches
    metrics["dimension_mismatches"] = mismatches

    derived = derive_routing(produced, case.get("risk"))
    expected_routing = expected["derived_routing"]
    metrics["routing_match"] = derived == expected_routing
    order = {"minimal": 0, "standard": 1, "extended": 2}
    if order[derived] < order[expected_routing]:
        metrics["under_routing"] = True
        metrics["false_minimal"] = derived == "minimal"
    applied = result.get("applied_routing")
    if applied is not None and applied in order and order[applied] < order[expected_routing]:
        metrics["under_routing"] = True
        metrics["false_minimal"] = applied == "minimal"

    detected = set(result.get("detected_protected_signals") or [])
    metrics["missed_protected_signals"] = sorted(set(expected["protected_signals"]) - detected)
    return metrics


def build_report(results: list[dict] | None) -> dict:
    scenarios_doc = load_cases()
    domains = load_context_domains(ROOT_PATH)
    fixture_errors = []
    for case in scenarios_doc["cases"]:
        fixture_errors.extend(check_fixture(case, domains))

    report = {
        "benchmark": "classification-quality",
        "generated_by": "benchmarks/classification/classification_benchmark.py",
        "repository_state": "context-spec-develop main; measured against the golden dataset at run time",
        "mode": "offline-fixture-validation" if results is None else "adapter-scoring",
        "fixture_validation": {
            "cases": len(scenarios_doc["cases"]),
            "errors": fixture_errors,
            "passed": not fixture_errors,
        },
        "scoring": None,
        "notes": [
            "Metrics are independent; no composite classifier score is produced.",
            "under_routing and false_minimal are the critical error direction.",
            "runtime token, latency and cost fields pass through only when a real run supplies them.",
        ],
    }

    if results is not None:
        by_case = {entry.get("case"): entry for entry in results}
        scored = []
        for case in scenarios_doc["cases"]:
            result = by_case.get(case["id"])
            if result is None:
                scored.append({"case": case["id"], "malformed": True, "fallback_rate_event": "missing-adapter-result"})
            else:
                scored.append(score_result(case, result))
        report["scoring"] = {
            "results_scored": len(scored),
            "classification_exact": sum(1 for item in scored if item.get("classification_exact")),
            "classification_mismatched": sum(1 for item in scored if item.get("dimension_mismatches")),
            "routing_match": sum(1 for item in scored if item.get("routing_match")),
            "routing_mismatch": sum(1 for item in scored if item.get("routing_match") is False),
            "under_routing_count": sum(1 for item in scored if item.get("under_routing")),
            "false_minimal_count": sum(1 for item in scored if item.get("false_minimal")),
            "missed_protected_signal_count": sum(len(item.get("missed_protected_signals", [])) for item in scored),
            "fallback_expected_count": sum(1 for item in scored if item.get("fallback_expected")),
            "fallback_triggered_count": sum(1 for item in scored if item.get("fallback_triggered")),
            "unexpected_fallback_count": sum(1 for item in scored if item.get("fallback_rate_event") == "unexpected-fallback"),
            "fallback_expected_but_not_triggered": sum(1 for item in scored if item.get("fallback_rate_event") == "fallback-expected-but-not-triggered"),
            "malformed_result_count": sum(1 for item in scored if item.get("malformed")),
            "per_case": scored,
        }
        efficiency = [
            {"case": item["case"], "context": by_case.get(item["case"], {}).get("context"), "runtime": by_case.get(item["case"], {}).get("runtime")}
            for item in scored
        ]
        report["efficiency_and_economics"] = efficiency
    return report


def human_summary(report: dict) -> str:
    lines = [
        "classification-quality benchmark",
        f"repository state: {report['repository_state']}",
        f"mode: {report['mode']}",
        f"fixtures: {report['fixture_validation']['cases']} cases, "
        f"{'passed' if report['fixture_validation']['passed'] else 'FAILED'}",
    ]
    for error in report["fixture_validation"]["errors"]:
        lines.append(f"  fixture error: {error}")
    if report["scoring"]:
        scoring = report["scoring"]
        lines += [
            f"classification exact: {scoring['classification_exact']}; mismatched: {scoring['classification_mismatched']}",
            f"routing match: {scoring['routing_match']}; mismatch: {scoring['routing_mismatch']}",
            f"under-routing: {scoring['under_routing_count']} (critical); false-minimal: {scoring['false_minimal_count']}",
            f"missed protected signals: {scoring['missed_protected_signal_count']}",
            f"fallback expected/triggered/unexpected: {scoring['fallback_expected_count']}/{scoring['fallback_triggered_count']}/{scoring['unexpected_fallback_count']}",
            f"malformed results: {scoring['malformed_result_count']}",
        ]
    lines.append("observational only; not a release gate; no composite score")
    return "\n".join(lines)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--results", type=Path, help="adapter results JSON to score against the golden dataset")
    parser.add_argument("--json", action="store_true", help="print machine-readable JSON")
    parser.add_argument("--output", type=Path, help="also write the JSON report to this path")
    args = parser.parse_args(argv)

    results = None
    if args.results:
        results = json.loads(args.results.read_text(encoding="utf-8"))
        if isinstance(results, dict):
            results = results.get("results", [])
    report = build_report(results)
    payload = json.dumps(report, indent=2)
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(payload + "\n", encoding="utf-8")
    if args.json:
        print(payload)
    else:
        print(human_summary(report))
    return 1 if report["fixture_validation"]["errors"] else 0


if __name__ == "__main__":
    sys.exit(main())
