# Contributing to Kalenda

Thank you for contributing to Kalenda. The `main` and `dev` branches are
protected and only accept changes through pull requests. `main` contains the
stable code, while `dev` is the integration branch for ongoing work.

## Workflow

1. Create a descriptive branch from `dev`, for example
   `fix/export-timeout` or `feat/calendar-filters`.
2. Keep changes focused on one objective and avoid unrelated generated or
   formatting-only changes.
3. Open a pull request against `dev`. New features, behavior changes, and
   refactors must go through this review; bug fixes must also use pull requests
   to preserve traceability.
4. Promote release-bound changes through a separate pull request from `dev` to
   `main`. Production hotfixes must also use a dedicated pull request into
   `main`.
5. Wait for all CI checks to complete successfully and address review comments
   before merging.

Direct pushes to `main` or `dev`, as well as force-pushes to protected branches,
are not allowed. Both branches require an approval, all mandatory CI checks,
resolved conversations, and a linear history. Working branches may be deleted
after their pull request is merged.

## Pull request requirements

Every pull request must:

- Explain the problem and the proposed solution.
- Describe how the change was tested.
- Include tests for new or modified logic when practical.
- Update the documentation and roadmap when behavior or operational workflows
  change.
- Avoid introducing secrets, credentials, or user data.
- Preserve compatibility with Docker Compose and supported versions.

CI runs a reproducible installation, dependency audits, linting, the build,
unit tests, and a Docker Compose smoke test. All of these checks are required
to merge changes into `dev` and `main`.

## Commits

Use short, descriptive messages, preferably with a prefix:

```text
feat: add recurring events
fix: retry interrupted exports
docs: update compose installation
ci: require generated Prisma client
```

Commits maintained by the project owner must preserve the identity and signing
configuration for Jaumoso. Dependabot may retain its author attribution for
security-related dependency updates.

## Dependencies and security

Do not update dependencies while ignoring the lockfile. Run `pnpm install` and
check `pnpm audit` before opening a pull request. For vulnerabilities, do not
publish exploitable details in a public pull request; use GitHub's security
advisory process instead.

## Releases

Releases are prepared from `dev`, promoted to `main`, and tagged using
Semantic Versioning (`vMAJOR.MINOR.PATCH`). Docker images are published only
from a published release with a valid tag.
