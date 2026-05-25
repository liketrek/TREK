# Install: Portainer

Install TREK on Portainer using a Stack (Docker Compose).

## Prerequisite

Portainer must be installed and connected to your Docker environment. Use **Stacks** — it supports Docker Compose and gives you the full compose syntax including environment variables, volumes, and restart policies.

## Create a Stack

![Stacks page with arrows pointing to the Stacks menu item and the Add stack button](assets/portainer-add-stack.png)

1. In Portainer, go to **Stacks → Add stack**.
2. Give the stack a name (e.g. `trek`).
3. Select **Web editor** and paste the compose file from [docker-compose.yml](https://github.com/mauriceboe/TREK/blob/main/docker-compose.yml).

![Web editor with the docker-compose content pasted in](assets/portainer-stack-save.png)

4. Fill in the environment variables at the bottom of the page.

![Environment variables section with key/value fields filled in](assets/portainer-environment-variable.png)

5. Click **Deploy the stack**.

![Deploy the stack button highlighted](assets/portainer-deploy-stack.png)

## Compose Content

See https://github.com/mauriceboe/TREK/blob/main/docker-compose.yml

Set at minimum `ENCRYPTION_KEY`, `TZ`, and `APP_URL` in the **Environment variables** section of the stack editor. Generate an encryption key with:

```bash
openssl rand -hex 32
```

## Image Tags

Three tag strategies are available:

| Tag | Example | Behavior |
|---|---|---|
| `latest` | `mauriceboe/trek:latest` | Always the newest release across all major versions |
| Major version | `mauriceboe/trek:3` | Latest release pinned to that major version |
| Full version | `mauriceboe/trek:3.0.15` | Exact release; never changes |

Use `latest` or a major-version tag (e.g. `3`) if you want automatic updates on redeploy. Use a full version tag (e.g. `3.0.15`) if you want explicit control over which release runs.

## Updating

How you update depends on the tag you chose:

**`latest` or major-version tag** — In Portainer, open the stack, click **Redeploy**, enable the **Re-pull image and redeploy** switch, then confirm. Portainer will pull the newest matching image and recreate the container.

![Re-pull image and redeploy switch ticked, with arrows pointing to the switch and the Update button](assets/portainer-force-pull.png)

**Pinned full-version tag** — Edit the stack, change the tag in the `image:` line (e.g. `3.0.15` → `3.0.16`), then click **Update the stack**. No need to toggle the re-pull switch — a tag change forces a fresh pull.

![Edit stack page with an arrow pointing to the image tag in the compose editor](assets/portainer-update-version.png)

![Edit stack page with an arrow pointing to the Update the stack button](assets/portainer-update-stack.png)

> Back up your data before any update. Go to **Admin Panel → Backups** or copy your `./data` and `./uploads` directories. See [Backups](Backups).

## Volumes

| Stack-relative path | Container path | Contents |
|---|---|---|
| `./data` | `/app/data` | SQLite database, logs, encryption key |
| `./uploads` | `/app/uploads` | Uploaded files (photos, documents, covers, avatars) |

Portainer resolves `./` relative to the stack's working directory. Confirm the paths under **Stack details** after deploying.

### Named Volumes

You can use Docker named volumes instead of bind mounts. Named volumes are fully managed by Docker and not tied to a host path — a good fit for Portainer where the working directory can vary. See the [Docker Compose volumes reference](https://docs.docker.com/reference/compose-file/volumes/) for all options.

Replace the `volumes:` block in the service and add a top-level declaration:

```yaml
services:
  app:
    # ... (rest of service config unchanged)
    volumes:
      - trek_data:/app/data
      - trek_uploads:/app/uploads

volumes:
  trek_data:
  trek_uploads:
```

Portainer lists named volumes under **Volumes** in the sidebar, where you can inspect or back them up.

## Next Steps

- [Environment-Variables](Environment-Variables) — full variable reference
- [Reverse-Proxy](Reverse-Proxy) — HTTPS configuration
- [Updating](Updating) — update strategies across all install methods
