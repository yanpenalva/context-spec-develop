# Standards and References

The kit uses external references as guidance, not as a claim of certification.

- [SonarQube's new-code quality gate](https://docs.sonarsource.com/sonarqube-server/2025.3/quality-standards-administration/ai-code-assurance) is a useful example of focusing on no new issues, reviewed security hotspots, changed-code coverage and duplication. Projects configure their own tooling and thresholds.
- [NIST's Generative AI Profile](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf) informs risk identification, governance, measurement and lifecycle controls.
- [OWASP GenAI prompt-injection guidance](https://genai.owasp.org/llmrisk/llm01-prompt-injection/) informs least privilege, untrusted content separation, output validation and human approval for high-risk actions.
- [DORA metrics guidance](https://dora.dev/guides/dora-metrics/) informs delivery outcome measurement at application/team level. They are trend signals, not individual targets or inter-team rankings.

Always verify the current official version before adopting a requirement. Regulatory, contractual and organizational obligations take precedence over this guide.
