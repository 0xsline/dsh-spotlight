# Plugin Template Contributor Notes

This repository is a standalone DeepSeek Harness plugin template.

- Preserve the function-plugin named exports: `name`, `inject`, `Config`, and `apply`; do not add a default export.
- Keep all registrations scoped to the plugin fiber and test disposal.
- Keep DSH packages as peer dependencies, with matching development TypeScript references.
- Update `README.md`, configuration JSDoc, tests, and `cordis.patch.yml` together when behavior changes.
- Run `pnpm run typecheck`, `pnpm test`, and `pnpm run build` before publishing changes.
