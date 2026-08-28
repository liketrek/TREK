---
status: accepted
---

# Adopt upstream release baselines with schema crosswalks

TREK's downstream fork starts each major upgrade from the exact upstream release tag, ports the documented customization inventory onto that tree, and then bridges the old fork tips into history without changing the audited release-based tree. This avoids resolving obsolete implementations after upstream architectural rewrites, at the cost of deliberate capability ports and an explicit history bridge.

Because the 3.4.1 fork and upstream v4 independently used numeric migration slots 176–180, v4 retains upstream migrations 1–198 unchanged and appends an idempotent crosswalk plus final downstream schemas. Clean upstream, partially upgraded, and previously customized databases therefore converge without rewriting applied migration history.
