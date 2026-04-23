# Changelog

## 3.0.3

- Initial Home Assistant Supervisor add-on release.
- Wraps upstream `mauriceboe/trek:3.0.3`.
- Ships amd64, aarch64 and armv7 builds.
- Exposes TREK through HA Ingress; persistent data under
  `/addon_configs/<slug>_trek/trek/`.
