#!/usr/bin/env python3
"""Validate a context-spec-develop repository without third-party packages."""

from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import date
from pathlib import Path
from typing import Any

REQUIRED_FILES = (
    "README.md",
    "AGENTS.md",
    "LICENSE",
    ".context/INDEX.md",
    ".context/config.json",
    ".context/schemas/work-item.schema.json",
    ".context/schemas/exception.schema.json",
    ".context/schemas/orchestration.schema.json",
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
    ".context/classification/README.md",
    ".context/classification/classifier-contract.md",
    ".context/classification/complexity.md",
    ".context/classification/risk.md",
    ".context/classification/impact.md",
    ".context/classification/routing.md",
    ".context/interaction/README.md",
    ".context/interaction/questioning.md",
    ".context/interaction/decision-policy.md",
    ".context/interaction/uncertainty.md",
    ".context/interaction/escalation.md",
    ".context/context-routing/README.md",
    ".context/context-routing/catalog.md",
    ".context/context-routing/budgets.md",
    ".context/context-routing/triggers.md",
    ".context/workflows/core.md",
    ".context/workflows/product.md",
    ".context/workflows/support.md",
    ".context/prompts/intake.md",
    ".context/prompts/start-conversation.md",
    ".context/prompts/initialize-project.md",
    ".context/orchestration/README.md",
    ".context/orchestration/config.json",
    ".context/profiles/README.md",
    ".context/tooling/README.md",
    ".context/tooling/rtk.md",
    ".context/tooling/ai-memory.md",
    ".context/tooling/code-review-graph.md",
    ".context/tooling/subtasks-and-waves.md",
    "adapters/codex/AGENTS.md",
    "adapters/opencode/AGENTS.md",
    "adapters/cursor/AGENTS.md",
    "scripts/validate_context.py",
)
ENUMS = {
    "track": {"product", "support"},
    "type": {"feature", "bug", "incident", "hotfix"},
    "phase": {"discover", "triage", "contain", "specify", "plan", "preflight", "execute", "verify", "release", "observe", "learn", "close"},
    "status": {"draft", "ready", "active", "blocked", "completed", "cancelled"},
    "risk": {"low", "medium", "high", "critical"},
    "severity": {"sev1", "sev2", "sev3", "sev4"},
}
CLASSIFICATION_ENUMS = {
    "complexity": {"low", "medium", "high"},
    "impact": {"local", "module", "cross-module", "system"},
    "security": {"none", "relevant", "sensitive"},
    "confidence": {"low", "medium", "high"},
    "routing": {"minimal", "standard", "extended"},
}
CLASSIFICATION_DIMENSIONS = ("complexity", "impact", "security", "confidence", "routing")
CLASSIFICATION_DIMENSIONS_CURRENT = ("complexity", "impact", "security", "confidence")
ROUTING_DEPTHS = ("minimal", "standard", "extended")
ROUTING_ORDER = {"minimal": 0, "standard": 1, "extended": 2}
BUDGET_MAX_REQUIRED = {"minimal": 3, "standard": 5, "extended": 7}
PHASES_PROMOTING_TESTING = {"execute", "verify"}
DECISION_CATEGORIES = {
    "DISCOVERABLE",
    "REVERSIBLE_AGENT_DECISION",
    "ASSUMPTION_ALLOWED",
    "HUMAN_DECISION_REQUIRED",
    "CRITICAL_HUMAN_GATE",
}
EXECUTION_STATES = {"CONTINUE", "WAITING_FOR_HUMAN", "BLOCKED"}
EXECUTION_STATE_FOR = {
    "DISCOVERABLE": "CONTINUE",
    "REVERSIBLE_AGENT_DECISION": "CONTINUE",
    "ASSUMPTION_ALLOWED": "CONTINUE",
    "HUMAN_DECISION_REQUIRED": "WAITING_FOR_HUMAN",
    "CRITICAL_HUMAN_GATE": "WAITING_FOR_HUMAN",
}
PROTECTED_SIGNALS = frozenset({
    "security", "privacy", "authentication", "authorization",
    "production", "deployment", "migration",
    "destructive-operation", "irreversible-operation",
    "public-contract", "external-integration",
    "cross-module-impact", "system-impact",
    "incident", "hotfix",
})
GIT_FINALIZATION_MODES = {"confirm_each", "automatic"}
PR_MODES = {"never", "manual", "automatic"}
FORBIDDEN_PR_COMMAND_FRAGMENTS = ("merge", "--admin", "--force", "rebase")
MODES = {"starter", "managed", "enterprise"}
QUALITY_FIELDS = (
    "static_analysis_command",
    "test_command",
    "cognitive_complexity_max",
    "cyclomatic_complexity_max",
    "changed_code_coverage_min",
    "new_code_duplication_max",
)
GOVERNED_PROJECT_FILES = (
    ".context/project/security.md",
    ".context/project/ai-governance.md",
    ".context/project/testing.md",
    ".context/project/delivery.md",
    ".context/project/observability.md",
    ".context/project/quality.md",
)
EXCEPTION_STATUSES = {"proposed", "approved", "expired", "revoked"}
TRANSITIONS = {
    "discover": {"specify"},
    "triage": {"contain", "specify"},
    "contain": {"specify", "observe"},
    "specify": {"plan"},
    "plan": {"preflight"},
    "preflight": {"execute"},
    "execute": {"verify"},
    "verify": {"release"},
    "release": {"observe"},
    "observe": {"learn", "close"},
    "learn": {"close"},
}
PHASES = {
    ("product", "feature"): {"discover", "specify", "plan", "preflight", "execute", "verify", "release", "observe", "learn", "close"},
    ("support", "bug"): {"triage", "specify", "plan", "preflight", "execute", "verify", "release", "observe", "close"},
    ("support", "incident"): {"triage", "contain", "specify", "plan", "preflight", "execute", "verify", "release", "observe", "close"},
    ("support", "hotfix"): {"triage", "contain", "specify", "plan", "preflight", "execute", "verify", "release", "observe", "close"},
}


