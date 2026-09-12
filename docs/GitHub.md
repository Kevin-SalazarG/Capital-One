# Git and GitHub Standards

**Version:** 1.0  
**Date:** 2026-09-12  
**Status:** agreed policy; remote repository settings and automation are not configured by this document.  
**Scope:** commits, branches, pull requests, reviews, issues, workflows, and releases for Mirror.

## 1. Core rules

- Write branch descriptions, commit messages, PR titles and bodies, reviews, issues, and release notes in English.
- Keep changes focused, reviewable, and directly related to the task.
- Never add coauthor trailers to newly created commits, including squash and merge messages.
- Use short-lived branches named `type/short-description`.
- Use short, direct Conventional Commit subjects and the same format for PR titles.
- Protect the default branch and merge through reviewed pull requests with the required checks.
- Preserve unrelated work and existing history. Do not change identities or rewrite published history without explicit authorization.
- Never claim that checks, approvals, commits, pushes, merges, or releases happened unless verified.

Follow [Code.md](Code.md) for code quality and [Backend.md](Backend.md) for architecture. This document defines how authorized work is delivered; it is not permission to initialize a repository, create branches, commit, push, open PRs, change GitHub settings, or publish releases now.

## 2. Workflow and default branch

Use a lightweight branch-and-PR workflow:

1. Confirm the repository, remote, base branch, and current working-tree state.
2. Start a task branch from the agreed base when branch creation is authorized.
3. Implement one coherent change and run the relevant checks.
4. Review the diff and create focused commits.
5. Push and open a PR when the task authorizes those external actions.
6. Address review feedback, rerun affected checks, and verify the latest revision.
7. Merge only when authorized and when all requirements are satisfied.

The intended default branch is `main`. Do not rename an existing repository's default branch or assume it is named `main` without checking. Do not create a permanent `develop` branch or additional environment branches without a concrete need.

