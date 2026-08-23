import json
import shutil
import tempfile
import unittest
from pathlib import Path

from scripts.validate_context import Validator


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


if __name__ == "__main__":
    unittest.main()
