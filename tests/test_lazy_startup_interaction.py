import json
import unittest
from pathlib import Path

from scripts.validate_context import (
    CLASSIFICATION_DIMENSIONS_CURRENT,
    Validator,
)

ROOT = Path(__file__).resolve().parents[1]


def make_validator(profiles=("senior-software-engineer", "technical-planner")) -> Validator:
    validator = Validator(ROOT, strict=True)
    validator.available_agent_profiles = set(profiles)
    return validator


def base_item(**overrides) -> dict:
    item = {
        "schema_version": "1.0",
        "id": "FEAT-0001",
        "title": "t",
        "track": "product",
        "type": "feature",
        "phase": "specify",
        "status": "draft",
        "risk": "low",
        "owner": "o",
        "conversation_profile": "senior-software-engineer",
        "last_updated": "2026-09-20",
    }
    item.update(overrides)
    return item


class LazyStartupInteractionTest(unittest.TestCase):
    def test_configured_profile_default_exists_and_is_available(self):
        config = json.loads((ROOT / ".context/config.json").read_text(encoding="utf-8"))
        profiles = config["agent_profiles"]
        self.assertEqual(profiles["default"], "senior-software-engineer")
        self.assertIn(profiles["default"], profiles["available"])

    def test_git_finalization_mode_may_remain_unresolved(self):
        validator = make_validator()
        validator.check_item_metadata(Path("FEAT-0001"), base_item(), r"^[A-Z]+-[0-9]+$")
        self.assertEqual(validator.errors, [])

    def test_invalid_git_finalization_mode_is_rejected(self):
        validator = make_validator()
        validator.check_item_metadata(Path("FEAT-0001"), base_item(git_finalization_mode="yolo"), r"^[A-Z]+-[0-9]+$")
        self.assertTrue(any("invalid git_finalization_mode" in error for error in validator.errors))

    def test_explicit_profile_choice_is_honored(self):
        validator = make_validator()
        validator.check_item_metadata(Path("FEAT-0001"), base_item(conversation_profile="technical-planner"), r"^[A-Z]+-[0-9]+$")
        self.assertEqual(validator.errors, [])

    def test_unknown_profile_is_rejected(self):
        validator = make_validator()
        validator.check_item_metadata(Path("FEAT-0001"), base_item(conversation_profile="no-such-lens"), r"^[A-Z]+-[0-9]+$")
        self.assertTrue(any("unknown conversation_profile" in error for error in validator.errors))

    def test_profile_is_not_a_classification_or_routing_input(self):
        schema = json.loads((ROOT / ".context/schemas/work-item.schema.json").read_text(encoding="utf-8"))
        self.assertIn("conversation_profile", schema["required"])
        self.assertNotIn("profile", " ".join(CLASSIFICATION_DIMENSIONS_CURRENT))
        classification_properties = schema["properties"]["classification"]["properties"]
        routing_properties = schema["properties"]["routing"]["properties"]
        for properties in (classification_properties, routing_properties):
            self.assertFalse(any("profile" in key for key in properties))

    def test_git_safety_defaults_hold_in_canonical_config(self):
        config = json.loads((ROOT / ".context/orchestration/config.json").read_text(encoding="utf-8"))
        git = config["git"]
        self.assertEqual(git["finalization_mode"], "confirm_each")
        self.assertFalse(git["allow_force_push"])
        self.assertTrue(git["human_approval_required_before_push"])
        self.assertTrue(git["ask_before_commit"] and git["ask_before_push"])
        self.assertIn("git_finalization_mode", config["startup"]["questions"])

    def test_trivial_scenario_expects_no_questions(self):
        scenarios = json.loads((ROOT / "benchmarks/scenarios.json").read_text(encoding="utf-8"))
        trivial = next(s for s in scenarios["scenarios"] if s["id"] == "B1-documentation-trivial")
        self.assertEqual(trivial["questions_expected"], 0)
        for scenario in scenarios["scenarios"]:
            self.assertIsInstance(scenario["questions_expected"], int)

    def test_eager_startup_instructions_are_gone(self):
        guarded = [
            ".context/prompts/start-conversation.md",
            ".context/prompts/intake.md",
            ".context/profiles/README.md",
            ".context/orchestration/README.md",
            ".context/workflows/core.md",
        ]
        eager_phrases = (
            "At the beginning of every conversation, ask for the Git finalization mode",
            "Which profile should guide this conversation?",
            "Which conversation profile should guide the work",
            "At startup, ask whether Git finalization should be",
            "At the beginning of a conversation, choose one profile",
        )
        for relative in guarded:
            text = (ROOT / relative).read_text(encoding="utf-8")
            for phrase in eager_phrases:
                self.assertNotIn(phrase, text, f"{relative} still eagerly asks: {phrase}")


if __name__ == "__main__":
    unittest.main()