This follows GitHub flow, with the stricter naming and quality rules defined below. [GitHub flow](https://docs.github.com/en/get-started/using-github/github-flow).

## 3. Branch names

Required format:

```text
type/short-description
```

Use one slash, a lowercase type, and an English description in lowercase ASCII `kebab-case`. Keep the complete name at or below 80 characters. Do not use spaces, underscores, accents, personal prefixes, dates without meaning, or vague descriptions such as `changes` or `stuff`.

| Type       | Purpose                                                 | Example                            |
| ---------- | ------------------------------------------------------- | ---------------------------------- |
| `feat`     | New behavior or capability.                             | `feat/evaluate-job-liquidity`      |
| `fix`      | Correct incorrect behavior, including security defects. | `fix/prevent-duplicate-deposits`   |
| `docs`     | Documentation changes.                                  | `docs/backend-conventions`         |
| `refactor` | Restructure code without changing intended behavior.    | `refactor/extract-forecast-engine` |
| `perf`     | A measured performance improvement.                     | `perf/reduce-dashboard-queries`    |
| `test`     | Test coverage, fixtures, or test infrastructure.        | `test/decision-concurrency`        |
| `build`    | Build tooling, packaging, or dependency integration.    | `build/configure-sdk-exports`      |
| `ci`       | CI workflow changes.                                    | `ci/check-source-policy`           |
| `chore`    | Maintenance that does not fit another category.         | `chore/update-dependencies`        |
| `style`    | Formatting-only changes, not product styling features.  | `style/format-api-schemas`         |
| `revert`   | Revert a specific earlier change.                       | `revert/remove-invalid-cache`      |

Illustrative validation pattern:

```regex
^(feat|fix|docs|refactor|perf|test|build|ci|chore|style|revert)/[a-z0-9]+(?:-[a-z0-9]+)*$
```

The pattern applies to task branches, not `main` or GitHub-generated refs. Syntax validation must also respect Git's ref-name rules. Refer to an issue in the description only when the issue actually exists; an issue number is optional.

## 4. Commit messages

Required subject format:

```text
type(scope): imperative summary
```

The scope is optional. Prefer a specific affected area such as `planning`, `banking`, `decisions`, `auth`, `mobile`, `sdk`, `api`, or `docs`.

### 4.1 Subject rules

- English only, short and specific.
- Lowercase type and scope, using the branch types listed above.
- Use an imperative verb: `add`, `fix`, `validate`, `remove`, `document`, or `refactor`.
- Aim for 50 characters; the complete subject must not exceed 72 characters.
- Start the summary with a lowercase word; preserve proper names when necessary.
- No ending period, emoji, author credit, or filler.
- Describe the change, not the activity of making a commit.
- Do not use subjects such as `update`, `changes`, `final`, `wip`, or `fix stuff`.

Examples:

```text
feat(planning): calculate required advance
fix(banking): prevent duplicate imports
docs: define code and GitHub standards
refactor(decisions): extract version checks
test(auth): reject cross-business access
ci: validate commit and branch policy
```

### 4.2 Bodies and breaking changes

An optional body should explain why the change is needed, important constraints, or migration impact. Separate it from the subject with a blank line. Keep it in English and avoid repeating the diff line by line.

Mark a breaking public contract change with `!` in the subject and describe its impact and migration path in a `BREAKING CHANGE:` footer. Never label a breaking API change as harmless refactoring.

The syntax is based on Conventional Commits; the length, language, and no-coauthor rules are additional project requirements. [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).

### 4.3 No coauthors

- Do not add `Co-authored-by:` trailers, regardless of capitalization, to new commit messages.
- Do not add assistant or bot attribution trailers or "generated by" credit footers.
- Inspect the complete message, not only its first line, including text supplied by a tool or GitHub merge dialog.
- Use the legitimate configured Git author and committer identities. Do not impersonate another contributor or change `user.name`, `user.email`, signing settings, or author metadata to satisfy this policy.
- Do not rewrite old commits or remove existing contributors from history as a cleanup task.

This is a policy for new commit metadata, not a claim that assistance was not used. Preserve license notices and required attribution. If the event requires disclosure of tools or reused code, provide truthful disclosure in the appropriate documentation rather than inventing authorship.

## 5. Commit scope and working-tree safety

- A commit represents one complete, coherent change. Include the tests and documentation necessary for that change.
- Do not mix a feature with unrelated cleanup, mass formatting, dependency upgrades, or file moves.
- Review both unstaged and staged diffs before committing. Stage only the intended files or hunks.
- Do not use blanket staging in a dirty workspace without reviewing what it includes.
- Never discard, overwrite, stash, or commit someone else's work merely to obtain a clean status.
- Do not commit secrets, `.env` values, real customer data, local database dumps, temporary output, or `node_modules`.
- Commit reviewed lockfile changes with their dependency change. Commit generated artifacts only when the package's delivery policy requires them.
- Do not amend a commit created by another actor or rewrite a published branch without explicit authorization.
- Never force-push a protected branch. Rewriting a personal task branch also requires authorization; even a lease-protected force push can replace remote history.

Existing repositories inside the workspace, such as the SDK repository, must be treated as separate targets until their integration is explicitly defined. Do not change their remotes, history, or Git configuration as a side effect of editing Mirror documentation.

## 6. Pull requests

### 6.1 Title and scope

Use the same English Conventional Commit format and 72-character subject limit for the PR title. The title should describe the final delivered change and be suitable for the squash commit.

One PR should have one primary purpose. Use a draft PR for incomplete work or early feedback. Do not present placeholders, missing security checks, or unverified integrations as finished features.

Confirm the correct repository, base branch, and complete diff before opening the PR. Link related issues only when verified; use closing keywords only when the PR genuinely resolves the issue.

### 6.2 Body structure

Use this English structure, keeping each section concise:

```markdown
## Summary

Explain the problem and the outcome.

## Changes

- List the important changes and relevant boundaries.

## Verification

- List the checks actually run and their results.
- State what was not run and why.

## Risks and migrations

- Describe compatibility, security, data, or deployment impact.
- State "None" only when that is accurate.

## Related issues

Link verified issues, or state "None".
```

Add before/after images when reviewing a UI change and remove sensitive information. For API or schema changes, describe compatibility and migration implications. For documentation-only work, report document checks and say that application tests were not run when that is the case.

Never invent test results, performance gains, approvals, issue references, or a working deployment. A screenshot is not a substitute for verification of financial calculations or access controls.

## 7. Reviews and merge requirements

Before merging:

- [ ] The PR is ready for review and has the correct base and scope.
- [ ] Its title and body follow the English conventions.
- [ ] The latest revision has completed the applicable required checks.
- [ ] At least one reviewer other than the author has approved the relevant revision.
- [ ] Review conversations are resolved and no blocking review remains.
- [ ] Security, financial correctness, public contracts, and migrations were reviewed where affected.
- [ ] The final commit message contains no coauthor or generated-by trailers.
- [ ] The merge itself is authorized.

If no independent reviewer is available, report that limitation and obtain an explicit maintainer decision before proceeding. Do not fabricate an approval, treat self-review as independent review, or silently bypass protection.

Use **squash merge** as the default to keep a linear, focused history. Inspect and, when needed, edit the final squash message before confirming it; do not assume the PR title controls all generated metadata. If the selected merge path cannot produce a compliant message, stop and choose an approved alternative.

Verify the merged result and resulting commit metadata. Clean up a merged task branch only when cleanup is authorized and no unmerged work remains. Never rewrite published history just to improve a subject line; use a scoped follow-up or revert when appropriate.

## 8. Intended GitHub protections

Configure the following when repository administration is authorized:

- Protect `main` through a ruleset or branch protection appropriate to the repository.
- Require PRs, applicable status checks, conversation resolution, and an independent approval.
- Require review of changes added after approval, using the appropriate stale-review or latest-push setting.
- Require a linear history and disallow force pushes and deletion of the protected branch.
- Avoid routine administrator bypass of these requirements.
- Use unique, stable status-check names so required checks cannot be confused across workflows.

These are intended settings, not claims about an existing GitHub configuration. Availability and exact options must be checked when configuring the actual repository. [Protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches).

## 9. CI policy and workflow security

CI must enforce the applicable checks from `Code.md`: encoding, source policy, Prettier, TypeScript, lint, tests, build, and API-contract consistency.

Add a Git-policy check for task-branch names, new commit subjects, PR titles, and prohibited trailers in the PR's commit range. Do not revalidate and rewrite unrelated historical commits. Syntax, lengths, and trailers can be automated; English clarity and change scope still require review.

Required checks must refer to the latest reviewed revision. Do not hide a failing job behind an unconditional success, a broad skip, or `continue-on-error`. If documentation-only changes use a reduced scope, report the decision explicitly and keep the final required gate meaningful.

Workflow requirements:

- Default to minimal token permissions and grant write access only to jobs that genuinely need it.
- Pin third-party actions to reviewed full commit SHAs, with a readable version reference when useful.
- Install from the committed lockfile in frozen mode and review dependency or install-script changes.
- Do not expose secrets to untrusted pull-request code.
- Do not use a privileged `pull_request_target` workflow to check out and execute an untrusted PR revision.
- Treat PR titles, branch names, issue text, and other event fields as untrusted input; never interpolate them directly into shell code.
- Use isolated runners for untrusted contributions. Do not run untrusted PR code on a sensitive self-hosted runner.
- Mask secrets and avoid publishing sensitive logs, artifacts, environment dumps, or connection strings.
- Keep deployment and release credentials behind the appropriate environment and approval controls.

These requirements follow GitHub's workflow security guidance and must be verified against the actual workflow design. [Secure use of GitHub Actions](https://docs.github.com/en/actions/reference/security/secure-use).

Local hooks may improve feedback, but they do not replace CI or authorize skipping it. Hook tools, commit validators, and remote protections remain pending until implemented.

## 10. Issues, releases, and truthful status

- Issues use short English titles and describe the problem, expected behavior, and acceptance criteria.
- Bug reports include reproducible steps and relevant environment information without exposing secrets.
- Reviews explain the concern and the requested change; keep them specific and respectful.
- Release notes describe delivered behavior, fixes, compatibility changes, and known limitations in English.
- Package publication, release tags, deployment, and repository visibility changes require the corresponding authorization.
- Preserve the event's requirements for code provenance and disclosure. The no-coauthor rule does not remove licensing or disclosure obligations.

After authorized GitHub work, report only confirmed actions and include the real resource link when useful. If a push, check, merge, or release is pending or failed, state that clearly.

Creating this document does not create a commit, branch, PR, workflow, protection rule, or release.
