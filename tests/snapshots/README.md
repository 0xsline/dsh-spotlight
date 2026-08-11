# Snapshot Fixtures

Store stable expected output for product-visible behavior in `tests/snapshots/`. Use descriptive filenames such as `command-help.expected.txt` and keep the owning test responsible for the exact fixture inventory.

Do not add snapshots for internal object shapes, unstable timestamps, credentials, absolute workstation paths, or output that can be asserted more clearly with focused values. This placeholder defines no refresh command because it contains no fixtures. Introduce the repository-local refresh command and document it in `tests/README.md` in the same change as the first snapshot, then review every changed fixture semantically.
