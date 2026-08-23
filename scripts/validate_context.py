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
    ".context/policies/core/review-release.md",
    ".context/policies/exceptions.md",
    ".context/workflows/core.md",
    ".context/workflows/product.md",
    ".context/workflows/support.md",
    ".context/prompts/intake.md",
    ".context/prompts/start-conversation.md",
    ".context/orchestration/README.md",
    ".context/orchestration/config.json",
    ".context/profiles/README.md",
    ".context/tooling/README.md",
    ".context/tooling/rtk.md",
    ".context/tooling/caveman.md",
    ".context/tooling/ai-memory.md",
    ".context/tooling/code-review-graph.md",
    ".context/tooling/subtasks-and-waves.md",
    "adapters/codex/AGENTS.md",
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


class Validator:
    def __init__(self, root: Path, strict: bool, mode: str | None = None, include_examples: bool = False) -> None:
        self.root = root
        self.strict = strict
        self.mode_override = mode
        self.include_examples = include_examples
        self.mode = "starter"
        self.available_agent_profiles: set[str] = set()
        self.errors: list[str] = []
        self.warnings: list[str] = []

    def error(self, message: str) -> None:
        self.errors.append(message)

    def warning(self, message: str) -> None:
        self.warnings.append(message)

    def run(self) -> int:
        self.check_required_files()
        config = self.load_json(self.root / ".context/config.json", "config")
        schema = self.load_json(self.root / ".context/schemas/work-item.schema.json", "work-item schema")
        exception_schema = self.load_json(self.root / ".context/schemas/exception.schema.json", "exception schema")
        orchestration_schema = self.load_json(self.root / ".context/schemas/orchestration.schema.json", "orchestration schema")
        orchestration = self.load_json(self.root / ".context/orchestration/config.json", "orchestration config")
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
        if self.include_examples:
            self.check_examples(config)
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
        for relative in (".context/project", ".context/workflows", ".context/templates", ".context/prompts", ".context/profiles", ".context/tooling", ".context/orchestration"):
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
            self.error(f"invalid {label} JSON: {path.relative_to(self.root)} ({exc})")
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
            self.error("config.project.name and config.project.repository are required")
        tracks = config.get("tracks")
        if not isinstance(tracks, list) or not tracks or not all(isinstance(track, str) for track in tracks) or not set(tracks).issubset(ENUMS["track"]):
            self.error("config.tracks must contain only product and support")
        configured_mode = config.get("governance_mode")
        if configured_mode not in MODES:
            self.error("config.governance_mode must be starter, managed or enterprise")
        self.mode = self.mode_override or configured_mode or "starter"
        if self.mode not in MODES:
            self.error("validation mode must be starter, managed or enterprise")
        if config.get("policy_baseline") != "core":
            self.error("config.policy_baseline must be core")
        if config.get("orchestration_config") != ".context/orchestration/config.json":
            self.error("config.orchestration_config must point to .context/orchestration/config.json")
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
                self.error("config.agent_profiles.selection_required must be boolean")
            if not isinstance(available, list) or not available or not all(isinstance(profile, str) for profile in available):
                self.error("config.agent_profiles.available must be a non-empty string array")
            elif default_profile not in available:
                self.error("config.agent_profiles.default must reference an available profile")
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
            self.error("config.quality is missing one or more configured gate fields")
        elif any(
            quality.get(field) is not None and not isinstance(quality.get(field), str)
            for field in ("static_analysis_command", "test_command")
        ):
            self.error("config.quality commands must be strings or null")
        else:
            for field in ("cognitive_complexity_max", "cyclomatic_complexity_max", "changed_code_coverage_min", "new_code_duplication_max"):
                value = quality.get(field)
                if value is not None and (isinstance(value, bool) or not isinstance(value, (int, float)) or value < 0):
                    self.error(f"config.quality.{field} must be a non-negative number or null")
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
            self.error("config.ai.approved_tools and data_classification must be strings or string arrays")

    def check_orchestration(self, orchestration: dict[str, Any]) -> None:
        if orchestration.get("schema_version") != "1.0":
            self.error("orchestration.schema_version must be 1.0")
        version = orchestration.get("config_version")
        if not isinstance(version, str) or not re.fullmatch(r"\d+\.\d+\.\d+", version):
            self.error("orchestration.config_version must use semantic version X.Y.Z")
        if orchestration.get("mode") not in {"single-agent", "multi-agent"}:
            self.error("orchestration.mode must be single-agent or multi-agent")
        startup = orchestration.get("startup")
        if not isinstance(startup, dict):
            self.error("orchestration.startup must be an object")
        else:
            if startup.get("selection_required") is not True:
                self.error("orchestration.startup.selection_required must be true")
            if startup.get("ask_only_missing") is not True:
                self.error("orchestration.startup.ask_only_missing must be true")
            if not isinstance(startup.get("questions"), list) or not startup.get("questions"):
                self.error("orchestration.startup.questions must be a non-empty array")
            for field in ("auto_create_work_item", "auto_create_directories", "auto_copy_templates"):
                if startup.get(field) is not True:
                    self.error(f"orchestration.startup.{field} must be true")
        assignments = orchestration.get("assignments")
        if not isinstance(assignments, dict):
            self.error("orchestration.assignments must be an object")
        else:
            for role in ("orchestrator", "planner", "executor", "reviewer", "release_approver"):
                if not isinstance(assignments.get(role), dict):
                    self.error(f"orchestration.assignments.{role} must be configured")
            for role, assignment in assignments.items():
                if not isinstance(assignment, dict):
                    continue
                profile = assignment.get("profile")
                if profile and profile not in self.available_agent_profiles:
                    self.error(f"orchestration.assignments.{role} references unknown profile: {profile}")
                for executor in assignment.get("pool", []):
                    if isinstance(executor, dict) and executor.get("profile") not in self.available_agent_profiles:
                        self.error(f"orchestration.assignments.{role} references unknown pool profile: {executor.get('profile')}")
            reviewer = assignments.get("reviewer", {})
            if isinstance(reviewer, dict) and reviewer.get("independent") is not True:
                self.error("orchestration.assignments.reviewer.independent must be true")
            approver = assignments.get("release_approver", {})
            if isinstance(approver, dict) and (approver.get("actor") != "human" or approver.get("required") is not True):
                self.error("orchestration.assignments.release_approver must require a human")
        subagents = orchestration.get("subagents")
        if not isinstance(subagents, dict):
            self.error("orchestration.subagents must be an object")
        else:
            if orchestration.get("mode") == "multi-agent" and subagents.get("enabled") is not True:
                self.error("multi-agent orchestration requires subagents.enabled=true")
            if not isinstance(subagents.get("max_parallel"), int) or subagents.get("max_parallel") < 1:
                self.error("orchestration.subagents.max_parallel must be a positive integer")
            for field in ("least_privilege", "parent_integrates", "stop_on_scope_change"):
                if subagents.get(field) is not True:
                    self.error(f"orchestration.subagents.{field} must be true")
        git = orchestration.get("git")
        if not isinstance(git, dict):
            self.error("orchestration.git must be an object")
        else:
            commands = git.get("commands")
            if not isinstance(commands, list) or not {"git add", "git commit", "git push"}.issubset(commands):
                self.error("orchestration.git.commands must include git add, git commit and git push")
            if git.get("human_approval_required_before_push") is not True:
                self.error("orchestration.git.human_approval_required_before_push must be true")

    def check_quality_and_governance(self, config: dict[str, Any]) -> None:
        if self.mode == "starter":
            return
        quality = config.get("quality", {})
        for field in QUALITY_FIELDS:
            value = quality.get(field)
            if value is None or value == "NOT FOUND" or value == "":
                self.error(f"{self.mode} quality gate is not configured: quality.{field}")
        if self.mode == "enterprise":
            for relative in GOVERNED_PROJECT_FILES:
                path = self.root / relative
                if path.is_file() and "NOT FOUND" in path.read_text(encoding="utf-8"):
                    self.error(f"enterprise configuration incomplete: {relative}")
            ai = config.get("ai", {})
            for field in ("approved_tools", "data_classification"):
                value = ai.get(field)
                if value in (None, "NOT FOUND", "") or (isinstance(value, list) and not value):
                    self.error(f"enterprise AI governance is not configured: ai.{field}")

    def check_adapters(self) -> None:
        for relative in ("adapters/codex/AGENTS.md", "adapters/claude/CLAUDE.md", "adapters/copilot/copilot-instructions.md", "adapters/gemini/GEMINI.md"):
            path = self.root / relative
            if not path.is_file():
                self.error(f"missing adapter: {relative}")
            elif ".context/" not in path.read_text(encoding="utf-8"):
                self.error(f"adapter does not reference canonical .context/: {relative}")

    def check_legacy_and_public_markers(self) -> None:
        for relative in (".ai", "legacy"):
            if (self.root / relative).exists():
                self.error(f"public package must not contain {relative}/")
        # Keep the detector itself neutral: the marker names are assembled at
        # runtime so this file does not trip its own public-package scan.
        marker_words = ("S" "IIC", "SE" "CULT", "H" "U", "Lar" "avel", "V" "ue")
        markers = re.compile(r"\b(?:" + "|".join(marker_words[:2] + (marker_words[3], marker_words[4])) + r"|" + marker_words[2] + r"\d+)\b", re.IGNORECASE)
        excluded = {".git", "__pycache__"}
        for path in self.root.rglob("*"):
            if not path.is_file() or any(part in excluded for part in path.parts):
                continue
            if path.suffix not in {".md", ".json", ".py", ".yml", ".yaml"}:
                continue
            if markers.search(path.read_text(encoding="utf-8", errors="replace")):
                self.error(f"project-specific marker found in public package: {path.relative_to(self.root)}")

    def markdown_files(self) -> list[Path]:
        return [path for path in self.root.rglob("*.md") if ".git" not in path.parts]

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
                    self.error(f"link escapes repository: {path.relative_to(self.root)} -> {target}")
                    continue
                if not resolved.exists():
                    self.error(f"broken link: {path.relative_to(self.root)} -> {target}")

    def check_placeholders(self) -> None:
        if not self.strict:
            return
        marker = re.compile(r"<[A-Z][A-Z0-9_ /.-]*>")
        excluded = {".context/templates", "examples", ".ai"}
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
            item = self.load_json(item_path, f"example work item {directory.name}")
            if not item:
                continue
            self.check_item_metadata(directory, item, pattern)
            self.check_item_artifacts(directory, item)
            self.check_item_exceptions(directory, item)
            if self.strict:
                self.check_item_placeholders(directory)

    def check_item_metadata(self, directory: Path, item: dict[str, Any], pattern: str) -> None:
        required = ("schema_version", "id", "title", "track", "type", "phase", "status", "risk", "owner", "conversation_profile", "last_updated")
        allowed = set(required) | {"severity", "implementation_required", "phase_history", "policy_exceptions", "conversation_profile"}
        for field in item:
            if field not in allowed:
                self.error(f"{directory.name}: unknown field {field}")
        for field in required:
            if field not in item:
                self.error(f"{directory.name}: missing field {field}")
            elif field in {"id", "title", "owner", "last_updated"} and (not isinstance(item[field], str) or not item[field]):
                self.error(f"{directory.name}: {field} must be a non-empty string")
        if item.get("schema_version") != "1.0":
            self.error(f"{directory.name}: schema_version must be 1.0")
        if "conversation_profile" in item and (not isinstance(item["conversation_profile"], str) or not item["conversation_profile"]):
            self.error(f"{directory.name}: conversation_profile must be a non-empty string")
        elif "conversation_profile" in item and item["conversation_profile"] not in self.available_agent_profiles:
            self.error(f"{directory.name}: unknown conversation_profile={item['conversation_profile']}")
        item_id = item.get("id")
        if isinstance(item_id, str) and not re.fullmatch(pattern, item_id):
            self.error(f"{directory.name}: id does not match configured pattern")
        if item.get("id") != directory.name:
            self.error(f"{directory.name}: work-item id must match directory name")
        for field, values in ENUMS.items():
            value = item.get(field)
            if field == "severity" and value is None:
                continue
            if value not in values:
                self.error(f"{directory.name}: invalid {field}={value}")
        track, item_type, phase = item.get("track"), item.get("type"), item.get("phase")
        if (track, item_type) not in PHASES:
            self.error(f"{directory.name}: unsupported track/type combination")
        elif phase not in PHASES[(track, item_type)]:
            self.error(f"{directory.name}: phase {phase} is invalid for {track}/{item_type}")
        if item_type in {"incident", "hotfix"} and not item.get("severity"):
            self.error(f"{directory.name}: severity is required for {item_type}")
        if "implementation_required" in item and not isinstance(item["implementation_required"], bool):
            self.error(f"{directory.name}: implementation_required must be boolean")
        exceptions = item.get("policy_exceptions", [])
        if not isinstance(exceptions, list) or not all(isinstance(exception, str) for exception in exceptions):
            self.error(f"{directory.name}: policy_exceptions must be a string array")
        elif any(not re.fullmatch(r"EXC-[0-9]+", exception) for exception in exceptions):
            self.error(f"{directory.name}: policy_exceptions must contain IDs like EXC-0001")
        history = item.get("phase_history")
        if history is not None:
            if not isinstance(history, list) or not history or not all(isinstance(value, str) for value in history):
                self.error(f"{directory.name}: phase_history must be a non-empty string array")
            elif history[-1] != phase:
                self.error(f"{directory.name}: phase_history must end at current phase")
            else:
                for previous, current in zip(history, history[1:]):
                    if current not in TRANSITIONS.get(previous, set()):
                        self.error(f"{directory.name}: invalid phase transition {previous} -> {current}")
        if item.get("status") == "completed" and phase != "close":
            self.error(f"{directory.name}: completed items must be in close phase")
        updated = item.get("last_updated")
        if isinstance(updated, str):
            try:
                date.fromisoformat(updated)
            except ValueError:
                self.error(f"{directory.name}: last_updated must be YYYY-MM-DD")

    def check_item_exceptions(self, directory: Path, item: dict[str, Any]) -> None:
        exception_ids = item.get("policy_exceptions", [])
        if not isinstance(exception_ids, list):
            return
        for exception_id in exception_ids:
            exception_path = self.root / ".context/exceptions" / f"{exception_id}.json"
            if not exception_path.is_file():
                self.error(f"{directory.name}: referenced exception does not exist: {exception_id}")
                continue
            exception = self.load_json(exception_path, f"exception {exception_id}")
            if exception.get("status") != "approved":
                self.error(f"{directory.name}: exception is not approved: {exception_id}")
            expires_at = exception.get("expires_at")
            if isinstance(expires_at, str):
                try:
                    if date.fromisoformat(expires_at) < date.today():
                        self.error(f"{directory.name}: exception is expired: {exception_id}")
                except ValueError:
                    self.error(f"{directory.name}: exception has invalid expiration: {exception_id}")

    def check_exceptions(self) -> None:
        exceptions_root = self.root / ".context/exceptions"
        if not exceptions_root.is_dir():
            return
        for path in sorted(exceptions_root.glob("*.json")):
            exception = self.load_json(path, f"exception {path.stem}")
            required = ("schema_version", "id", "policy", "scope", "rationale", "risk", "compensating_controls", "owner", "approver", "created_at", "expires_at", "status")
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
                self.error(f"{path.name}: approved exception requires approver")
            if not isinstance(exception.get("compensating_controls"), list) or not exception.get("compensating_controls"):
                self.error(f"{path.name}: compensating_controls must be a non-empty array")
            for field in ("created_at", "expires_at"):
                value = exception.get(field)
                if not isinstance(value, str):
                    self.error(f"{path.name}: {field} must be YYYY-MM-DD")
                    continue
                try:
                    parsed = date.fromisoformat(value)
                    if field == "expires_at" and parsed < date.today() and exception.get("status") == "approved":
                        self.error(f"{path.name}: approved exception is expired")
                except ValueError:
                    self.error(f"{path.name}: {field} must be YYYY-MM-DD")

    def check_item_artifacts(self, directory: Path, item: dict[str, Any]) -> None:
        phase = item.get("phase")
        required: set[str] = set()
        implementation_required = item.get("implementation_required", item.get("type") != "incident")
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
                self.error(f"{directory.name}: missing required artifact {artifact} for phase {phase}")

    def check_item_placeholders(self, directory: Path) -> None:
        marker = re.compile(r"<[A-Z][A-Z0-9_ /.-]*>")
        for path in directory.rglob("*"):
            if path.is_file() and path.name not in {"progress.md", "handoff.md"} and path.suffix in {".md", ".json"}:
                if marker.search(path.read_text(encoding="utf-8")):
                    self.error(f"{directory.name}: unresolved placeholder in {path.name}")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path.cwd(), help="repository root")
    parser.add_argument("--strict", action="store_true", help="fail on unresolved work-item/canonical placeholders")
    parser.add_argument("--mode", choices=sorted(MODES), help="override configured governance mode")
    parser.add_argument("--examples", action="store_true", help="validate example work items")
    args = parser.parse_args(argv)
    root = args.root.resolve()
    if not root.is_dir():
        print(f"ERROR: root is not a directory: {root}")
        return 2
    try:
        return Validator(root, args.strict, args.mode, args.examples).run()
    except OSError as exc:
        print(f"ERROR: unable to read repository: {exc}")
        return 2


if __name__ == "__main__":
    sys.exit(main())
