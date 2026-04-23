# Home Assistant add-on for TREK — thin wrapper over the upstream image.
#
# The base image already ships the full TREK server, client build, dumb-init,
# and su-exec. The wrapper only adds an entrypoint shim that translates
# /data/options.json (written by HA Supervisor) into environment variables
# and re-points TREK's data directories onto the HA persistent /data volume.
ARG BUILD_FROM
FROM ${BUILD_FROM}

COPY run.sh /ha-run.sh
RUN chmod +x /ha-run.sh

ENTRYPOINT ["dumb-init", "--"]
CMD ["/ha-run.sh"]
