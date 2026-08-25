# Deliver direct Web Push with TREK-managed VAPID

TREK delivers standards-based Web Push as its own notification channel, using one durable, encrypted VAPID identity and account-owned Device subscriptions bound to the installation's canonical origin. Keys are generated automatically with complete environment overrides for advanced operators; subscriptions from another origin cannot deliver until explicitly re-enabled. This avoids Firebase or ntfy lock-in while keeping ntfy as an independent channel and preserving TREK's existing recipient, localization, and event-preference model.

## Consequences

An administrator must enable the channel and each Account member must explicitly authorize each browser installation. Explicit logout and remote revocation remain durable, full notification previews may appear on device lock screens, and changing the canonical origin requires resubscription.
