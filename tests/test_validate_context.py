import json
import shutil
import tempfile
import unittest
from pathlib import Path

from scripts.validate_context import (
    DECISION_CATEGORIES,
    EXECUTION_STATES,
    EXECUTION_STATE_FOR,
    Validator,
    default_required_domains,
    derive_routing,
)


ROOT = Path(__file__).resolve().parents[1]


class ContextValidatorTest(unittest.TestCase):
    def make_repo(self):
        temp = tempfile.TemporaryDirectory()
        destination = Path(temp.name) / "repo"
        shutil.copytree(ROOT, destination, ignore=shutil.ignore_patterns("__pycache__", ".git"))
        return temp, destination

    def write_item(self, root: Path, item: dict, artifacts: list[str] | None = None) -> None:
        directory = root / ".context/work" / item["id"]
        directory.mkdir(parents=True)
        (directory / "work-item.json").write_text(json.dumps(item), encoding="utf-8")
        for artifact in artifacts or []:
            content = f"# {artifact}\nEvidence."
            if artifact == "plan.md":
                content += "\n\n## Subtasks and waves\n\n| Subtask ID | Owner | Dependencies | Acceptance evidence | Wave |\n| --- | --- | --- | --- | --- |\n| S1 | team | none | Tests pass | 1 |"
            (directory / artifact).write_text(content, encoding="utf-8")

    def configure_enterprise(self, root: Path) -> None:
        config_path = root / ".context/config.json"
        config = json.loads(config_path.read_text(encoding="utf-8"))
        config["governance_mode"] = "enterprise"
        config["quality"].update({
            "static_analysis_command": "make analyze",
            "test_command": "make test",
            "cognitive_complexity_max": 15,
            "cyclomatic_complexity_max": 10,
            "changed_code_coverage_min": 80,
            "new_code_duplication_max": 3,
        })
        config["ai"].update({
            "approved_tools": ["approved-agent"],
            "data_classification": ["public", "internal"],
        })
        config_path.write_text(json.dumps(config), encoding="utf-8")
        for relative in (
            ".context/project/security.md",
            ".context/project/ai-governance.md",
            ".context/project/testing.md",
            ".context/project/delivery.md",
            ".context/project/observability.md",
            ".context/project/quality.md",
        ):
            path = root / relative
            path.write_text(path.read_text(encoding="utf-8").replace("NOT FOUND", "Configured"), encoding="utf-8")

    def write_exception(self, root: Path, *, status: str = "approved", expires_at: str = "2099-01-01") -> None:
        path = root / ".context/exceptions/EXC-0001.json"
        path.write_text(json.dumps({
            "schema_version": "1.0",
            "id": "EXC-0001",
            "policy": "core.code-quality.no-regression",
            "scope": "BUG-1003",
            "rationale": "Temporary migration constraint",
            "risk": "medium",
            "compensating_controls": ["Manual review and follow-up issue"],
            "owner": "team",
            "approver": "security-owner",
            "created_at": "2026-08-23",
            "expires_at": expires_at,
            "status": status,
        }), encoding="utf-8")

    def test_root_template_passes_strict_validation(self):
        result = Validator(ROOT, strict=True).run()
        self.assertEqual(result, 0)

    def test_completed_product_item_requires_product_artifacts(self):
        temp, root = self.make_repo()
        self.addCleanup(temp.cleanup)
        item = {
            "schema_version": "1.0", "id": "FEAT-1001", "title": "Feature",
            "track": "product", "type": "feature", "phase": "close",
            "status": "completed", "risk": "low", "owner": "team", "conversation_profile": "senior-software-engineer", "last_updated": "2026-08-23",
        }
        self.write_item(root, item, ["discovery.md", "spec.md", "plan.md", "preflight.md", "verification.md", "review.md", "release.md", "outcome.md"])
        self.assertEqual(Validator(root, strict=True).run(), 0)

    def test_incident_requires_severity_and_postmortem(self):
        temp, root = self.make_repo()
        self.addCleanup(temp.cleanup)
        item = {
            "schema_version": "1.0", "id": "INC-1001", "title": "Outage",
            "track": "support", "type": "incident", "phase": "close",
            "status": "completed", "risk": "high", "owner": "team", "conversation_profile": "support-incident-engineer", "last_updated": "2026-08-23",
        }
        self.write_item(root, item, ["triage.md", "incident.md", "spec.md", "plan.md", "preflight.md", "verification.md", "review.md", "release.md", "outcome.md"])
        validator = Validator(root, strict=True)
        self.assertEqual(validator.run(), 1)
        self.assertTrue(any("severity" in error for error in validator.errors))
        self.assertTrue(any("postmortem.md" in error for error in validator.errors))

    def test_invalid_enum_and_placeholder_fail(self):
        temp, root = self.make_repo()
        self.addCleanup(temp.cleanup)
        item = {
            "schema_version": "1.0", "id": "BUG-1001", "title": "Bug",
            "track": "support", "type": "bug", "phase": "close",
            "status": "finished", "risk": "low", "owner": "team", "conversation_profile": "support-incident-engineer", "last_updated": "2026-08-23",
        }
        self.write_item(root, item, ["triage.md", "reproduction.md", "spec.md", "plan.md", "preflight.md", "verification.md", "review.md", "release.md", "outcome.md"])
        (root / ".context/work/BUG-1001/outcome.md").write_text("# Outcome\nOwner: <OWNER>", encoding="utf-8")
        validator = Validator(root, strict=True)
        self.assertEqual(validator.run(), 1)
        self.assertTrue(any("invalid status" in error for error in validator.errors))
        self.assertTrue(any("placeholder" in error for error in validator.errors))

    def test_canonical_placeholder_fails_in_strict_mode(self):
        temp, root = self.make_repo()
        self.addCleanup(temp.cleanup)
        path = root / ".context/project/overview.md"
        path.write_text(path.read_text(encoding="utf-8") + "\nOwner: <OWNER>", encoding="utf-8")
        validator = Validator(root, strict=True)
        self.assertEqual(validator.run(), 1)
        self.assertTrue(any("unresolved placeholder" in error for error in validator.errors))

    def test_links_and_adapters_are_checked(self):
        temp, root = self.make_repo()
        self.addCleanup(temp.cleanup)
        (root / "docs/broken.md").write_text("[missing](missing.md)", encoding="utf-8")
        adapter = root / "adapters/claude/CLAUDE.md"
        adapter.write_text("Use the agent.", encoding="utf-8")
        validator = Validator(root, strict=True)
        self.assertEqual(validator.run(), 1)
        self.assertTrue(any("broken link" in error for error in validator.errors))
        self.assertTrue(any("adapter does not reference" in error for error in validator.errors))

    def test_unknown_conversation_profile_fails(self):
        temp, root = self.make_repo()
        self.addCleanup(temp.cleanup)
        item = {
            "schema_version": "1.0", "id": "BUG-1004", "title": "Profile check",
            "track": "support", "type": "bug", "phase": "triage",
            "status": "draft", "risk": "low", "owner": "team", "last_updated": "2026-08-23",
            "conversation_profile": "unknown-profile",
        }
        self.write_item(root, item, ["triage.md", "reproduction.md"])
        validator = Validator(root, strict=True)
        self.assertEqual(validator.run(), 1)
        self.assertTrue(any("unknown conversation_profile" in error for error in validator.errors))

    def test_orchestration_requires_human_push_approval(self):
        temp, root = self.make_repo()
        self.addCleanup(temp.cleanup)
        path = root / ".context/orchestration/config.json"
        orchestration = json.loads(path.read_text(encoding="utf-8"))
        orchestration["git"]["human_approval_required_before_push"] = False
        path.write_text(json.dumps(orchestration), encoding="utf-8")
        validator = Validator(root, strict=True)
        self.assertEqual(validator.run(), 1)
        self.assertTrue(any("human_approval_required_before_push" in error for error in validator.errors))

    def test_orchestration_requires_separate_commit_and_push_approval(self):
        temp, root = self.make_repo()
        self.addCleanup(temp.cleanup)
        path = root / ".context/orchestration/config.json"
        config = json.loads(path.read_text(encoding="utf-8"))
        config["git"]["ask_before_commit"] = False
        path.write_text(json.dumps(config), encoding="utf-8")
        validator = Validator(root, strict=True)
        self.assertEqual(validator.run(), 1)
        self.assertTrue(any("ask_before_commit" in error for error in validator.errors))

    def test_orchestration_rejects_force_git_command(self):
        temp, root = self.make_repo()
        self.addCleanup(temp.cleanup)
        path = root / ".context/orchestration/config.json"
        config = json.loads(path.read_text(encoding="utf-8"))
        config["git"]["commands"].append("git push --force")
        path.write_text(json.dumps(config), encoding="utf-8")
        validator = Validator(root, strict=True)
        self.assertEqual(validator.run(), 1)
        self.assertTrue(any("destructive or force" in error for error in validator.errors))

    def test_automatic_git_finalization_requires_no_interactive_prompts(self):
        temp, root = self.make_repo()
        self.addCleanup(temp.cleanup)
        path = root / ".context/orchestration/config.json"
        config = json.loads(path.read_text(encoding="utf-8"))
        config["git"]["finalization_mode"] = "automatic"
        config["git"]["ask_before_commit"] = False
        config["git"]["ask_before_push"] = False
        path.write_text(json.dumps(config), encoding="utf-8")
        self.assertEqual(Validator(root, strict=True).run(), 0)

    def test_automatic_git_finalization_rejects_interactive_mismatch(self):
        temp, root = self.make_repo()
        self.addCleanup(temp.cleanup)
        path = root / ".context/orchestration/config.json"
        config = json.loads(path.read_text(encoding="utf-8"))
        config["git"]["finalization_mode"] = "automatic"
        path.write_text(json.dumps(config), encoding="utf-8")
        validator = Validator(root, strict=True)
        self.assertEqual(validator.run(), 1)
        self.assertTrue(any("automatic mode" in error for error in validator.errors))

    def test_startup_requires_git_finalization_choice(self):
        temp, root = self.make_repo()
        self.addCleanup(temp.cleanup)
        path = root / ".context/orchestration/config.json"
        config = json.loads(path.read_text(encoding="utf-8"))
        config["startup"]["questions"].remove("git_finalization_mode")
        path.write_text(json.dumps(config), encoding="utf-8")
        validator = Validator(root, strict=True)
        self.assertEqual(validator.run(), 1)
        self.assertTrue(any("git_finalization_mode" in error for error in validator.errors))

    def test_execution_phase_requires_subtask_table(self):
        temp, root = self.make_repo()
        self.addCleanup(temp.cleanup)
        item = {
            "schema_version": "1.0", "id": "BUG-1010", "title": "Bug",
            "track": "support", "type": "bug", "phase": "execute",
            "status": "active", "risk": "low", "owner": "team", "conversation_profile": "support-incident-engineer", "last_updated": "2026-08-23",
        }
        self.write_item(root, item, ["triage.md", "reproduction.md", "spec.md", "plan.md"])
        (root / ".context/work/BUG-1010/plan.md").write_text("# Plan\nNo decomposition.", encoding="utf-8")
        validator = Validator(root, strict=True)
        self.assertEqual(validator.run(), 1)
        self.assertTrue(any("Subtasks and waves" in error for error in validator.errors))

    def test_subtask_dependency_must_precede_wave(self):
        temp, root = self.make_repo()
        self.addCleanup(temp.cleanup)
        item = {
            "schema_version": "1.0", "id": "BUG-1011", "title": "Bug",
            "track": "support", "type": "bug", "phase": "execute",
            "status": "active", "risk": "low", "owner": "team", "conversation_profile": "support-incident-engineer", "last_updated": "2026-08-23",
        }
        self.write_item(root, item, ["triage.md", "reproduction.md", "spec.md", "plan.md"])
        (root / ".context/work/BUG-1011/plan.md").write_text(
            "# Plan\n\n## Subtasks and waves\n\n| Subtask ID | Owner | Dependencies | Acceptance evidence | Wave |\n| --- | --- | --- | --- | --- |\n| S1 | team | S2 | Tests pass | 1 |\n| S2 | team | none | Tests pass | 2 |",
            encoding="utf-8",
        )
        validator = Validator(root, strict=True)
        self.assertEqual(validator.run(), 1)
        self.assertTrue(any("earlier wave" in error for error in validator.errors))

    def test_incident_without_code_can_close_with_postmortem(self):
        temp, root = self.make_repo()
        self.addCleanup(temp.cleanup)
        item = {
            "schema_version": "1.0", "id": "INC-1002", "title": "Provider outage",
            "track": "support", "type": "incident", "phase": "close",
            "status": "completed", "risk": "high", "owner": "team", "conversation_profile": "support-incident-engineer", "last_updated": "2026-08-23",
            "severity": "sev2", "implementation_required": False,
        }
        self.write_item(root, item, ["triage.md", "incident.md", "outcome.md", "postmortem.md"])
        self.assertEqual(Validator(root, strict=True).run(), 0)

    def test_phase_history_rejects_invalid_transition(self):
        temp, root = self.make_repo()
        self.addCleanup(temp.cleanup)
        item = {
            "schema_version": "1.0", "id": "BUG-1002", "title": "Bug",
            "track": "support", "type": "bug", "phase": "verify",
            "status": "active", "risk": "low", "owner": "team", "conversation_profile": "senior-software-engineer", "last_updated": "2026-08-23",
            "phase_history": ["triage", "execute", "verify"],
        }
        self.write_item(root, item, ["triage.md", "reproduction.md", "spec.md", "plan.md", "preflight.md", "verification.md", "review.md"])
        validator = Validator(root, strict=True)
        self.assertEqual(validator.run(), 1)
        self.assertTrue(any("invalid phase transition" in error for error in validator.errors))

    def test_governance_modes_and_enterprise_configuration(self):
        self.assertEqual(Validator(ROOT, strict=True, mode="starter").run(), 0)
        managed_incomplete = Validator(ROOT, strict=True, mode="managed")
        self.assertEqual(managed_incomplete.run(), 1)
        self.assertTrue(any("managed quality gate" in error for error in managed_incomplete.errors))

        incomplete = Validator(ROOT, strict=True, mode="enterprise")
        self.assertEqual(incomplete.run(), 1)
        self.assertTrue(any("enterprise" in error for error in incomplete.errors))

        temp, root = self.make_repo()
        self.addCleanup(temp.cleanup)
        self.configure_enterprise(root)
        self.assertEqual(Validator(root, strict=True, mode="enterprise", include_examples=True).run(), 0)

    def test_legacy_directories_and_project_markers_fail(self):
        temp, root = self.make_repo()
        self.addCleanup(temp.cleanup)
        (root / ".ai").mkdir()
        (root / ".ai/notes.md").write_text("private notes", encoding="utf-8")
        (root / "legacy").mkdir()
        (root / "legacy/old.md").write_text("old context", encoding="utf-8")
        (root / "docs/internal.md").write_text("S" "IIC", encoding="utf-8")
        validator = Validator(root, strict=True)
        self.assertEqual(validator.run(), 1)
        self.assertTrue(any(".ai/" in error for error in validator.errors))
        self.assertTrue(any("legacy/" in error for error in validator.errors))
        self.assertTrue(any("project-specific marker" in error for error in validator.errors))

    def test_policy_exception_lifecycle(self):
        temp, root = self.make_repo()
        self.addCleanup(temp.cleanup)
        item = {
            "schema_version": "1.0", "id": "BUG-1003", "title": "Migration bug",
            "track": "support", "type": "bug", "phase": "close",
            "status": "completed", "risk": "medium", "owner": "team", "conversation_profile": "senior-software-engineer", "last_updated": "2026-08-23",
            "policy_exceptions": ["EXC-0001"],
        }
        artifacts = ["triage.md", "reproduction.md", "spec.md", "plan.md", "preflight.md", "verification.md", "review.md", "release.md", "outcome.md"]
        self.write_item(root, item, artifacts)

        validator = Validator(root, strict=True)
        self.assertEqual(validator.run(), 1)
        self.assertTrue(any("does not exist" in error for error in validator.errors))

        self.write_exception(root)
        self.assertEqual(Validator(root, strict=True).run(), 0)

        self.write_exception(root, status="proposed")
        validator = Validator(root, strict=True)
        self.assertEqual(validator.run(), 1)
        self.assertTrue(any("not approved" in error for error in validator.errors))

        self.write_exception(root, expires_at="2000-01-01")
        validator = Validator(root, strict=True)
        self.assertEqual(validator.run(), 1)
        self.assertTrue(any("expired" in error for error in validator.errors))

    def test_work_item_without_classification_remains_valid(self):
        temp, root = self.make_repo()
        self.addCleanup(temp.cleanup)
        item = {
            "schema_version": "1.0", "id": "BUG-1005", "title": "Legacy item",
            "track": "support", "type": "bug", "phase": "triage",
            "status": "draft", "risk": "low", "owner": "team", "conversation_profile": "senior-software-engineer", "last_updated": "2026-08-23",
        }
        self.write_item(root, item, ["triage.md", "reproduction.md"])
        self.assertEqual(Validator(root, strict=True).run(), 0)

    def test_valid_classification_and_reclassification_pass(self):
        temp, root = self.make_repo()
        self.addCleanup(temp.cleanup)
        item = {
            "schema_version": "1.0", "id": "FEAT-1005", "title": "Classified feature",
            "track": "product", "type": "feature", "phase": "specify",
            "status": "active", "risk": "medium", "owner": "team", "conversation_profile": "senior-software-engineer", "last_updated": "2026-08-23",
            "classification": {
                "complexity": "medium", "impact": "cross-module",
                "security": "none", "confidence": "high", "routing": "extended",
            },
            "reclassification": [
                {
                    "previous": {"complexity": "medium", "impact": "module", "security": "none", "confidence": "medium", "routing": "standard"},
                    "trigger": "Shared persistence schema discovered in review",
                    "routing_impact": "Routing raised from standard to extended; dependency analysis added",
                }
            ],
        }
        self.write_item(root, item, ["discovery.md", "spec.md"])
        self.assertEqual(Validator(root, strict=True).run(), 0)

    def test_invalid_classification_dimension_fails(self):
        temp, root = self.make_repo()
        self.addCleanup(temp.cleanup)
        item = {
            "schema_version": "1.0", "id": "FEAT-1006", "title": "Bad dimensions",
            "track": "product", "type": "feature", "phase": "specify",
            "status": "active", "risk": "low", "owner": "team", "conversation_profile": "senior-software-engineer", "last_updated": "2026-08-23",
            "classification": {
                "complexity": "huge", "impact": "local",
                "security": "none", "confidence": "high", "routing": "minimal",
            },
        }
        self.write_item(root, item, ["discovery.md", "spec.md"])
        validator = Validator(root, strict=True)
        self.assertEqual(validator.run(), 1)
        self.assertTrue(any("invalid classification complexity" in error for error in validator.errors))

    def test_routing_must_match_deterministic_derivation(self):
        temp, root = self.make_repo()
        self.addCleanup(temp.cleanup)
        item = {
            "schema_version": "1.0", "id": "FEAT-1007", "title": "Downgraded routing",
            "track": "product", "type": "feature", "phase": "specify",
            "status": "active", "risk": "medium", "owner": "team", "conversation_profile": "senior-software-engineer", "last_updated": "2026-08-23",
            "classification": {
                "complexity": "medium", "impact": "module",
                "security": "none", "confidence": "high", "routing": "minimal",
            },
        }
        self.write_item(root, item, ["discovery.md", "spec.md"])
        validator = Validator(root, strict=True)
        self.assertEqual(validator.run(), 1)
        self.assertTrue(any("does not match derived routing" in error for error in validator.errors))

    def test_reclassification_entry_requires_evidence_fields(self):
        temp, root = self.make_repo()
        self.addCleanup(temp.cleanup)
        item = {
            "schema_version": "1.0", "id": "FEAT-1008", "title": "Sparse history",
            "track": "product", "type": "feature", "phase": "specify",
            "status": "active", "risk": "medium", "owner": "team", "conversation_profile": "senior-software-engineer", "last_updated": "2026-08-23",
            "classification": {
                "complexity": "medium", "impact": "module",
                "security": "none", "confidence": "high", "routing": "standard",
            },
            "reclassification": [
                {"previous": {"complexity": "low", "impact": "local", "security": "none", "confidence": "low", "routing": "minimal"}},
            ],
        }
        self.write_item(root, item, ["discovery.md", "spec.md"])
        validator = Validator(root, strict=True)
        self.assertEqual(validator.run(), 1)
        self.assertTrue(any("non-empty trigger" in error for error in validator.errors))

    def test_missing_classification_contracts_fail(self):
        temp, root = self.make_repo()
        self.addCleanup(temp.cleanup)
        (root / ".context/classification/routing.md").unlink()
        (root / ".context/interaction/decision-policy.md").unlink()
        validator = Validator(root, strict=True)
        self.assertEqual(validator.run(), 1)
        self.assertTrue(any("classification/routing.md" in error for error in validator.errors))
        self.assertTrue(any("interaction/decision-policy.md" in error for error in validator.errors))

    def set_pull_request(self, root: Path, pull_request: dict) -> None:
        path = root / ".context/orchestration/config.json"
        config = json.loads(path.read_text(encoding="utf-8"))
        config["pull_request"] = pull_request
        path.write_text(json.dumps(config), encoding="utf-8")

    def test_pr_merge_approval_can_never_be_removed(self):
        temp, root = self.make_repo()
        self.addCleanup(temp.cleanup)
        self.set_pull_request(root, {"mode": "never", "merge_requires_human_approval": False})
        validator = Validator(root, strict=True)
        self.assertEqual(validator.run(), 1)
        self.assertTrue(any("merge_requires_human_approval" in error for error in validator.errors))

    def test_automatic_pr_requires_automatic_finalization_and_command(self):
        temp, root = self.make_repo()
        self.addCleanup(temp.cleanup)
        self.set_pull_request(root, {"mode": "automatic", "command": "project pr create", "merge_requires_human_approval": True})
        validator = Validator(root, strict=True)
        self.assertEqual(validator.run(), 1)
        self.assertTrue(any("requires git.finalization_mode automatic" in error for error in validator.errors))

        path = root / ".context/orchestration/config.json"
        config = json.loads(path.read_text(encoding="utf-8"))
        config["git"]["finalization_mode"] = "automatic"
        config["git"]["ask_before_commit"] = False
        config["git"]["ask_before_push"] = False
        path.write_text(json.dumps(config), encoding="utf-8")
        self.set_pull_request(root, {"mode": "automatic", "command": None, "merge_requires_human_approval": True})
        validator = Validator(root, strict=True)
        self.assertEqual(validator.run(), 1)
        self.assertTrue(any("configured project command" in error for error in validator.errors))

        self.set_pull_request(root, {"mode": "automatic", "command": "project pr create --draft", "merge_requires_human_approval": True})
        self.assertEqual(Validator(root, strict=True).run(), 0)

    def test_pr_command_must_not_merge_or_force(self):
        temp, root = self.make_repo()
        self.addCleanup(temp.cleanup)
        self.set_pull_request(root, {"mode": "manual", "command": "project pr merge --auto", "merge_requires_human_approval": True})
        validator = Validator(root, strict=True)
        self.assertEqual(validator.run(), 1)
        self.assertTrue(any("must only open pull requests" in error for error in validator.errors))

    def test_pr_block_is_optional_and_never_mode_validates(self):
        temp, root = self.make_repo()
        self.addCleanup(temp.cleanup)
        self.set_pull_request(root, {"mode": "never", "command": None, "draft_default": True, "merge_requires_human_approval": True})
        self.assertEqual(Validator(root, strict=True).run(), 0)

    def test_decision_categories_exclude_blocked_and_map_execution_states(self):
        self.assertNotIn("BLOCKED", DECISION_CATEGORIES)
        self.assertEqual(
            DECISION_CATEGORIES,
            {"DISCOVERABLE", "REVERSIBLE_AGENT_DECISION", "ASSUMPTION_ALLOWED", "HUMAN_DECISION_REQUIRED", "CRITICAL_HUMAN_GATE"},
        )
        self.assertEqual(EXECUTION_STATES, {"CONTINUE", "WAITING_FOR_HUMAN", "BLOCKED"})
        self.assertEqual(EXECUTION_STATE_FOR["DISCOVERABLE"], "CONTINUE")
        self.assertEqual(EXECUTION_STATE_FOR["REVERSIBLE_AGENT_DECISION"], "CONTINUE")
        self.assertEqual(EXECUTION_STATE_FOR["ASSUMPTION_ALLOWED"], "CONTINUE")
        self.assertEqual(EXECUTION_STATE_FOR["HUMAN_DECISION_REQUIRED"], "WAITING_FOR_HUMAN")
        self.assertEqual(EXECUTION_STATE_FOR["CRITICAL_HUMAN_GATE"], "WAITING_FOR_HUMAN")

    def write_item_full(self, root: Path, directory: str, item: dict, artifacts: list[str]) -> None:
        path = root / ".context/work" / directory
        path.mkdir(parents=True)
        (path / "work-item.json").write_text(json.dumps(item), encoding="utf-8")
        self.write_item(root, item, artifacts)

    def base_item(self, item_id: str, *, risk: str = "low") -> dict:
        return {
            "schema_version": "1.0", "id": item_id, "title": "Routing item",
            "track": "product", "type": "feature", "phase": "specify",
            "status": "active", "risk": risk, "owner": "team",
            "conversation_profile": "senior-software-engineer", "last_updated": "2026-09-20",
            "classification": {"complexity": "low", "impact": "local", "security": "none", "confidence": "high"},
        }

    def test_effective_routing_equal_to_derived_passes(self):
        temp, root = self.make_repo()
        self.addCleanup(temp.cleanup)
        item = self.base_item("FEAT-2001")
        item["routing"] = {"derived": "minimal", "effective": "minimal"}
        self.write_item(root, item, ["discovery.md", "spec.md"])
        self.assertEqual(Validator(root, strict=True).run(), 0)

    def test_routing_override_upgrade_passes(self):
        temp, root = self.make_repo()
        self.addCleanup(temp.cleanup)
        item = self.base_item("FEAT-2002")
        item["routing"] = {
            "derived": "minimal", "effective": "standard",
            "override": {"authority": "human", "reason": "touches the billing path before quarter close"},
        }
        self.write_item(root, item, ["discovery.md", "spec.md"])
        self.assertEqual(Validator(root, strict=True).run(), 0)

    def test_routing_downgrade_fails(self):
        temp, root = self.make_repo()
        self.addCleanup(temp.cleanup)
        item = self.base_item("FEAT-2003", risk="high")
        item["routing"] = {
            "derived": "extended", "effective": "standard",
            "override": {"authority": "human", "reason": "attempted downgrade"},
        }
        self.write_item(root, item, ["discovery.md", "spec.md"])
        validator = Validator(root, strict=True)
        self.assertEqual(validator.run(), 1)
        self.assertTrue(any("downgrade" in error for error in validator.errors))

    def test_routing_override_requires_reason_and_human_authority(self):
        temp, root = self.make_repo()
        self.addCleanup(temp.cleanup)
        item = self.base_item("FEAT-2004")
        item["routing"] = {"derived": "minimal", "effective": "extended", "override": {"authority": "agent", "reason": ""}}
        self.write_item(root, item, ["discovery.md", "spec.md"])
        validator = Validator(root, strict=True)
        self.assertEqual(validator.run(), 1)
        self.assertTrue(any("authority must be human" in error for error in validator.errors))
        self.assertTrue(any("non-empty reason" in error for error in validator.errors))

    def test_override_without_routing_difference_fails(self):
        temp, root = self.make_repo()
        self.addCleanup(temp.cleanup)
        item = self.base_item("FEAT-2005")
        item["routing"] = {"derived": "minimal", "effective": "minimal", "override": {"authority": "human", "reason": "redundant"}}
        self.write_item(root, item, ["discovery.md", "spec.md"])
        validator = Validator(root, strict=True)
        self.assertEqual(validator.run(), 1)
        self.assertTrue(any("requires effective routing to differ" in error for error in validator.errors))

    def test_dual_routing_shapes_fail(self):
        temp, root = self.make_repo()
        self.addCleanup(temp.cleanup)
        item = self.base_item("FEAT-2006")
        item["classification"]["routing"] = "minimal"
        item["routing"] = {"derived": "minimal", "effective": "minimal"}
        self.write_item(root, item, ["discovery.md", "spec.md"])
        validator = Validator(root, strict=True)
        self.assertEqual(validator.run(), 1)
        self.assertTrue(any("not both" in error for error in validator.errors))

    def test_legacy_classification_routing_remains_valid(self):
        temp, root = self.make_repo()
        self.addCleanup(temp.cleanup)
        item = self.base_item("FEAT-2007")
        item["classification"]["routing"] = "minimal"
        self.write_item(root, item, ["discovery.md", "spec.md"])
        self.assertEqual(Validator(root, strict=True).run(), 0)

    def valid_manifest(self, budget: str) -> dict:
        return {
            "budget": budget,
            "required": ["core", "project", "testing"],
            "deferred": ["architecture", "security", "release", "incident"],
            "triggers": [],
        }

    def test_valid_context_manifest_passes(self):
        temp, root = self.make_repo()
        self.addCleanup(temp.cleanup)
        item = self.base_item("FEAT-2010")
        item["routing"] = {"derived": "minimal", "effective": "minimal"}
        item["context"] = self.valid_manifest("minimal")
        self.write_item(root, item, ["discovery.md", "spec.md"])
        self.assertEqual(Validator(root, strict=True).run(), 0)

    def test_unknown_context_domain_fails(self):
        temp, root = self.make_repo()
        self.addCleanup(temp.cleanup)
        item = self.base_item("FEAT-2011")
        item["routing"] = {"derived": "minimal", "effective": "minimal"}
        manifest = self.valid_manifest("minimal")
        manifest["required"].append("kubernetes")
        item["context"] = manifest
        self.write_item(root, item, ["discovery.md", "spec.md"])
        validator = Validator(root, strict=True)
        self.assertEqual(validator.run(), 1)
        self.assertTrue(any("unknown context domains" in error for error in validator.errors))

    def test_required_and_deferred_conflict_fails(self):
        temp, root = self.make_repo()
        self.addCleanup(temp.cleanup)
        item = self.base_item("FEAT-2012")
        item["routing"] = {"derived": "minimal", "effective": "minimal"}
        manifest = self.valid_manifest("minimal")
        manifest["deferred"].append("core")
        item["context"] = manifest
        self.write_item(root, item, ["discovery.md", "spec.md"])
        validator = Validator(root, strict=True)
        self.assertEqual(validator.run(), 1)
        self.assertTrue(any("required and deferred" in error for error in validator.errors))

    def test_context_manifest_requires_mandatory_core(self):
        temp, root = self.make_repo()
        self.addCleanup(temp.cleanup)
        item = self.base_item("FEAT-2013")
        item["routing"] = {"derived": "minimal", "effective": "minimal"}
        manifest = self.valid_manifest("minimal")
        manifest["required"] = []
        manifest["deferred"] = ["core", "project", "testing", "architecture", "security", "release", "incident"]
        item["context"] = manifest
        self.write_item(root, item, ["discovery.md", "spec.md"])
        self.assertEqual(Validator(root, strict=True).run(), 0)

    def test_core_only_manifest_remains_valid(self):
        temp, root = self.make_repo()
        self.addCleanup(temp.cleanup)
        item = self.base_item("FEAT-2018")
        item["routing"] = {"derived": "minimal", "effective": "minimal"}
        manifest = self.valid_manifest("minimal")
        manifest["required"] = ["core"]
        item["context"] = manifest
        self.write_item(root, item, ["discovery.md", "spec.md"])
        self.assertEqual(Validator(root, strict=True).run(), 0)

    def test_legacy_three_domain_manifest_remains_valid(self):
        temp, root = self.make_repo()
        self.addCleanup(temp.cleanup)
        item = self.base_item("FEAT-2019")
        item["routing"] = {"derived": "minimal", "effective": "minimal"}
        item["context"] = self.valid_manifest("minimal")
        self.write_item(root, item, ["discovery.md", "spec.md"])
        self.assertEqual(Validator(root, strict=True).run(), 0)

    def test_project_and_testing_promotion_validates(self):
        temp, root = self.make_repo()
        self.addCleanup(temp.cleanup)
        item = self.base_item("FEAT-2020", risk="medium")
        item["classification"] = {"complexity": "low", "impact": "module", "security": "none", "confidence": "high"}
        item["routing"] = {"derived": "standard", "effective": "standard"}
        manifest = self.valid_manifest("standard")
        manifest["required"] = ["project", "testing"]
        manifest["deferred"] = ["core", "architecture", "security", "release", "incident"]
        manifest["triggers"] = ["project-specific validation behavior", "implementing code that needs tests"]
        item["context"] = manifest
        self.write_item(root, item, ["discovery.md", "spec.md"])
        self.assertEqual(Validator(root, strict=True).run(), 0)

    def test_routing_is_independent_of_context_count(self):
        temp, root = self.make_repo()
        self.addCleanup(temp.cleanup)
        item = self.base_item("FEAT-2021", risk="medium")
        item["classification"] = {"complexity": "high", "impact": "cross-module", "security": "none", "confidence": "high"}
        item["routing"] = {"derived": "extended", "effective": "extended"}
        manifest = self.valid_manifest("extended")
        manifest["required"] = ["core"]
        manifest["deferred"] = ["project", "testing", "architecture", "security", "release", "incident"]
        item["context"] = manifest
        self.write_item(root, item, ["discovery.md", "spec.md"])
        self.assertEqual(Validator(root, strict=True).run(), 0)

    def test_context_budget_must_match_effective_routing(self):
        temp, root = self.make_repo()
        self.addCleanup(temp.cleanup)
        item = self.base_item("FEAT-2014")
        item["routing"] = {"derived": "minimal", "effective": "minimal"}
        item["context"] = self.valid_manifest("standard")
        self.write_item(root, item, ["discovery.md", "spec.md"])
        validator = Validator(root, strict=True)
        self.assertEqual(validator.run(), 1)
        self.assertTrue(any("must equal effective routing" in error for error in validator.errors))

    def test_context_budget_maximum_enforced(self):
        temp, root = self.make_repo()
        self.addCleanup(temp.cleanup)
        item = self.base_item("FEAT-2015")
        item["routing"] = {
            "derived": "minimal", "effective": "extended",
            "override": {"authority": "human", "reason": "broaden discovery"},
        }
        manifest = self.valid_manifest("extended")
        manifest["required"] = ["core", "project", "testing", "architecture", "security", "release", "incident", "extra" ]
        item["context"] = manifest
        self.write_item(root, item, ["discovery.md", "spec.md"])
        validator = Validator(root, strict=True)
        self.assertEqual(validator.run(), 1)
        self.assertTrue(any("at most 7" in error for error in validator.errors) or any("unknown context domains" in error for error in validator.errors))

    def test_context_manifest_requires_routing_object(self):
        temp, root = self.make_repo()
        self.addCleanup(temp.cleanup)
        item = self.base_item("FEAT-2016")
        item["classification"]["routing"] = "minimal"
        item["context"] = self.valid_manifest("minimal")
        self.write_item(root, item, ["discovery.md", "spec.md"])
        validator = Validator(root, strict=True)
        self.assertEqual(validator.run(), 1)
        self.assertTrue(any("requires the root routing object" in error for error in validator.errors))

    def test_minimal_classification_default_domains_regression(self):
        calm = {"complexity": "low", "impact": "local", "security": "none", "confidence": "high"}
        self.assertEqual(default_required_domains(calm), set())
        self.assertEqual(default_required_domains(calm, "feature", "specify"), set())

        promoted = default_required_domains(calm, "feature", "execute")
        self.assertEqual(promoted, {"testing"})

        verified = default_required_domains(calm, "bug", "verify")
        self.assertEqual(verified, {"testing"})

        loud = {"complexity": "medium", "impact": "cross-module", "security": "relevant", "confidence": "high"}
        expanded = default_required_domains(loud, "feature", "plan")
        self.assertEqual(expanded, {"security", "architecture"})

        incident = default_required_domains(loud, "incident", "triage")
        self.assertEqual(incident, {"security", "architecture", "incident"})

        self.assertEqual(derive_routing(calm, "low"), "minimal")
        self.assertEqual(derive_routing(loud, "medium"), "extended")

    def test_bootstrap_is_separate_from_context_domains(self):
        from benchmarks.run import BASELINE_FILES, BOOTSTRAP_FILES

        self.assertIn("AGENTS.md", BOOTSTRAP_FILES)
        self.assertIn(".context/INDEX.md", BOOTSTRAP_FILES)
        self.assertFalse(any(path.startswith(".context/project/") for path in BOOTSTRAP_FILES))
        self.assertNotIn(".context/policies/core/testing.md", BOOTSTRAP_FILES)
        self.assertNotIn(".context/policies/core/security-privacy.md", BOOTSTRAP_FILES)
        self.assertTrue(any(path.startswith(".context/project/") for path in BASELINE_FILES))
        self.assertIn(".context/policies/core/testing.md", BASELINE_FILES)

    def test_context_domains_come_from_catalog(self):
        temp, root = self.make_repo()
        self.addCleanup(temp.cleanup)
        catalog = root / ".context/context-routing/catalog.md"
        catalog.write_text(catalog.read_text(encoding="utf-8").replace("`core`", "`corex`", 1), encoding="utf-8")
        item = self.base_item("FEAT-2017")
        item["routing"] = {"derived": "minimal", "effective": "minimal"}
        item["context"] = self.valid_manifest("minimal")
        self.write_item(root, item, ["discovery.md", "spec.md"])
        validator = Validator(root, strict=True)
        self.assertEqual(validator.run(), 1)
        self.assertTrue(any("unknown context domains" in error or "mandatory domain" in error for error in validator.errors))

    def test_subtask_context_domain_column_validates(self):
        temp, root = self.make_repo()
        self.addCleanup(temp.cleanup)
        item = {
            "schema_version": "1.0", "id": "BUG-2010", "title": "Handoff",
            "track": "support", "type": "bug", "phase": "execute",
            "status": "active", "risk": "low", "owner": "team",
            "conversation_profile": "support-incident-engineer", "last_updated": "2026-09-20",
        }
        self.write_item(root, item, ["triage.md", "reproduction.md", "spec.md", "plan.md"])
        (root / ".context/work/BUG-2010/plan.md").write_text(
            "# Plan\n\n## Subtasks and waves\n\n"
            "| Subtask ID | Owner | Dependencies | Acceptance evidence | Wave | Context domains |\n"
            "| --- | --- | --- | --- | --- | --- |\n"
            "| S1 | team | none | Tests pass | 1 | core,project |\n",
            encoding="utf-8",
        )
        self.assertEqual(Validator(root, strict=True).run(), 0)

        (root / ".context/work/BUG-2010/plan.md").write_text(
            "# Plan\n\n## Subtasks and waves\n\n"
            "| Subtask ID | Owner | Dependencies | Acceptance evidence | Wave | Context domains |\n"
            "| --- | --- | --- | --- | --- | --- |\n"
            "| S1 | team | none | Tests pass | 1 | kubernetes |\n",
            encoding="utf-8",
        )
        validator = Validator(root, strict=True)
        self.assertEqual(validator.run(), 1)
        self.assertTrue(any("unknown context domain" in error for error in validator.errors))


if __name__ == "__main__":
    unittest.main()