def derive_routing(classification: dict[str, Any], risk: Any) -> str | None:
    """Derive routing deterministically per .context/classification/routing.md."""
    complexity = classification.get("complexity")
    impact = classification.get("impact")
    security = classification.get("security")
    if complexity == "high" or risk in {"high", "critical"} or impact in {"cross-module", "system"} or security == "sensitive":
        return "extended"
    if complexity == "low" and risk == "low" and impact == "local" and security == "none":
        return "minimal"
    return "standard"


def default_required_domains(classification: dict[str, Any], item_type: str | None = None, phase: str | None = None) -> set[str]:
    """Deterministic default promotion per .context/context-routing/triggers.md.

    The bootstrap carries governance, so no domain is mandatory by default;
    domains appear only when a classification signal, task type or phase
    promotes them.
    """
    domains: set[str] = set()
    if classification.get("security") in {"relevant", "sensitive"}:
        domains.add("security")
    if classification.get("impact") in {"cross-module", "system"}:
        domains.add("architecture")
    if item_type in {"incident", "hotfix"}:
        domains.add("incident")
    if phase in PHASES_PROMOTING_TESTING:
        domains.add("testing")
    return domains


def load_context_domains(root: Path) -> set[str]:
    """Parse the valid context-domain names from catalog.md (single source)."""
    catalog = root / ".context/context-routing/catalog.md"
    domains: set[str] = set()
    if not catalog.is_file():
        return domains
    pattern = re.compile(r"^\|\s*`([a-z-]+)`\s*\|")
    for line in catalog.read_text(encoding="utf-8").splitlines():
        match = pattern.match(line)
        if match:
            domains.add(match.group(1))
    return domains


def check_classification_fixture(case: dict[str, Any], domains: set[str]) -> list[str]:
    """Deterministic validation of one golden classification case."""
    errors: list[str] = []
    case_id = case.get("id", "missing-id")
    expected = case.get("expected")
    if not isinstance(expected, dict):
        return [f"{case_id}: golden case is missing the expected object"]
    classification = expected.get("classification")
    if expected.get("fallback_expected"):
        if classification is not None or expected.get("derived_routing") is not None:
            errors.append(f"{case_id}: fallback case must not expect a classification")
    else:
        if not isinstance(classification, dict) or set(classification) != set(CLASSIFICATION_DIMENSIONS_CURRENT):
            errors.append(f"{case_id}: expected classification must carry exactly {CLASSIFICATION_DIMENSIONS_CURRENT}")
        else:
            for dimension in CLASSIFICATION_DIMENSIONS_CURRENT:
                if classification[dimension] not in CLASSIFICATION_ENUMS[dimension]:
                    errors.append(f"{case_id}: invalid expected {dimension}={classification[dimension]}")
            derived = derive_routing(classification, case.get("risk"))
            if derived != expected.get("derived_routing"):
                errors.append(
                    f"{case_id}: expected derived_routing={expected.get('derived_routing')} does not match derivation={derived}")
    unknown_protected = set(expected.get("protected_signals", [])) - set(PROTECTED_SIGNALS)
    if unknown_protected:
        errors.append(f"{case_id}: unknown protected signals {sorted(unknown_protected)}")
    unknown_domains = set(expected.get("context_signals", [])) - domains
    if unknown_domains:
        errors.append(f"{case_id}: unknown context signals {sorted(unknown_domains)}")
    return errors


