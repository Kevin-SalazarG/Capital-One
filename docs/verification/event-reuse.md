# Event reuse and disclosure review

**Reviewed:** 2026-09-12.  
**Plan item:** P0.7 in [Backend-Plan.md](../Backend-Plan.md).  
**Result:** SDK licensing and provenance are verified. HackMTY 2026 eligibility, disclosure requirements, and permission for organizer/brand materials remain unconfirmed. P0.7 stays open.

## Confirmed conditions

| Item                     | Evidence                                                                                                                                                                                                                                                        | Condition and scope                                                                                                                                                                                                                                                                                                                         |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Independent Node.js SDK  | The local [package manifest](../../nessie-node-sdk/package.json) and [LICENSE](../../nessie-node-sdk/LICENSE) declare MIT. The [public repository](https://github.com/Kevin-SalazarG/nessie-node-sdk) was accessible without authentication during this review. | MIT permits reuse and redistribution subject to preserving its copyright and permission notices in copies or substantial portions. This software license does not decide competition eligibility. [MIT terms](https://opensource.org/license/mit).                                                                                          |
| Nessie contract snapshot | Both the [local OpenAPI snapshot](../../nessie-node-sdk/spec/nessie-openapi.yaml) and the [official specification](https://prod.nessieisreal.com/nessie-openapi-spec.yaml) declare MIT in `info.license`. They match after applying the same YAML formatting.   | Preserve upstream license metadata and applicable notices when distributing the specification. This declaration concerns the specification; it does not grant rights to the challenge PDF or logo, or establish authenticated API compatibility.                                                                                            |
| Capital One challenge    | All three pages of the [local brief](<../../Capital One Challenge HackMTY 2026.pdf>) were read, including the image-based judging table.                                                                                                                        | Page 2, section 6 encourages Nessie use and requires a public code repository and working live demo. It does not prescribe this SDK. No explicit rule on previous code, AI assistance, reuse disclosure, or permission to redistribute the brief/logo appears in the supplied document.                                                     |
| Capital One logo         | The mobile [asset provenance](../../apps/mobile/assets/brand/README.md) records an SVG extracted from Capital One's homepage and a derived splash image.                                                                                                        | The published [trademark guidelines](https://www.capitalone.com/digital/trademarks/) address expressly authorized users and require advance written approval of materials. They restrict alterations and implied endorsement. Source attribution alone is not evidence of permission for the current prototype, demo, or public repository. |

The brief's originality score is 30%, and its technical-depth description refers to work within 36 hours. Neither statement resolves which existing libraries or materials are allowed. Keep the original PDF intact; the public-repository requirement does not itself authorize publishing organizer materials.

## What the 2026 event sources establish

| Source inspected                                                                                                                                                      | Finding                                                                                                                        | Limit                                                                                                                                                                                 |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [HackMTY homepage](https://hackmty.com/) and [official MLH calendar](https://www.mlh.com/seasons/2027/events/)                                                        | HackMTY 2026 is listed for September 11–13, 2026, in Monterrey; the event describes a 36-hour hackathon.                       | Dates and duration do not establish the exact permitted coding window or reuse policy. MLH's 2027 season includes this September 2026 event.                                          |
| [HackMTY FAQ](https://hackmty.com/faq), including its public [English](https://hackmty.com/data/faq.json) and [Spanish](https://hackmty.com/data/faq.es.json) content | Covers logistics, teams and general judging; lists `hello@hackmty.com` for questions.                                          | No previous-code, library, AI, or reused-material disclosure rule was located. The FAQ has no visible revision date.                                                                  |
| [Official registration portal](https://experience.hackmty.com/register)                                                                                               | Its public form links acceptance of the MLH Code of Conduct. No account was created or registration submitted.                 | No reuse conditions were displayed. Private participant communications and authenticated submission instructions were not inspected.                                                  |
| [MLH Code of Conduct](https://github.com/MLH/mlh-policies/blob/main/code-of-conduct.md)                                                                               | Addresses participant conduct.                                                                                                 | Linking this code or being MLH-affiliated does not establish adoption of separate project-eligibility rules.                                                                          |
| [HackMTY 2025 rules](https://hackmty2025.devpost.com/rules)                                                                                                           | Rule 3 restricts previous code with an exception for public libraries/APIs. Rule 5 requires disclosure of external tools/APIs. | Historical context only. These are 2025 rules; no source found in this review makes them binding for 2026. They do not specifically resolve a participant's own SDK or AI assistance. |

No authoritative 2026 rule on these questions was located through the official public pages, their linked portal, and targeted searches. This is a search result, not proof that such rules do not exist or that reuse is prohibited. A current rule or organizer clarification is needed before claiming submission eligibility.

## SDK provenance for an organizer decision

- Package: `nessie-node-sdk` version `0.1.0`, an independent implementation rather than an official Capital One package, as stated in its [README](../../nessie-node-sdk/README.md).
- Mirror's recorded SDK baseline: [`7d57c894c5b45eb38d3c817830f79c73f6ce27cf`](https://github.com/Kevin-SalazarG/nessie-node-sdk/commit/7d57c894c5b45eb38d3c817830f79c73f6ce27cf). Local history records the implementation commit `ab70a74` at `2026-09-12T03:37:04-06:00` and this documentation commit at `2026-09-12T03:40:23-06:00`. The latter commit was also accessible publicly during this review.
- GitHub's public repository metadata reports creation at `2026-09-12T09:31:45Z`. Repository creation and commit dates do not prove when code first became public or whether work met the event's exact coding window.
- The SDK existed before Mirror's backend integration. That fact alone does not mean it predates the hackathon. The root workspace has no Git history that establishes when all application code or planning materials were authored.
- Existing [SDK verification](sdk-baseline.md) records package consumption and preservation of its independent history. This review left SDK source, license, history and assets unchanged.

These facts support a truthful submission disclosure. Do not label all Mirror work as created during the event until the permitted window and actual development timeline are established. AI-assisted development was used in this workspace; the applicable disclosure format remains to be confirmed.

## Clarification prepared for the organizers

**Draft only; not sent.** The event FAQ provides `hello@hackmty.com`. For brand permission, Capital One's guidelines provide `brandgovernance@capitalone.com`; the challenge mentor may identify an existing event-specific grant.

> We are building Mirror for the Capital One challenge at HackMTY 2026. Could you point us to the current rules and confirm the following?
>
> 1. May we use our own independent MIT-licensed `nessie-node-sdk` 0.1.0 as a dependency? Its public repository is https://github.com/Kevin-SalazarG/nessie-node-sdk and our baseline is commit `7d57c89`, dated September 12, 2026 at 03:40:23 UTC−06:00. It existed before our backend integration. Does a public-library exception apply to participant-authored SDKs, and what publication cutoff or evidence is required?
> 2. What are the exact start/end times and timezone for eligible development? How should we declare existing code, planning/design materials, dependencies, API use and AI-assisted development, and where should these disclosures appear?
> 3. Does the challenge grant permission to include the Capital One logo in the prototype/splash, demo and public source repository? Which approved assets and attribution should we use? May the supplied challenge PDF be redistributed with the submission, or should we only reference it?

## Evidence needed to close P0.7

- [x] Synthetic financial fixtures and expected results are already implemented and tested; see [financial evidence](financial-engine.md).
- [x] Inspect the challenge brief, current public event pages, SDK provenance and applicable license/brand statements.
- [ ] Record a current 2026 rule or organizer clarification resolving the SDK/library exception, development window, reused materials and AI/tool disclosure, then compare it with the team's actual work.
- [ ] Record permission covering any organizer/brand assets included in the submission, or resolve their inclusion before publishing.
- [ ] Prepare the final disclosure and retained license notices for the actual submission under those confirmed conditions.

## Review verification

Only this report and the owning plan were edited. No organizer was contacted, no public submission was made, and no application behavior changed.

- The original brief's SHA-256 remains `70402eeab1aa09ebfff22bdaf7a1639ce97b12d32c41c348131755051be036b5`.
- The local Nessie specification's SHA-256 is `0a8e49d1764850a0f85ef3591f385c491f262b89973988f3070db13d1547d8c7`. The live response had different formatting; formatting both copies with Prettier produced equal text. Neither copy was rewritten.
- SDK Git status was clean. Public repository, baseline commit and specification were inspected without credentials.
- Documentation validation covers Prettier, strict UTF-8 without BOM, LF, final newlines and local link targets. Application tests are not required for this documentation-only change.
