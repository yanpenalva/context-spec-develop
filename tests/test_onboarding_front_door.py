import json
import unittest
from pathlib import Path

from scripts.validate_context import (
    BUDGET_MAX_REQUIRED,
    ROUTING_DEPTHS,
    Validator,
    derive_routing,
)

ROOT = Path(__file__).resolve().parents[1]
VENDOR_PATTERN = ("codex", "opencode", "gemini", "claude", "cursor", "copilot", "ollama", "qwen", "openai", "anthropic", "jev")
EXECUTOR_CONFIG_KEYS = ("classifier_model", "classifier_provider", "classifier_api", "classifier_endpoint")


class OnboardingFrontDoorTest(unittest.TestCase):
    def test_onboarding_contract_exists_and_is_wired(self):
        contract = ROOT / ".context/prompts/initialize-project.md"
        self.assertTrue(contract.is_file())
        for referencing in ("AGENTS.md", ".context/INDEX.md", ".context/prompts/start-conversation.md"):
            text = (ROOT / referencing).read_text(encoding="utf-8")
            self.assertIn("initialize-project.md", text, f"{referencing} does not reference the onboarding contract")

    def test_lifecycle_contracts_name_no_vendor(self):
        scanned = [
            ROOT / ".context/prompts/initialize-project.md",
            ROOT / ".context/prompts/start-conversation.md",
            *sorted((ROOT / ".context/classification").glob("*.md")),
            *sorted((ROOT / ".context/context-routing").glob("*.md")),
        ]
        for path in scanned:
            text = path.read_text(encoding="utf-8").lower()
            for vendor in VENDOR_PATTERN:
                self.assertNotIn(vendor, text, f"{path.name} mentions {vendor}")

    def test_no_classifier_executor_configuration_is_required(self):
        for relative in (".context/config.json", ".context/orchestration/config.json", ".context/schemas/work-item.schema.json"):
            data = json.loads((ROOT / relative).read_text(encoding="utf-8"))
            serialized = json.dumps(data).lower()
            for key in EXECUTOR_CONFIG_KEYS:
                self.assertNotIn(key, serialized, f"{relative} requires {key}")

    def test_templates_carry_classification_and_routing(self):
        for template in sorted((ROOT / ".context/templates").rglob("work-item*.json")):
            item = json.loads(template.read_text(encoding="utf-8"))
            self.assertIn("classification", item, f"{template.name} lacks classification")
            self.assertIn("routing", item, f"{template.name} lacks routing")

    def test_routing_derivation_and_budgets_stay_aligned(self):
        self.assertEqual(set(BUDGET_MAX_REQUIRED), set(ROUTING_DEPTHS))
        minimal = {"complexity": "low", "impact": "local", "security": "none"}
        standard = {"complexity": "medium", "impact": "module", "security": "none"}
        extended = {"complexity": "high", "impact": "local", "security": "none"}
        self.assertEqual(derive_routing(minimal, "low"), "minimal")
        self.assertEqual(derive_routing(standard, "low"), "standard")
        self.assertEqual(derive_routing(extended, "low"), "extended")

    def test_existing_repository_remains_valid_backward_compatible(self):
        self.assertEqual(Validator(ROOT, strict=True, include_examples=True).run(), 0)


if __name__ == "__main__":
    unittest.main()
