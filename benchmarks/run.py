#!/usr/bin/env python3
"""Reproducible context-routing benchmark.

Compares a documented eager-context baseline against the routed
(bootstrap + manifest) context behavior of this repository, using
deterministic structural metrics: file counts and character counts.
No tokenizer, vendor or model is involved; runtime token fields stay
null unless a real model run supplies them.

Usage:
    python3 benchmarks/run.py            # human-readable summary
    python3 benchmarks/run.py --json     # machine-readable JSON
    python3 benchmarks/run.py --json --output benchmarks/results/latest.json
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCENARIOS_PATH = ROOT / "benchmarks" / "scenarios.json"
CATALOG_PATH = ROOT / ".context" / "context-routing" / "catalog.md"

BOOTSTRAP_FILES = (
    "AGENTS.md",
    ".context/INDEX.md",
    ".context/classification/README.md",
    ".context/interaction/README.md",
    ".context/context-routing/README.md",
    ".context/context-routing/catalog.md",
)

# Documented eager baseline: all generally applicable policy, workflow,
# project, prompt and orchestration context loaded before any work.
BASELINE_FILES = (
    "AGENTS.md",
    ".context/INDEX.md",
    ".context/config.json",
    ".context/orchestration/README.md",
    ".context/orchestration/config.json",
    ".context/policies/README.md",
    ".context/policies/core/engineering-principles.md",
    ".context/policies/core/code-quality.md",
    ".context/policies/core/testing.md",
    ".context/policies/core/security-privacy.md",
    ".context/policies/core/ai-governance.md",
    ".context/policies/core/decomposition.md",
    ".context/policies/core/questioning-and-evidence.md",
    ".context/policies/core/review-release.md",
    ".context/policies/exceptions.md",
    ".context/workflows/core.md",
    ".context/workflows/product.md",
    ".context/workflows/support.md",
    ".context/project/overview.md",
    ".context/project/architecture.md",
    ".context/project/stack.md",
    ".context/project/conventions.md",
    ".context/project/ai-governance.md",
    ".context/project/delivery.md",
    ".context/project/observability.md",
    ".context/project/quality.md",
    ".context/project/security.md",
    ".context/project/testing.md",
    ".context/prompts/intake.md",
    ".context/prompts/start-conversation.md",
    ".context/prompts/specify.md",
    ".context/prompts/plan.md",
    ".context/prompts/preflight.md",
    ".context/prompts/execute-and-test.md",
    ".context/prompts/verify.md",
    ".context/prompts/release.md",
    ".context/prompts/close.md",
)

ROW_PATTERN = re.compile(r"^\|\s*`([a-z-]+)`\s*\|(.+)\|\s*$")
SOURCE_PATTERN = re.compile(r"`([^`]+\.(?:md|json))`")


def load_domain_sources() -> dict[str, list[str]]:
    """Parse domain -> canonical source paths from catalog.md."""
    domains: dict[str, list[str]] = {}
    for line in CATALOG_PATH.read_text(encoding="utf-8").splitlines():
        match = ROW_PATTERN.match(line)
        if not match:
            continue
        domain, rest = match.group(1), match.group(2)
        columns = rest.split("|")
        if len(columns) < 2:
            continue
        sources = SOURCE_PATTERN.findall(columns[1])
        if sources:
            domains[domain] = sources
    return domains


def measure(files: list[str]) -> tuple[int, int]:
    """Return (existing_file_count, total_chars) for the given paths."""
    count = 0
    chars = 0
    for relative in files:
        path = ROOT / relative
        if path.is_file():
            count += 1
            chars += len(path.read_text(encoding="utf-8", errors="replace"))
    return count, chars


def reduction_percent(baseline: int, routed: int) -> float | None:
    if baseline <= 0:
        return None
    return round((baseline - routed) / baseline * 100, 1)


def run_benchmark() -> dict:
    scenarios_doc = json.loads(SCENARIOS_PATH.read_text(encoding="utf-8"))
    domains = load_domain_sources()
    baseline_files, baseline_chars = measure(list(BASELINE_FILES))

    results = []
    for scenario in scenarios_doc["scenarios"]:
        required = scenario["context"]["required"]
        unknown = [domain for domain in required if domain not in domains]
        if unknown:
            raise SystemExit(
                f"scenario {scenario['id']}: unknown context domains {unknown}")
        domain_files: list[str] = []
        for domain in required:
            for source in domains[domain]:
                if source not in domain_files:
                    domain_files.append(source)
        routed_files = list(BOOTSTRAP_FILES) + domain_files
        routed_file_count, routed_chars = measure(routed_files)
        bootstrap_files, bootstrap_chars = measure(list(BOOTSTRAP_FILES))
        results.append({
            "scenario": scenario["id"],
            "task": scenario["task"],
            "routing": scenario["routing"]["effective"],
            "domains_required": required,
            "baseline": {
                "files_loaded": baseline_files,
                "context_chars": baseline_chars,
            },
            "routed": {
                "bootstrap_files": bootstrap_files,
                "bootstrap_chars": bootstrap_chars,
                "domains_loaded": len(required),
                "domain_files_loaded": len(domain_files),
                "files_loaded": routed_file_count,
                "context_chars": routed_chars,
            },
            "context_size_reduction_percent": reduction_percent(baseline_chars, routed_chars),
            "file_reduction_percent": reduction_percent(baseline_files, routed_file_count),
            "questions_expected": scenario["questions_expected"],
            "reclassifications_expected": scenario["reclassifications_expected"],
            "runtime_tokens": None,
        })

    total_baseline = sum(item["baseline"]["context_chars"] for item in results)
    total_routed = sum(item["routed"]["context_chars"] for item in results)
    return {
        "benchmark": "context-routing",
        "generated_by": "benchmarks/run.py",
        "repository_state": "context-spec-develop main; measured against the working tree at run time",
        "methodology": scenarios_doc["methodology"],
        "baseline_file_set_size": len(BASELINE_FILES),
        "bootstrap_file_set_size": len(BOOTSTRAP_FILES),
        "scenarios": results,
        "totals": {
            "baseline_context_chars": total_baseline,
            "routed_context_chars": total_routed,
            "context_size_reduction_percent": reduction_percent(total_baseline, total_routed),
            "input_token_reduction_percent": None,
        },
        "notes": [
            "Percentages are context-size (characters) reductions, not token reductions.",
            "runtime_tokens and input_token_reduction_percent stay null unless a real model run supplies actual token counts.",
        ],
    }


def human_summary(report: dict) -> str:
    lines = [
        "context-routing benchmark",
        f"repository state: {report['repository_state']}",
        f"baseline file set: {report['baseline_file_set_size']} files; bootstrap: {report['bootstrap_file_set_size']} files",
        "",
    ]
    for item in report["scenarios"]:
        lines.append(
            f"{item['scenario']}: baseline {item['baseline']['files_loaded']} files / "
            f"{item['baseline']['context_chars']} chars -> routed {item['routed']['files_loaded']} files / "
            f"{item['routed']['context_chars']} chars "
            f"(domains: {', '.join(item['domains_required']) or 'none'}; "
            f"context-size reduction {item['context_size_reduction_percent']}%)"
        )
    totals = report["totals"]
    lines += [
        "",
        f"totals: {totals['baseline_context_chars']} -> {totals['routed_context_chars']} chars "
        f"({totals['context_size_reduction_percent']}% context-size reduction)",
        "input_token_reduction_percent: null (no real token counts supplied)",
        "observational only; not a release gate",
    ]
    return "\n".join(lines)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--json", action="store_true", help="print machine-readable JSON")
    parser.add_argument("--output", type=Path, help="also write the JSON report to this path")
    args = parser.parse_args(argv)
    report = run_benchmark()
    payload = json.dumps(report, indent=2)
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(payload + "\n", encoding="utf-8")
    if args.json:
        print(payload)
    else:
        print(human_summary(report))
    return 0


if __name__ == "__main__":
    sys.exit(main())