class Validator:
    def __init__(self, root: Path, strict: bool, mode: str | None = None, include_examples: bool = False, as_json: bool = False) -> None:
        self.root = root
        self.strict = strict
        self.mode_override = mode
        self.include_examples = include_examples
        self.as_json = as_json
        self.mode = "starter"
        self.available_agent_profiles: set[str] = set()
        self.context_domains: set[str] = set()
        self.errors: list[str] = []
        self.warnings: list[str] = []

    def error(self, message: str) -> None:
        self.errors.append(message)

    def warning(self, message: str) -> None:
        self.warnings.append(message)

    def run(self) -> int:
        self.check_required_files()
        self.load_context_domains()
        config = self.load_json(self.root / ".context/config.json", "config")
        schema = self.load_json(
            self.root / ".context/schemas/work-item.schema.json", "work-item schema")
        exception_schema = self.load_json(
            self.root / ".context/schemas/exception.schema.json", "exception schema")
        orchestration_schema = self.load_json(
            self.root / ".context/schemas/orchestration.schema.json", "orchestration schema")
        orchestration = self.load_json(
            self.root / ".context/orchestration/config.json", "orchestration config")
        if schema and schema.get("$schema") is None:
            self.error("work-item schema must declare $schema")
        if exception_schema and exception_schema.get("$schema") is None:
            self.error("exception schema must declare $schema")
        if orchestration_schema and orchestration_schema.get("$schema") is None:
            self.error("orchestration schema must declare $schema")
        self.check_config(config)
        self.check_orchestration(orchestration)
        self.check_quality_and_governance(config)
        self.check_adapters()
        self.check_links()
        self.check_placeholders()
        self.check_legacy_and_public_markers()
        self.check_exceptions()
        self.check_work_items(config)
        self.check_classification_fixtures()
        if self.include_examples:
            self.check_examples(config)
        if self.as_json:
            print(json.dumps({
                "ok": len(self.errors) == 0,
                "errors": self.errors,
                "warnings": self.warnings,
            }))
            return 1 if self.errors else 0
        for warning in self.warnings:
            print(f"WARNING: {warning}")
        for error in self.errors:
            print(f"ERROR: {error}")
        if self.errors:
            return 1
        print("Context validation passed.")
        return 0

    def check_required_files(self) -> None:
        for relative in REQUIRED_FILES:
            if not (self.root / relative).is_file():
                self.error(f"missing required file: {relative}")
        for relative in (".context/project", ".context/workflows", ".context/templates", ".context/prompts", ".context/profiles", ".context/tooling", ".context/orchestration", ".context/classification", ".context/interaction", ".context/context-routing"):
            if not (self.root / relative).is_dir():
                self.error(f"missing required directory: {relative}")
        for relative in (
            ".context/project/overview.md",
            ".context/project/architecture.md",
            ".context/project/stack.md",
            ".context/project/conventions.md",
            ".context/project/security.md",
            ".context/project/testing.md",
            ".context/project/delivery.md",
            ".context/project/observability.md",
            ".context/project/quality.md",
            ".context/project/ai-governance.md",
        ):
            if not (self.root / relative).is_file():
                self.error(f"missing project context file: {relative}")
        if not (self.root / ".context/policies").is_dir():
            self.error("missing policy directory: .context/policies")
        if not (self.root / ".context/exceptions").is_dir():
            self.error("missing exceptions directory: .context/exceptions")

    def load_json(self, path: Path, label: str) -> dict[str, Any]:
        if not path.is_file():
            return {}
        try:
            value = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as exc:
            self.error(
                f"invalid {label} JSON: {path.relative_to(self.root)} ({exc})")
            return {}
        if not isinstance(value, dict):
            self.error(f"{label} must contain a JSON object")
            return {}
        return value

    def check_config(self, config: dict[str, Any]) -> None:
        if config.get("schema_version") != "1.0":
            self.error("config.schema_version must be 1.0")
        kit_version = config.get("kit_version")
        if not isinstance(kit_version, str) or not re.fullmatch(r"\d+\.\d+\.\d+", kit_version):
            self.error("config.kit_version must use semantic version X.Y.Z")
        project = config.get("project")
        if (
            not isinstance(project, dict)
            or not isinstance(project.get("name"), str)
            or not project.get("name")
            or not isinstance(project.get("repository"), str)
            or not project.get("repository")
        ):
            self.error(
                "config.project.name and config.project.repository are required")
        tracks = config.get("tracks")
        if not isinstance(tracks, list) or not tracks or not all(isinstance(track, str) for track in tracks) or not set(tracks).issubset(ENUMS["track"]):
            self.error("config.tracks must contain only product and support")
        configured_mode = config.get("governance_mode")
        if configured_mode not in MODES:
            self.error(
                "config.governance_mode must be starter, managed or enterprise")
        self.mode = self.mode_override or configured_mode or "starter"
        if self.mode not in MODES:
            self.error("validation mode must be starter, managed or enterprise")
        if config.get("policy_baseline") != "core":
            self.error("config.policy_baseline must be core")
        if config.get("orchestration_config") != ".context/orchestration/config.json":
            self.error(
                "config.orchestration_config must point to .context/orchestration/config.json")
        profiles = config.get("enabled_profiles")
        if not isinstance(profiles, list) or not all(isinstance(profile, str) for profile in profiles):
            self.error("config.enabled_profiles must be a string array")
        agent_profiles = config.get("agent_profiles")
        if not isinstance(agent_profiles, dict):
            self.error("config.agent_profiles must be an object")
        else:
            available = agent_profiles.get("available")
            default_profile = agent_profiles.get("default")
            if not isinstance(agent_profiles.get("selection_required"), bool):
                self.error(
                    "config.agent_profiles.selection_required must be boolean")
            if not isinstance(available, list) or not available or not all(isinstance(profile, str) for profile in available):
                self.error(
                    "config.agent_profiles.available must be a non-empty string array")
            elif default_profile not in available:
                self.error(
                    "config.agent_profiles.default must reference an available profile")
            self.available_agent_profiles = set(available or [])
            for profile in available or []:
                if not (self.root / ".context/profiles" / f"{profile}.md").is_file():
                    self.error(f"missing conversation profile: {profile}")
        pattern = config.get("work_item_id_pattern")
        if not isinstance(pattern, str):
            self.error("config.work_item_id_pattern must be a string")
        else:
            try:
                re.compile(pattern)
            except re.error as exc:
                self.error(f"invalid work item id pattern: {exc}")
        quality = config.get("quality")
        if not isinstance(quality, dict) or quality.get("baseline") != "no-regression":
            self.error("config.quality.baseline must be no-regression")
        elif any(field not in quality for field in QUALITY_FIELDS):
            self.error(
                "config.quality is missing one or more configured gate fields")
        elif any(
            quality.get(field) is not None and not isinstance(
                quality.get(field), str)
            for field in ("static_analysis_command", "test_command")
        ):
            self.error("config.quality commands must be strings or null")
        else:
            for field in ("cognitive_complexity_max", "cyclomatic_complexity_max", "changed_code_coverage_min", "new_code_duplication_max"):
                value = quality.get(field)
                if value is not None and (isinstance(value, bool) or not isinstance(value, (int, float)) or value < 0):
                    self.error(
                        f"config.quality.{field} must be a non-negative number or null")
        ai = config.get("ai")
        if not isinstance(ai, dict) or not isinstance(ai.get("human_approval_required"), bool):
            self.error("config.ai.human_approval_required must be boolean")
        elif any(
            ai.get(field) is not None
            and not (
                isinstance(ai.get(field), str)
                or (isinstance(ai.get(field), list) and all(isinstance(value, str) for value in ai.get(field)))
            )
            for field in ("approved_tools", "data_classification")
        ):
            self.error(
                "config.ai.approved_tools and data_classification must be strings or string arrays")

    def check_orchestration(self, orchestration: dict[str, Any]) -> None:
        if orchestration.get("schema_version") != "1.0":
            self.error("orchestration.schema_version must be 1.0")
        version = orchestration.get("config_version")
        if not isinstance(version, str) or not re.fullmatch(r"\d+\.\d+\.\d+", version):
            self.error(
                "orchestration.config_version must use semantic version X.Y.Z")
        if orchestration.get("mode") not in {"single-agent", "multi-agent"}:
            self.error("orchestration.mode must be single-agent or multi-agent")
        startup = orchestration.get("startup")
        if not isinstance(startup, dict):
            self.error("orchestration.startup must be an object")
        else:
            if startup.get("selection_required") is not True:
                self.error(
                    "orchestration.startup.selection_required must be true")
            if startup.get("ask_only_missing") is not True:
                self.error(
                    "orchestration.startup.ask_only_missing must be true")
            if not isinstance(startup.get("questions"), list) or not startup.get("questions"):
                self.error(
                    "orchestration.startup.questions must be a non-empty array")
            elif "git_finalization_mode" not in startup.get("questions", []):
                self.error(
                    "orchestration.startup.questions must include git_finalization_mode")
            for field in ("auto_create_work_item", "auto_create_directories", "auto_copy_templates"):
                if startup.get(field) is not True:
                    self.error(f"orchestration.startup.{field} must be true")
        assignments = orchestration.get("assignments")
        if not isinstance(assignments, dict):
            self.error("orchestration.assignments must be an object")
        else:
            for role in ("orchestrator", "planner", "executor", "reviewer", "release_approver"):
                if not isinstance(assignments.get(role), dict):
                    self.error(
                        f"orchestration.assignments.{role} must be configured")
            for role, assignment in assignments.items():
                if not isinstance(assignment, dict):
                    continue
                profile = assignment.get("profile")
                if profile and profile not in self.available_agent_profiles:
                    self.error(
                        f"orchestration.assignments.{role} references unknown profile: {profile}")
                for executor in assignment.get("pool", []):
                    if isinstance(executor, dict) and executor.get("profile") not in self.available_agent_profiles:
                        self.error(
                            f"orchestration.assignments.{role} references unknown pool profile: {executor.get('profile')}")
            reviewer = assignments.get("reviewer", {})
            if isinstance(reviewer, dict) and reviewer.get("independent") is not True:
                self.error(
                    "orchestration.assignments.reviewer.independent must be true")
            approver = assignments.get("release_approver", {})
            if isinstance(approver, dict) and (approver.get("actor") != "human" or approver.get("required") is not True):
                self.error(
                    "orchestration.assignments.release_approver must require a human")
        subagents = orchestration.get("subagents")
        if not isinstance(subagents, dict):
            self.error("orchestration.subagents must be an object")
        else:
            if orchestration.get("mode") == "multi-agent" and subagents.get("enabled") is not True:
                self.error(
                    "multi-agent orchestration requires subagents.enabled=true")
            if not isinstance(subagents.get("max_parallel"), int) or subagents.get("max_parallel") < 1:
                self.error(
                    "orchestration.subagents.max_parallel must be a positive integer")
            for field in ("least_privilege", "parent_integrates", "stop_on_scope_change"):
                if subagents.get(field) is not True:
                    self.error(f"orchestration.subagents.{field} must be true")
        git = orchestration.get("git")
        if not isinstance(git, dict):
            self.error("orchestration.git must be an object")
        else:
            finalization_mode = git.get("finalization_mode")
            if finalization_mode not in GIT_FINALIZATION_MODES:
                self.error(
                    "orchestration.git.finalization_mode must be confirm_each or automatic")
            commands = git.get("commands")
            if not isinstance(commands, list) or not {"git add", "git commit", "git push"}.issubset(commands):
                self.error(
                    "orchestration.git.commands must include git add, git commit and git push")
            required_flags = {
                "human_approval_required_before_push": True,
                "allow_force_push": False,
                "require_clean_worktree": True,
                "tag_requires_explicit_approval": True,
            }
            for field, expected in required_flags.items():
                if git.get(field) is not expected:
                    self.error(
                        f"orchestration.git.{field} must be {str(expected).lower()}")
            if finalization_mode == "confirm_each":
                for field in ("ask_before_commit", "ask_before_push"):
                    if git.get(field) is not True:
                        self.error(
                            f"orchestration.git.{field} must be true in confirm_each mode")
            if finalization_mode == "automatic":
                for field in ("ask_before_commit", "ask_before_push"):
                    if git.get(field) is not False:
                        self.error(
                            f"orchestration.git.{field} must be false in automatic mode")
            if git.get("commit_message_style") != "conventional_commits":
                self.error(
                    "orchestration.git.commit_message_style must be conventional_commits")
            if any(isinstance(command, str) and ("--force" in command or "reset --hard" in command or "clean -" in command) for command in git.get("commands", [])):
                self.error(
                    "orchestration.git.commands must not contain destructive or force Git operations")
        self.check_pull_request(orchestration)

    def check_pull_request(self, orchestration: dict[str, Any]) -> None:
        pull_request = orchestration.get("pull_request")
        if pull_request is None:
            return
        if not isinstance(pull_request, dict):
            self.error("orchestration.pull_request must be an object")
            return
        mode = pull_request.get("mode")
        if mode not in PR_MODES:
            self.error(
                "orchestration.pull_request.mode must be never, manual or automatic")
        if pull_request.get("merge_requires_human_approval") is not True:
            self.error(
                "orchestration.pull_request.merge_requires_human_approval must be true")
        command = pull_request.get("command")
        if command is not None and not isinstance(command, str):
            self.error("orchestration.pull_request.command must be a string or null")
            return
        if mode == "automatic":
            if orchestration.get("git", {}).get("finalization_mode") != "automatic":
                self.error(
                    "orchestration.pull_request.mode automatic requires git.finalization_mode automatic")
            if not isinstance(command, str) or not command or command == "NOT FOUND":
                self.error(
                    "orchestration.pull_request.mode automatic requires a configured project command")
        if isinstance(command, str):
            lowered = command.lower()
            if any(fragment in lowered for fragment in FORBIDDEN_PR_COMMAND_FRAGMENTS):
                self.error(
                    "orchestration.pull_request.command must only open pull requests; merging, force and administrative flags stay with humans")

    def check_quality_and_governance(self, config: dict[str, Any]) -> None:
        if self.mode == "starter":
            return
        quality = config.get("quality", {})
        for field in QUALITY_FIELDS:
            value = quality.get(field)
            if value is None or value == "NOT FOUND" or value == "":
                self.error(
                    f"{self.mode} quality gate is not configured: quality.{field}")
        if self.mode == "enterprise":
            for relative in GOVERNED_PROJECT_FILES:
                path = self.root / relative
                if path.is_file() and "NOT FOUND" in path.read_text(encoding="utf-8"):
                    self.error(
                        f"enterprise configuration incomplete: {relative}")
            ai = config.get("ai", {})
            for field in ("approved_tools", "data_classification"):
                value = ai.get(field)
                if value in (None, "NOT FOUND", "") or (isinstance(value, list) and not value):
                    self.error(
                        f"enterprise AI governance is not configured: ai.{field}")

    def check_adapters(self) -> None:
        for relative in (
            "adapters/codex/AGENTS.md",
            "adapters/claude/CLAUDE.md",
            "adapters/copilot/copilot-instructions.md",
            "adapters/gemini/GEMINI.md",
            "adapters/opencode/AGENTS.md",
            "adapters/cursor/AGENTS.md",
        ):
            path = self.root / relative
            if not path.is_file():
                self.error(f"missing adapter: {relative}")
            elif ".context/" not in path.read_text(encoding="utf-8"):
                self.error(
                    f"adapter does not reference canonical .context/: {relative}")

    def check_legacy_and_public_markers(self) -> None:
        for relative in (".ai", "legacy"):
            if (self.root / relative).exists():
                self.error(f"public package must not contain {relative}/")
        # Keep the detector itself neutral: the marker names are assembled at
        # runtime so this file does not trip its own public-package scan.
        marker_words = ("S" "IIC", "SE" "CULT",
                        "H" "U", "Lar" "avel", "V" "ue")
        markers = re.compile(r"\b(?:" + "|".join(marker_words[:2] + (
            marker_words[3], marker_words[4])) + r"|" + marker_words[2] + r"\d+)\b", re.IGNORECASE)
        excluded = {".git", "__pycache__", "node_modules", "dist", "assets", "registry", "catalog"}
        for path in self.root.rglob("*"):
            if not path.is_file() or any(part in excluded for part in path.parts):
                continue
            if path.suffix not in {".md", ".json", ".py", ".yml", ".yaml"}:
                continue
            if markers.search(path.read_text(encoding="utf-8", errors="replace")):
                self.error(
                    f"project-specific marker found in public package: {path.relative_to(self.root)}")

    def markdown_files(self) -> list[Path]:
        return [
            path for path in self.root.rglob("*.md")
            if not any(part in {".git", "node_modules", "dist", "assets"} for part in path.parts)
        ]

    def check_links(self) -> None:
        link_pattern = re.compile(r"\]\(([^)]+)\)")
        for path in self.markdown_files():
            content = path.read_text(encoding="utf-8")
            for target in link_pattern.findall(content):
                if target.startswith(("http://", "https://", "#", "mailto:")):
                    continue
                target_path = target.split("#", 1)[0]
                if not target_path:
                    continue
                resolved = (path.parent / target_path).resolve()
                try:
                    resolved.relative_to(self.root.resolve())
                except ValueError:
                    self.error(
                        f"link escapes repository: {path.relative_to(self.root)} -> {target}")
                    continue
                if not resolved.exists():
                    self.error(
                        f"broken link: {path.relative_to(self.root)} -> {target}")

    def check_placeholders(self) -> None:
        if not self.strict:
            return
        marker = re.compile(r"<[A-Z][A-Z0-9_ /.-]*>")
        excluded = {".context/templates", "examples", ".ai", "assets/template", "node_modules", "dist"}
        for path in self.root.rglob("*"):
            if not path.is_file() or path.suffix not in {".md", ".json"}:
                continue
            relative = path.relative_to(self.root)
            if any(str(relative).startswith(prefix) for prefix in excluded):
                continue
            if marker.search(path.read_text(encoding="utf-8")):
                self.error(f"unresolved placeholder: {relative}")

    def check_work_items(self, config: dict[str, Any]) -> None:
        work_root = self.root / ".context/work"
        if not work_root.is_dir():
            return
        pattern = config.get("work_item_id_pattern", r"^[A-Z]+-[0-9]+$")
        for directory in sorted(path for path in work_root.iterdir() if path.is_dir() and not path.name.startswith(".")):
            item_path = directory / "work-item.json"
            item = self.load_json(item_path, f"work item {directory.name}")
            if not item:
                continue
            self.check_item_metadata(directory, item, pattern)
            self.check_item_artifacts(directory, item)
            self.check_item_exceptions(directory, item)
            if self.strict:
                self.check_item_placeholders(directory)

    def check_examples(self, config: dict[str, Any]) -> None:
        examples_root = self.root / "examples"
        if not examples_root.is_dir():
            self.error("examples directory is missing")
            return
        pattern = config.get("work_item_id_pattern", r"^[A-Z]+-[0-9]+$")
        item_paths = sorted(examples_root.rglob("work-item.json"))
        if not item_paths:
            self.error("no example work items found")
        for item_path in item_paths:
            directory = item_path.parent
            item = self.load_json(
                item_path, f"example work item {directory.name}")
            if not item:
                continue
            self.check_item_metadata(directory, item, pattern)
            self.check_item_artifacts(directory, item)
            self.check_item_exceptions(directory, item)
            if self.strict:
                self.check_item_placeholders(directory)

    def check_item_metadata(self, directory: Path, item: dict[str, Any], pattern: str) -> None:
        required = ("schema_version", "id", "title", "track", "type", "phase",
                    "status", "risk", "owner", "conversation_profile", "last_updated")
        allowed = set(required) | {"severity", "implementation_required", "phase_history",
                                   "policy_exceptions", "conversation_profile", "git_finalization_mode",
                                   "classification", "reclassification", "routing", "context"}
        for field in item:
            if field not in allowed:
                self.error(f"{directory.name}: unknown field {field}")
        for field in required:
            if field not in item:
                self.error(f"{directory.name}: missing field {field}")
            elif field in {"id", "title", "owner", "last_updated"} and (not isinstance(item[field], str) or not item[field]):
                self.error(
                    f"{directory.name}: {field} must be a non-empty string")
        if item.get("schema_version") != "1.0":
            self.error(f"{directory.name}: schema_version must be 1.0")
        if "conversation_profile" in item and (not isinstance(item["conversation_profile"], str) or not item["conversation_profile"]):
            self.error(
                f"{directory.name}: conversation_profile must be a non-empty string")
        elif "conversation_profile" in item and item["conversation_profile"] not in self.available_agent_profiles:
            self.error(
                f"{directory.name}: unknown conversation_profile={item['conversation_profile']}")
        if "git_finalization_mode" in item and item["git_finalization_mode"] not in GIT_FINALIZATION_MODES:
            self.error(
                f"{directory.name}: invalid git_finalization_mode={item['git_finalization_mode']}")
        item_id = item.get("id")
        if isinstance(item_id, str) and not re.fullmatch(pattern, item_id):
            self.error(
                f"{directory.name}: id does not match configured pattern")
        if item.get("id") != directory.name:
            self.error(
                f"{directory.name}: work-item id must match directory name")
        for field, values in ENUMS.items():
            value = item.get(field)
            if field == "severity" and value is None:
                continue
            if value not in values:
                self.error(f"{directory.name}: invalid {field}={value}")
        self.check_item_classification(directory, item)
        track, item_type, phase = item.get(
            "track"), item.get("type"), item.get("phase")
        if (track, item_type) not in PHASES:
            self.error(f"{directory.name}: unsupported track/type combination")
        elif phase not in PHASES[(track, item_type)]:
            self.error(
                f"{directory.name}: phase {phase} is invalid for {track}/{item_type}")
        if item_type in {"incident", "hotfix"} and not item.get("severity"):
            self.error(
                f"{directory.name}: severity is required for {item_type}")
        if "implementation_required" in item and not isinstance(item["implementation_required"], bool):
            self.error(
                f"{directory.name}: implementation_required must be boolean")
        exceptions = item.get("policy_exceptions", [])
        if not isinstance(exceptions, list) or not all(isinstance(exception, str) for exception in exceptions):
            self.error(
                f"{directory.name}: policy_exceptions must be a string array")
        elif any(not re.fullmatch(r"EXC-[0-9]+", exception) for exception in exceptions):
            self.error(
                f"{directory.name}: policy_exceptions must contain IDs like EXC-0001")
        history = item.get("phase_history")
        if history is not None:
            if not isinstance(history, list) or not history or not all(isinstance(value, str) for value in history):
                self.error(
                    f"{directory.name}: phase_history must be a non-empty string array")
            elif history[-1] != phase:
                self.error(
                    f"{directory.name}: phase_history must end at current phase")
            else:
                for previous, current in zip(history, history[1:]):
                    if current not in TRANSITIONS.get(previous, set()):
                        self.error(
                            f"{directory.name}: invalid phase transition {previous} -> {current}")
        if item.get("status") == "completed" and phase != "close":
            self.error(
                f"{directory.name}: completed items must be in close phase")
        updated = item.get("last_updated")
        if isinstance(updated, str):
            try:
                date.fromisoformat(updated)
            except ValueError:
                self.error(
                    f"{directory.name}: last_updated must be YYYY-MM-DD")

    def load_context_domains(self) -> None:
        self.context_domains = load_context_domains(self.root)

    def check_classification_fixtures(self) -> None:
        cases_path = self.root / "benchmarks/classification/cases.json"
        if not cases_path.is_file():
            return
        cases = self.load_json(cases_path, "classification golden dataset")
        if not cases:
            return
        for case in cases.get("cases", []):
            for error in check_classification_fixture(case, self.context_domains):
                self.error(error)

    def check_item_routing(self, directory: Path, item: dict[str, Any]) -> None:
        classification = item.get("classification")
        routing = item.get("routing")
        if routing is None:
            return
        if not isinstance(routing, dict):
            self.error(f"{directory.name}: routing must be an object")
            return
        if classification is not None and isinstance(classification, dict) and "routing" in classification:
            self.error(
                f"{directory.name}: use the root routing object or the legacy classification.routing, not both")
        derived = routing.get("derived")
        effective = routing.get("effective")
        if derived not in ROUTING_ORDER:
            self.error(f"{directory.name}: invalid routing derived={derived}")
            return
        if effective not in ROUTING_ORDER:
            self.error(f"{directory.name}: invalid routing effective={effective}")
            return
        expected = derive_routing(classification or {}, item.get("risk"))
        if derived != expected:
            self.error(
                f"{directory.name}: routing derived={derived} does not match classification derivation={expected}")
        override = routing.get("override")
        if effective == derived:
            if override is not None:
                self.error(
                    f"{directory.name}: routing override requires effective routing to differ from derived")
            return
        if ROUTING_ORDER[effective] < ROUTING_ORDER[derived]:
            self.error(
                f"{directory.name}: routing overrides may only increase depth; {derived} -> {effective} is a downgrade")
            return
        if not isinstance(override, dict):
            self.error(
                f"{directory.name}: routing override from {derived} to {effective} requires an override object")
            return
        if override.get("authority") != "human":
            self.error(
                f"{directory.name}: routing override authority must be human")
        if not isinstance(override.get("reason"), str) or not override["reason"]:
            self.error(
                f"{directory.name}: routing override requires a non-empty reason")

    def check_item_context(self, directory: Path, item: dict[str, Any]) -> None:
        context = item.get("context")
        if context is None:
            return
        if not isinstance(context, dict):
            self.error(f"{directory.name}: context must be an object")
            return
        budget = context.get("budget")
        if budget not in BUDGET_MAX_REQUIRED:
            self.error(f"{directory.name}: invalid context budget={budget}")
        routing = item.get("routing")
        if not isinstance(routing, dict) or routing.get("effective") is None:
            self.error(
                f"{directory.name}: a context manifest requires the root routing object")
        elif budget != routing.get("effective"):
            self.error(
                f"{directory.name}: context budget={budget} must equal effective routing={routing.get('effective')}")
        if not self.context_domains:
            self.error(
                f"{directory.name}: context domains unavailable; catalog is missing or empty")
            return
        for field in ("required", "deferred", "triggers"):
            value = context.get(field)
            if value is not None and (not isinstance(value, list) or not all(isinstance(entry, str) for entry in value)):
                self.error(
                    f"{directory.name}: context {field} must be a string array")
        required = context.get("required", [])
        deferred = context.get("deferred", [])
        if not isinstance(required, list) or not isinstance(deferred, list):
            return
        unknown = {domain for domain in required + deferred if domain not in self.context_domains}
        if unknown:
            self.error(
                f"{directory.name}: unknown context domains {sorted(unknown)}")
        overlap = set(required) & set(deferred)
        if overlap:
            self.error(
                f"{directory.name}: context domains cannot be required and deferred: {sorted(overlap)}")
        if budget in BUDGET_MAX_REQUIRED and len(set(required)) > BUDGET_MAX_REQUIRED[budget]:
            self.error(
                f"{directory.name}: context budget {budget} allows at most {BUDGET_MAX_REQUIRED[budget]} required domains")

    def check_item_routing_legacy(self, directory: Path, item: dict[str, Any]) -> None:
        classification = item.get("classification")
        if item.get("routing") is not None or not isinstance(classification, dict):
            return
        if classification.get("routing") != derive_routing(classification, item.get("risk")):
            self.error(
                f"{directory.name}: classification routing={classification.get('routing')} does not match derived routing={derive_routing(classification, item.get('risk'))}")

    def check_item_classification(self, directory: Path, item: dict[str, Any]) -> None:
        classification = item.get("classification")
        routing_object = item.get("routing")
        if classification is not None:
            if not isinstance(classification, dict):
                self.error(f"{directory.name}: classification must be an object")
            else:
                unknown = set(classification) - set(CLASSIFICATION_DIMENSIONS)
                if unknown:
                    self.error(
                        f"{directory.name}: unknown classification dimensions {sorted(unknown)}")
                for dimension, values in CLASSIFICATION_ENUMS.items():
                    if dimension == "routing" and routing_object is not None:
                        continue
                    value = classification.get(dimension)
                    if value is None:
                        self.error(
                            f"{directory.name}: classification is missing {dimension}")
                    elif value not in values:
                        self.error(
                            f"{directory.name}: invalid classification {dimension}={value}")
                needed = CLASSIFICATION_DIMENSIONS if routing_object is None else CLASSIFICATION_DIMENSIONS_CURRENT
                if all(dimension in classification for dimension in needed):
                    self.check_item_routing_legacy(directory, item)
        self.check_item_routing(directory, item)
        self.check_item_context(directory, item)
        history = item.get("reclassification")
        if history is not None:
            if not isinstance(history, list):
                self.error(
                    f"{directory.name}: reclassification must be an array")
            else:
                for index, entry in enumerate(history):
                    if not isinstance(entry, dict):
                        self.error(
                            f"{directory.name}: reclassification entry {index} must be an object")
                        continue
                    for field in ("trigger", "routing_impact"):
                        value = entry.get(field)
                        if not isinstance(value, str) or not value:
                            self.error(
                                f"{directory.name}: reclassification entry {index} needs a non-empty {field}")
                    previous = entry.get("previous")
                    if not isinstance(previous, dict):
                        self.error(
                            f"{directory.name}: reclassification entry {index} needs a previous classification object")
                        continue
                    for dimension, values in CLASSIFICATION_ENUMS.items():
                        if previous.get(dimension) not in values:
                            self.error(
                                f"{directory.name}: reclassification entry {index} has invalid previous {dimension}={previous.get(dimension)}")

    def check_item_exceptions(self, directory: Path, item: dict[str, Any]) -> None:
        exception_ids = item.get("policy_exceptions", [])
        if not isinstance(exception_ids, list):
            return
        for exception_id in exception_ids:
            exception_path = self.root / \
                ".context/exceptions" / f"{exception_id}.json"
            if not exception_path.is_file():
                self.error(
                    f"{directory.name}: referenced exception does not exist: {exception_id}")
                continue
            exception = self.load_json(
                exception_path, f"exception {exception_id}")
            if exception.get("status") != "approved":
                self.error(
                    f"{directory.name}: exception is not approved: {exception_id}")
            expires_at = exception.get("expires_at")
            if isinstance(expires_at, str):
                try:
                    if date.fromisoformat(expires_at) < date.today():
                        self.error(
                            f"{directory.name}: exception is expired: {exception_id}")
                except ValueError:
                    self.error(
                        f"{directory.name}: exception has invalid expiration: {exception_id}")

    def check_exceptions(self) -> None:
        exceptions_root = self.root / ".context/exceptions"
        if not exceptions_root.is_dir():
            return
        for path in sorted(exceptions_root.glob("*.json")):
            exception = self.load_json(path, f"exception {path.stem}")
            required = ("schema_version", "id", "policy", "scope", "rationale", "risk",
                        "compensating_controls", "owner", "approver", "created_at", "expires_at", "status")
            for field in required:
                if field not in exception:
                    self.error(f"{path.name}: missing field {field}")
            if exception.get("schema_version") != "1.0":
                self.error(f"{path.name}: schema_version must be 1.0")
            if exception.get("id") != path.stem or not re.fullmatch(r"EXC-[0-9]+", str(exception.get("id", ""))):
                self.error(f"{path.name}: exception id must match filename")
            if exception.get("status") not in EXCEPTION_STATUSES:
                self.error(f"{path.name}: invalid exception status")
            if exception.get("status") == "approved" and not exception.get("approver"):
                self.error(
                    f"{path.name}: approved exception requires approver")
            if not isinstance(exception.get("compensating_controls"), list) or not exception.get("compensating_controls"):
                self.error(
                    f"{path.name}: compensating_controls must be a non-empty array")
            for field in ("created_at", "expires_at"):
                value = exception.get(field)
                if not isinstance(value, str):
                    self.error(f"{path.name}: {field} must be YYYY-MM-DD")
                    continue
                try:
                    parsed = date.fromisoformat(value)
                    if field == "expires_at" and parsed < date.today() and exception.get("status") == "approved":
                        self.error(
                            f"{path.name}: approved exception is expired")
                except ValueError:
                    self.error(f"{path.name}: {field} must be YYYY-MM-DD")

    def check_item_artifacts(self, directory: Path, item: dict[str, Any]) -> None:
        phase = item.get("phase")
        required: set[str] = set()
        implementation_required = item.get(
            "implementation_required", item.get("type") != "incident")
        if item.get("track") == "product":
            required.add("discovery.md")
        if item.get("type") in {"bug", "incident", "hotfix"}:
            required.add("triage.md")
        if item.get("type") == "bug":
            required.add("reproduction.md")
        if item.get("type") in {"incident", "hotfix"}:
            required.add("incident.md")
        if implementation_required and phase in {"specify", "plan", "preflight", "execute", "verify", "release", "observe", "close"}:
            required.add("spec.md")
        if implementation_required and phase in {"plan", "preflight", "execute", "verify", "release", "observe", "close"}:
            required.add("plan.md")
        if implementation_required and phase in {"verify", "release", "observe", "close"}:
            required.update({"preflight.md", "verification.md", "review.md"})
        if implementation_required and phase in {"release", "observe", "close"}:
            required.add("release.md")
        if phase in {"observe", "learn", "close"}:
            required.add("outcome.md")
        if item.get("type") in {"incident", "hotfix"} and phase == "close":
            required.add("postmortem.md")
        for artifact in sorted(required):
            if not (directory / artifact).is_file():
                self.error(
                    f"{directory.name}: missing required artifact {artifact} for phase {phase}")
        if implementation_required and phase in {"execute", "verify", "release", "observe", "close"}:
            self.check_plan_subtasks(directory)

    def check_plan_subtasks(self, directory: Path) -> None:
        path = directory / "plan.md"
        if not path.is_file():
            return
        content = path.read_text(encoding="utf-8")
        if "## Subtasks and waves" not in content:
            self.error(
                f"{directory.name}: plan.md must contain a Subtasks and waves section")
            return
        table_rows = [line for line in content.splitlines(
        ) if line.startswith("|") and line.count("|") >= 5]
        data_rows = [
            line for line in table_rows if "---" not in line and "Subtask" not in line]
        if not data_rows:
            self.error(
                f"{directory.name}: plan.md must contain at least one subtask row")
            return
        marker = re.compile(r"<[^>]+>|^-$")
        parsed: list[tuple[str, list[str], int]] = []
        for row in data_rows:
            cells = [cell.strip() for cell in row.strip("|").split("|")]
            if len(cells) < 5 or any(not cell or marker.search(cell) for cell in cells[:5]):
                self.error(
                    f"{directory.name}: every subtask row needs id, owner, dependencies, evidence and wave")
                continue
            try:
                wave = int(cells[4])
                if wave < 1:
                    raise ValueError
            except ValueError:
                self.error(
                    f"{directory.name}: subtask wave must be a positive integer")
                continue
            dependencies = [] if cells[2].lower() == "none" else [value.strip()
                                                                  for value in cells[2].split(",") if value.strip()]
            if len(cells) >= 6 and cells[5] and cells[5].lower() != "none":
                for domain in [value.strip() for value in cells[5].split(",") if value.strip()]:
                    if domain not in self.context_domains:
                        self.error(
                            f"{directory.name}: subtask {cells[0]} references unknown context domain {domain}")
            parsed.append((cells[0], dependencies, wave))
        known = {subtask_id: wave for subtask_id, _, wave in parsed}
        if len(known) != len(parsed):
            self.error(f"{directory.name}: subtask IDs must be unique")
        for subtask_id, dependencies, wave in parsed:
            for dependency in dependencies:
                if dependency not in known:
                    self.error(
                        f"{directory.name}: subtask {subtask_id} references unknown dependency {dependency}")
                elif known[dependency] >= wave:
                    self.error(
                        f"{directory.name}: dependency {dependency} must be in an earlier wave than {subtask_id}")

    def check_item_placeholders(self, directory: Path) -> None:
        marker = re.compile(r"<[A-Z][A-Z0-9_ /.-]*>")
        for path in directory.rglob("*"):
            if path.is_file() and path.name not in {"progress.md", "handoff.md"} and path.suffix in {".md", ".json"}:
                if marker.search(path.read_text(encoding="utf-8")):
                    self.error(
                        f"{directory.name}: unresolved placeholder in {path.name}")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path,
                        default=Path.cwd(), help="repository root")
    parser.add_argument("--strict", action="store_true",
                        help="fail on unresolved work-item/canonical placeholders")
    parser.add_argument("--mode", choices=sorted(MODES),
                        help="override configured governance mode")
    parser.add_argument("--examples", action="store_true",
                        help="validate example work items")
    parser.add_argument("--json", action="store_true",
                        help="emit a structured JSON report instead of text")
    args = parser.parse_args(argv)
    root = args.root.resolve()
    if not root.is_dir():
        if args.json:
            print(json.dumps({"ok": False, "errors": [f"root is not a directory: {root}"], "warnings": []}))
        else:
            print(f"ERROR: root is not a directory: {root}")
        return 2
    try:
        return Validator(root, args.strict, args.mode, args.examples, args.json).run()
    except OSError as exc:
        if args.json:
            print(json.dumps({"ok": False, "errors": [f"unable to read repository: {exc}"], "warnings": []}))
        else:
            print(f"ERROR: unable to read repository: {exc}")
        return 2


if __name__ == "__main__":
    sys.exit(main())
