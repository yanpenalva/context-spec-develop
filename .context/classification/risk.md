# Risk and the Security Signal

Risk is already canonical: the `risk` field on `work-item.json` (`low`, `medium`, `high`, `critical`) grades the consequence and uncertainty of the proposed change, and `severity` grades an active incident's observed impact. Glossary: `docs/concepts-and-glossary.md`. This layer does not redefine risk and never duplicates it inside `classification`.

Classification consumes the root `risk` value as an input to routing (see [`routing.md`](routing.md)) and adds one new, explicit signal: the security/privacy exposure of the work.

## Security signal

| Value | Meaning | Activates |
| --- | --- | --- |
| `none` | No authentication, authorization, sensitive data, payment, secret or trust-boundary surface touched. | Nothing. |
| `relevant` | Work touches authentication, authorization, sessions, input trust boundaries, dependency or supply-chain surface, or non-sensitive data handling. | Security implications MUST be analyzed in spec and review per `policies/core/security-privacy.md`. |
| `sensitive` | Work touches personal or otherwise sensitive data, payments, secrets, credentials, or any security or privacy boundary the project treats as protected. | `security_reviewer.required_when` (`security_or_sensitive_data_impact`) in `.context/orchestration/config.json`; independent security review before release. |

The signal is a switch for existing contracts. It creates no new security rules and never weakens `policies/core/security-privacy.md`. When evidence is ambiguous between two values, classify at the higher exposure and record the uncertainty through `.context/interaction/` instead of asking immediately.

## Risk criteria reference

When setting root `risk` during intake, weigh the areas this kit already governs:

- authentication and authorization;
- sensitive or personal data;
- payments and financial integrity;
- destructive or irreversible operations and migrations;
- public contracts and compatibility;
- infrastructure and availability;
- data integrity and production impact;
- rollback difficulty.

Authority boundaries remain in `policies/core/review-release.md`: humans accept risk, authorize production and approve exceptions; classification and agents never do.
