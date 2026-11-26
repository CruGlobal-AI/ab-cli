# AGENTS.md

Notes for AI coding agents working in `ab-cli`, the `appbuilder` command line tool for the AppBuilder (AB) stack.

## This is the CruGlobal-AI fork
- Upstream: `CruGlobal/ab-cli`. This fork installs the **CruGlobal-AI** stack by default.
- All repo and image sources go through `lib/utils/source.js`. Don't hardcode GitHub orgs or registries; use `utils.source.gitURL(repo)` and `utils.source.image(name, tag)`.
- Env overrides: `AB_GITHUB_ORG` (default `CruGlobal-AI`) and `AB_IMAGE_REGISTRY` (default `ghcr.io/cruglobal-ai`). Set `AB_GITHUB_ORG=CruGlobal AB_IMAGE_REGISTRY=docker.io/digiserve` to install upstream.
- The compose templates in `templates/setup/` hardcode `ghcr.io/cruglobal-ai/` (they're copied, not rendered).

## Layout
- `index.js`: entry point (`appbuilder` bin). Commands live in `lib/*.js` and `lib/tasks/*.js`.
- `lib/utils/`: shared helpers, all exported from `lib/utils/utils.js`.
- `templates/`: files copied or rendered (EJS) into a new install.

## Legacy (leave alone unless asked)
`lib/installV1.js`, `lib/prod2021.js`, `lib/tasks/mobileNew.js`, and the `appdevdesigns` fallback in `gitInstallServices.js` point at old upstream repos on purpose.

## Checks
- `npx eslint <changed files>`. The repo has existing prettier drift, so lint only what you touch.
- Smoke test: `node index.js install <dir>` in a scratch folder clones `ab_runtime` from the AI org.
