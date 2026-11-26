# wanderer

[wanderer](https://wanderer.to) is a self-hosted trail library: you keep your hikes, rides and routes there with their GPX files, photos and descriptions. YOUYA can read your own wanderer instance and bring a trail into a trip as a [tour](Tours), ready to put on a day. Each person connects their own instance; YOUYA only reads from it and never writes anything back.

> **Admin:** wanderer is a switch inside the **Tours** addon. In **Admin → Addons**, open the Tours tile and turn on **wanderer** (*Users can connect their own wanderer instance and import its trails as tours*). Without it the connection section and the import button are not shown, and a request says *Your admin has not enabled wanderer for Tours.* See [Admin-Addons](Admin-Addons).

## Connecting your instance

1. In wanderer, open **Settings → Account → API tokens** and create a token. A wanderer token starts with `wanderer_key_`.
2. In YOUYA, open **Settings → Integrations** and find the **wanderer** section.
3. Enter the **Instance URL**, the address of your wanderer, and paste the **API token**.
4. Press **Test connection**. On success YOUYA says how many of your trails you can import, for example *Connected. You can import 12 of your trails.*
5. Press **Save**. The section then reads **Connected**.

| Field | Notes |
|---|---|
| Instance URL | The address of wanderer itself. An answer that does not come from wanderer is refused with a hint to check the address. |
| API token | Checked for the `wanderer_key_` prefix before it is sent. Stored encrypted on the server and never shown again; the field is never filled back in. |
| Allow a self-signed certificate | *Only for an instance on your own network.* Relaxes the certificate check, nothing else. |

**Changing the host clears the token.** A token belongs to the instance that issued it, so pointing the connection at a different address drops the stored token; type it in again before you test or save.

**Disconnect** removes the address and the token. Tours you already imported stay in their trips exactly as they are.

### Instances on your own network

An address in a private network is accepted with a note: *If YOUYA cannot reach it, the administrator has to allow internal networks.* YOUYA reaches wanderer through the same strict guard as Immich, AirTrail and Dawarich, so an instance on your LAN needs `ALLOW_INTERNAL_NETWORK=true` on the YOUYA server. Until then a test answers *YOUYA may not reach that address.* See [Internal-Network-Access](Internal-Network-Access).

## Importing a trail

With a connection saved, the **Tours** tab of a trip shows a **wanderer** button next to **Plan new tour** while no tour is open. It opens **Your trails**:

- **Search trails** searches your own trails. Other people's trails, public ones included, are not offered: *Only your own wanderer trails can be imported.*
- **Search this map area** limits the list to trails that reach into the part of the map you see.
- Each trail shows its grade, time, distance and ascent, and whether it is **Public** or **Private** in wanderer. One you already imported into this trip is marked **In this trip**.
- Clicked, a trail is drawn on the map with what its GPX file measures (**From the GPX file**) and its description. **Open in wanderer** opens it on your instance.
- **Import into trip** copies it into the trip as a tour of its own, marked **wanderer**.

The import is a snapshot: *later changes in wanderer leave it as it is.* For a trail already in the trip the button reads **Open the tour**; when the trail changed in wanderer since, the preview says what changed (name, description, route) and **Import as new version** adds the new version beside the old one. A trail without a track or route cannot be imported, and neither can a trail file larger than 10 MB. Searching and importing need a connection.

More on working with the imported tour is on [Tours](Tours#importing-a-trail-from-wanderer).

## Checking the source of a tour

An imported tour's **Origin** names wanderer as its source, with the date wanderer gave as its last change. **Check source** asks wanderer whether the trail changed since the import. Nothing in the trip changes:

| Result | Meaning |
|---|---|
| **Unchanged since the import** | Nothing to do. |
| **Changed on wanderer** | The name, description or route differ. **Import as new snapshot** brings in the current version beside the tour. |
| **No longer available** | The trail is gone or can no longer be read with your connection. The tour stays as it was imported. |
| **No wanderer connection** | Connect your wanderer under **Settings → Integrations** to check. |
| **Another wanderer is connected** | Your connection points to a different instance than the one the tour came from. |
| **Cannot compare** | The import carries nothing to compare against. |

## The background check

**Check my trails for changes** in the wanderer section sends you a notification when a trail you imported may have changed. It is off by default, and dimmed until you connect.

At most once a day, YOUYA reads the short record of each trail you imported, never its GPX file. It only tells you: whether a change comes in is up to you, through the tour's source check. What it can say:

- **May have changed**: wanderer changed the trail's time stamp. Only the source check shows whether its content differs.
- **Changed**: wanderer's record shows another name or description.
- **Not checkable**: YOUYA could not judge this trail, for example because it is out of reach.

The row shows when YOUYA last looked and how many hints are open; **Hints** opens **Hints on your trails**, where **Open the tour** goes to each one. The hints arrive as notifications too, under the event *wanderer: hints on your trails*, with a **View Tour** button; see [Notifications](Notifications).

When wanderer does not answer, the check waits longer after each failure and the row says **Paused until** a time. When wanderer refuses the token, the row reads **Token refused** and the check resumes once a connection test passes or a new token is saved.

## What YOUYA keeps

- Your instance address, the encrypted token and the switches. The token is encrypted with the server's encryption key, and the rotation script does not carry it over: after a key rotation, enter the token again. See [Encryption-Key-Rotation](Encryption-Key-Rotation).
- The tours you imported, as ordinary tours of the trip, with where they came from.
- For the background check, when it last looked and the open hints.

Connecting, changing and removing the connection, and switching the background check on or off, are recorded in the [Audit-Log](Audit-Log).

## See also

- [Tours](Tours)
- [Internal-Network-Access](Internal-Network-Access)
- [Notifications](Notifications)
- [Admin-Addons](Admin-Addons)
- [Dawarich](Dawarich)
