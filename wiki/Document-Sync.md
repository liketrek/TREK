# Document Sync

A trip can keep its documents in step with a self-hosted document store: **Paperless-ngx**, **Papra**, **Nextcloud**, **OpenCloud** or a **Synology** NAS. What someone uploads in TREK appears in the store, and what someone files in the store appears in TREK.

Three rules shape everything else on this page:

- **The connection belongs to the trip, not to a person.** The trip owner connects the store once, TREK talks to it under that one account, and TREK's own membership decides who sees what. Every member sees the same documents, and the store never learns who is on the trip.
- **TREK keeps its own copy of every document.** A synced document is an ordinary file in the trip's [Documents-and-Files](Documents-and-Files) manager, so preview, download, trash, offline use, [PDF-Export](PDF-Export) and [Backups](Backups) work as before, and a store that is down does not empty a trip that starts tomorrow.
- **Nothing is deleted on the other side on its own.** A document removed in the store is flagged in TREK and waits for a person. A document deleted in TREK is removed in the store only when the binding is set to move it to the store's recycle bin.

> **Admin:** Each store is switched on separately under the **Documents** addon in **Admin → Addons**. They ship switched off. A store on your local network also needs `ALLOW_INTERNAL_NETWORK=true` on the TREK server. See [Admin-Addons](Admin-Addons) and [Internal-Network-Access](Internal-Network-Access).

## What each store syncs

| Store | A trip is bound to | Shown in the list as |
|---|---|---|
| Paperless-ngx | a tag | *Files by tag* |
| Papra | a tag inside one organisation | *Files by tag, inside an organisation* |
| Nextcloud | a folder | *Files in a folder* |
| OpenCloud | a space | *Files in a space* |
| Synology Drive | a folder inside a shared folder, reached through File Station | *Files in a folder on the NAS* |

Only what is inside that tag, folder or space is synced. Everything else in the store stays out of TREK.

On the TREK side, a binding covers all of the trip's documents in the file manager. Files attached to a chat message or to a collab note are left out: they belong to a conversation, not to the trip's paperwork.

## Switching stores on

An administrator switches each store on under **Admin → Addons**. The stores are rows underneath the **Documents** addon, on the desktop and on the phone, and they only show while **Documents** itself is on: **Paperless-ngx**, **Papra**, **Nextcloud**, **OpenCloud** and **Synology Drive**.

- **All five ship switched off.** The admin decides only which stores may be offered. The credentials are entered per trip, in the trip itself, never in the admin panel.
- **Switching a store off pauses** every binding that uses it, without touching the binding or its documents. The binding card then reads *Paused: an administrator has switched this provider off. Syncing resumes once it is back on.* and resumes where it stopped once the store is back on.
- **Switching the Documents addon off switches every store off** as well. When **Documents** comes back, each store has to be switched on again.
- A store cannot be switched on while **Documents** is off. The server answers *Enable the Documents addon first*.

## Binding a trip

Open the trip's **Files** tab. When a store is available, a **Document sync** button sits next to **Trash** in the toolbar; on the phone it sits between **Upload** and the trash button at the top of the Files tab. The button only shows where there is something behind it: on a trip that is already bound, for every member, and on any trip for the people who may bind it while at least one store is switched on.

**Who may bind a trip:** the trip owner, or an instance administrator. The credential a binding stores usually reaches that person's entire archive, so no other member can set one up, point it elsewhere or change its settings. Every member can open the dialog, see where the trip's documents go and press **Sync now**.

1. Open **Document sync**. Under **Connect a provider**, pick the store.
2. Fill in the form. The fields per store are listed below; optional ones are marked as such.
3. Press **Test connection**. On success the footer reads *Reached it, signed in as* followed by the account name. On failure it names the reason; see [Troubleshooting](#troubleshooting).
4. Press **Connect**.
5. TREK asks *Where should this trip live in* followed by the store's name. Either create a new tag, folder or space under **Make a new one** (the name is prefilled from the trip's title plus its id, for example `japan-2026-42`) and press **Create**, or pick an existing one under **Or use one you already have**.

The binding starts with both directions on, **Keep both copies** for deletions, **Ask me** for conflicts and **Sync automatically** on, and TREK runs it once straight away. A trip can be bound to several stores, one binding per store; each of them holds a full copy of the trip's documents. With a store bound, **Add another** lists the remaining ones.

Things worth knowing before you bind:

- **One account per store and trip.** The binding runs under the account of the person who saved the connection, and only while that person is the trip owner or a member of the trip. When they leave the trip the binding stops, so an ex-member's credential is never used again. An instance administrator who is not on the trip can set a binding up, but it stops at the next scheduled check for the same reason.
- **Documents that arrive from the store** are listed in TREK as uploaded by that person, since nobody in TREK uploaded them.
- **The credentials are stored encrypted** with the trip and never sent back to a browser. Once a trip is connected to a store, picking that store again (after **Disconnect**, for example) goes straight to the folder picker with the stored credentials; the form is not shown again.
- **Bind a new, empty tag, folder or space** rather than one that already holds this trip's documents from an earlier binding. A new binding knows nothing about earlier pairings, so it treats both sides as new: every document in the store is downloaded into TREK as a further copy, and TREK's documents are offered to the store again, which gives second copies in Paperless-ngx and failed uploads under **Needs a look** where a file name is already taken.

## Setting up each store

Every connection form ends with **Accept a self-signed certificate**, off by default: *For an instance on your own network with a self-signed certificate.* It relaxes the certificate check only; the address rules in [Stores on your own network](#stores-on-your-own-network) still apply.

### Paperless-ngx

*TREK files this trip under its own tag and never touches the rest of your archive.*

| Field | Notes |
|---|---|
| Address | The Paperless-ngx address, for example `https://paperless.example.com`. A trailing `/api` is tolerated. |
| API token | *Create one under My Profile in Paperless. It carries that account's full rights.* |

- **Scope:** a tag. The picker lists your tags; **Make a new one** creates a tag, and refuses a name that already exists rather than taking over a tag that may belong to someone else's filing. Pick an existing tag from the list instead.
- **Custom field:** a document TREK uploads carries the trip's tag and a custom field named `trek_trip_id`, holding `trek-trip-` plus the trip's id. TREK creates the field on the first upload. It is a breadcrumb for whoever tidies the archive later; TREK does not filter on it. Removing the tag from a document takes it out of the trip, whatever the field says.
- **Names:** Paperless-ngx keeps a title rather than a file name, so a document arrives in TREK as its title plus the extension of the original file. TREK downloads the original file, not the archived PDF Paperless-ngx makes from it.
- **File types:** Paperless-ngx takes PDF, JPEG, PNG, TIFF, GIF, BMP, WebP, HEIC and HEIF images, plain text, CSV and email (`.eml`) files. Word, Excel, PowerPoint, OpenDocument and RTF files only go through on an instance that runs Tika and Gotenberg; without them Paperless-ngx refuses them and TREK lists them as *Type not allowed*.
- **Instant updates:** when the token's user may add workflows, TREK creates a workflow named `TREK document sync (link n)` that calls TREK whenever a document with the trip's tag is added or updated. **Disconnect** deletes it again. Without that permission the binding runs on the timer, unless a user who may add workflows pastes the binding's **Instant updates** address into a workflow by hand. See [When TREK checks](#when-trek-checks).
- **Recycle bin:** a document TREK removes goes to the Paperless-ngx trash.
- **Version:** Paperless-ngx 3 or newer.

### Papra

*Pick the organisation this trip belongs to. TREK files it under its own tag inside it.*

| Field | Notes |
|---|---|
| Address | The Papra address, for example `https://papra.example.com`. |
| API key | Starts with `ppapi_`. *Create one under API keys in Papra. Papra keys always reach every organisation you belong to.* |
| Organisation ID | *The org_… id from the Papra address bar.* It is `org_` followed by 24 lowercase letters and digits. |

- **Scope:** a tag inside that organisation. **Make a new one** creates the tag, and refuses a name that already exists.
- **Key permissions:** a key limited in Papra must still be allowed to work with the organisation's documents and tags. Papra answers a missing permission exactly like a wrong key, so TREK can only report *The credentials were refused.*
- **Duplicates:** Papra keeps one document for identical bytes, so of two identical files in TREK only the first reaches Papra; the second is listed under **Needs a look**.
- **Upload limit:** Papra's own upload limit is an instance setting TREK cannot read. A file over it is listed as *Too large*.
- **Instant updates:** by hand. Papra does not let an API key manage webhooks, so TREK cannot subscribe itself; paste the binding's **Instant updates** address into a webhook in Papra, and the binding runs on the timer until then. See [When TREK checks](#when-trek-checks).
- **Recycle bin:** a document TREK removes goes to Papra's trash.

### Nextcloud

*Use an app password, not your account password: it survives two-factor and you can revoke it on its own.*

| Field | Notes |
|---|---|
| Address | The Nextcloud address, for example `https://cloud.example.com`. |
| Username | *Your Nextcloud login name, not your email address.* |
| App password | *Settings, Security, Create new app password. Never your account password.* |
| Base folder | Optional. *Where TREK looks for trip folders.* Defaults to `/TREK`. |

- **Scope:** a folder directly under the base folder. **Make a new one** creates it there, and creates the base folder too if it does not exist yet. A folder of that name that already exists is refused; pick it from the list instead.
- **Only the top level** of the folder is synced. Sub-folders inside it are left alone, so moving a file into one takes it out of the trip.
- **Instant updates:** when the account may manage webhooks (an administrator account on an instance with the `webhook_listeners` app), TREK subscribes itself to files being created, written, deleted and renamed. Otherwise the binding runs on the timer, unless a Nextcloud administrator registers the binding's **Instant updates** address as a listener by hand.
- **Recycle bin:** a document TREK removes goes to Nextcloud's *Deleted files*. **On an instance without the Deleted files app, it is deleted for good.**

### OpenCloud

*TREK gets its own space for this trip, separate from everything else.*

| Field | Notes |
|---|---|
| Address | The OpenCloud address, for example `https://opencloud.example.com`. |
| Username | Your OpenCloud username. |
| App token | *Created under app tokens in OpenCloud.* |

- **Scope:** a space. The picker lists the spaces the account can reach; **Make a new one** creates a new space, which needs an account OpenCloud allows to create spaces.
- **Only the top level** of the space is synced. Sub-folders inside it are left alone.
- **Instant updates:** none. OpenCloud has no subscription API TREK could use, so the binding runs on the timer.
- **Recycle bin:** a document TREK removes goes to the space's trash.

### Synology Drive

*Best a DSM account that only reaches the shared folder this trip should use.*

| Field | Notes |
|---|---|
| Address | The DSM address. *Include the port, for example https://nas.example.com:5001* |
| Username | *Best a dedicated DSM account with access to just this shared folder.* |
| Password | The DSM password of that account. DSM has no app tokens, so this is the real account. |
| Two-factor code | Optional. *Only needed once, if the account uses two-factor authentication.* |
| Base folder | Optional. Defaults to `/trek`. |

- **File Station:** TREK talks to the NAS through the File Station API, so the account must be allowed to use File Station. If it is not, **Test connection** fails even though the login worked.
- **Scope:** a folder. The picker lists every shared folder the account can see, plus the folders directly under the base folder. DSM paths start with the name of a shared folder, so the default `/trek` only exists if there is a shared folder called `trek`; set **Base folder** to a path inside an existing shared folder, such as `/documents/trek`, or bind a shared folder directly. **Make a new one** can create folders inside a shared folder, never a shared folder itself.
- **Sub-folders** inside the bound folder are included.
- **Renames** in File Station come through even though DSM has no file ids: TREK recognises the renamed or moved file by its size and modification time.
- **Two-factor accounts:** the code is used once. DSM then hands TREK a trusted-device token, which TREK keeps encrypted with the trip's Synology connection, so it survives a restart of TREK and no new code is needed afterwards. TREK appears as **TREK** among the account's trusted devices in DSM.
- **Failed logins:** DSM blocks an address after a few failed logins. TREK does not retry a refused password for a minute, and waits fifteen minutes when DSM has already blocked it.
- **Recycle bin:** File Station's API only deletes permanently, so a document TREK removes is moved into a `.trek-trash` folder inside the bound folder instead, where anyone can take it back out in File Station. A file of the same name already in there is renamed with a timestamp rather than overwritten. TREK never lists the `.trek-trash` folder.
- **Instant updates:** none. File Station has no change feed, so the binding runs on the timer.

## The binding card

Once bound, the dialog lists the trip's stores under **This trip** and shows the selected one as a card:

- **The store's name** with a state dot, and **Paused** while **Sync automatically** is off.
- **Where and when:** the bound tag, folder or space, and the last run.
- **A notice line** when the binding needs attention, for example *Failed · The provider could not be reached.*
- **The flow bar:** TREK on one side, the store on the other, each with the number of documents it holds, and two lanes between them, **Out to the store** and **In from the store**. The trip owner switches a direction off by clicking its lane; the last lane cannot be switched off. Other members see the same bar without the switch.
- **Sync now**, for every member, and **Disconnect** for the trip owner.

**Settings**, folded away under the card, holds what the owner sets once:

| Setting | Options |
|---|---|
| When a document is deleted | **Keep both copies** (default) or **Move to recycle bin**. *What happens to the copy on the other side.* |
| When both sides changed | **Ask me** (default), **Keep the TREK copy** or **Keep the store's copy**. *Which copy survives when a document was edited in both places.* |
| Sync automatically | On by default. Off leaves the binding to **Sync now** alone. |
| Instant updates | An address for the store to call. See [When TREK checks](#when-trek-checks). |

On the phone the card opens as a sheet. The first three settings are buttons there that step through their options with each tap; the **Instant updates** address is only shown on the desktop.

**Disconnect** ends the binding and keeps every document where it is, on both sides: *Documents stay in TREK and at the store. Only the pairing between them goes.* Both the desktop and the phone ask before they disconnect. A workflow or webhook subscription TREK created for the binding is removed with it.

## How changes travel

### New documents

- **Uploaded in TREK:** goes to the store on the next run, into the bound tag, folder or space.
- **Filed in the store:** downloaded into TREK on the next run as an ordinary trip document, provided TREK accepts its type and size (see [File types and sizes](#file-types-and-sizes)).

TREK itself has no way to rename a document or replace its content, so what travels from TREK to the store is new documents and deletions.

### Changes in the store

A document whose content changed in the store is downloaded again as a new document, and the copy it replaces goes to TREK's trash. Links the old copy had to bookings, places or expenses stay with the old copy.

**Renames in the store come through.** The TREK copy takes the new name, on every store. On Paperless-ngx and Papra the listing carries a checksum of the file, so an edit that leaves the file alone, such as a rename, a new tag or a new correspondent, is not a new document either: the copy is downloaded again only when its content changed.

### Deletions

**Deleted in the store:** TREK keeps its copy and flags it as *Missing at the provider* under **Needs a look**. Nothing is removed in TREK.

**Deleted in TREK:** the file goes to TREK's trash as usual, and the binding's **When a document is deleted** rule decides what happens in the store:

| Rule | In the store |
|---|---|
| **Keep both copies** | The store's copy stays. TREK remembers the pairing, so it is not downloaded again. |
| **Move to recycle bin** | The store's copy goes to the store's bin: the Paperless-ngx trash, Papra's trash, Nextcloud's *Deleted files*, the OpenCloud space's trash, or the `.trek-trash` folder on Synology. |

The rule is applied once, at the run that notices the deletion. Changing it later does not reach back to documents deleted before. Emptying TREK's trash or deleting a file there permanently counts as a deletion too, and the store's copy is not downloaded again afterwards.

### Restoring from TREK's trash

A document taken back out of TREK's trash syncs again, in one of three ways:

- **The store's copy is still there:** the pairing counts again, and an edit made in the store in the meantime comes down.
- **TREK had moved the store's copy to the bin:** the document goes up again as a new one.
- **Someone else deleted the store's copy:** TREK does not upload it over their deletion. It flags it as *Missing at the provider* instead.

### Conflicts

When a document changed in both places since the last run, **When both sides changed** decides. **Keep the TREK copy** and **Keep the store's copy** settle it on their own, as long as the binding still moves documents in the winner's direction; when that lane is switched off, the conflict waits as with **Ask me**.

With **Ask me**, the document waits under **Needs a look** as a *Conflict*. **Resolve** opens it with three choices: **Keep the TREK version**, **Keep the provider version**, or **Keep both**, which keeps the store's copy as a second document in TREK so nothing is lost. The trip owner or an instance administrator decides.

### The mass-delete guard

An unmounted share, a revoked share or an expired token all answer the same way: a listing far shorter than the last one. Read literally, that would flag a whole trip as deleted.

So once a binding knows **five or more** documents in the store, a run that finds **more than 40 percent** of them gone at once is thrown away without acting on any of it, not even the parts that look fine. The binding shows *Partly synced · Most documents vanished at once, so nothing was changed. Check that the folder is still mounted.* and waits until the documents are back, or until the trip is bound again. Fewer missing documents are flagged one by one as *Missing at the provider*. Deleting documents in TREK never trips the guard.

## Needs a look

The dialog lists what a person has to decide about under **Needs a look**, with a count per kind. On the phone the sheet shows conflicts; the full list is in the desktop dialog, and assistants read it through MCP.

| Shown as | What it says | What to do |
|---|---|---|
| **Conflict** | *Changed in both places. Pick which one to keep.* | Press **Resolve** and pick a side. |
| **Missing at the provider** | *Gone from the store. The TREK copy is still here.* | Put the document back in the store, for example from its recycle bin, if it went by mistake. The flag clears on the first run that finds it again. |
| **Type not allowed** | *This file type is not allowed here.* | TREK refused an incoming file, or the store refused an outgoing one. See [File types and sizes](#file-types-and-sizes). |
| **Too large** | *Bigger than the limit.* | The file is over TREK's limit or over the store's. |
| **Error** | *The transfer did not go through.* | TREK tries again after 30 seconds, 2 minutes, 10 minutes and an hour. After six failed attempts in a row the document waits; **Sync now** gives it another go. |

## File types and sizes

**Into TREK**, a document from the store goes through the same checks as an upload in the file manager:

- **The size limit** of 50 MB per file. A larger document is listed as *Too large*.
- **The blocked types**, which are always refused (HTML, SVG, XML, scripts and executables; the full list is in [Documents-and-Files](Documents-and-Files)).
- **The allowed types** an admin sets under **Admin → Settings → Allowed File Types**. A file without an extension is refused too.

A document refused for its type stays refused until it changes in the store. Widening the allowed types does not fetch it again on its own.

**Into the store**, the store's own rules apply: the Paperless-ngx type list and Papra's upload limit (see above). A store that is out of space reports *The provider is out of space.*

## When TREK checks

A binding runs **straight after it is bound**, and from then on **on a timer, every five minutes** by default. Each pass takes up to 20 bindings, the ones waiting longest first, and each run moves at most 25 documents; the rest follow on the next run, and the binding shows *Partly synced* until then.

- **Sync now** runs a binding at once. It also gives documents that stopped retrying another attempt.
- **Sync automatically** off leaves a binding to **Sync now** alone.
- **A failing binding backs off:** the next attempt waits 1, 5, 15, 30, 60 and then 120 minutes. After ten failures in a row the timer stops trying until a run started with **Sync now** succeeds.

### Instant updates

Where a store can tell TREK that something changed, it calls the binding's own address, and TREK runs the binding soon after instead of waiting for the timer. A call only ever means "look now": TREK waits five seconds so a burst of calls ends up as one run, and never reads anything from what the store sent. The timer keeps running either way, because no store reports every change: Paperless-ngx, for example, sends nothing when a document is deleted.

| Store | Instant updates |
|---|---|
| Paperless-ngx | TREK creates the workflow itself when the token's user may add workflows. Otherwise a Paperless-ngx user who may add workflows can paste the **Instant updates** address into a workflow's webhook action by hand. |
| Nextcloud | TREK subscribes itself when the account may manage webhooks (an administrator account with the `webhook_listeners` app). Where it may not, a Nextcloud administrator can register the **Instant updates** address as a listener by hand. Nextcloud sends these from its background jobs, so they arrive as promptly as its cron runs, and a TREK on a private address is only called when Nextcloud's `allow_local_remote_servers` is on. |
| Papra | Paste the **Instant updates** address into a webhook in Papra by hand. Papra's webhook API is closed to API keys, so TREK cannot subscribe itself. |
| OpenCloud, Synology | Timer only. Neither can call TREK. |

- **The address TREK registers** is built from the address the person binding the trip used to open TREK at that moment, including what the reverse proxy passes in `X-Forwarded-Host` and `X-Forwarded-Proto`. Bind the trip through the address the store can reach TREK under. Behind a proxy that passes no host, no address is registered and the timer carries the binding.
- **Paperless-ngx refuses a callback address longer than 256 characters.** The binding then runs on the timer.
- **The address is the key.** A call to the **Instant updates** address under **Settings** starts a run on its own, so an address pasted into a store by hand works for Papra, for a Nextcloud where TREK could not subscribe itself and for a Paperless-ngx whose token may not add workflows. Where TREK registered the subscription itself, it also hands over a secret and only acts on a call that carries it; the secret is not shown anywhere, so pasting that binding's address somewhere else by hand adds nothing. For OpenCloud and Synology there is nowhere to paste it, and once **Test connection** on the saved connection has reported that, their bindings show no address at all.

### Tuning

There is no environment variable or admin screen for the timer. Two rows in the `app_settings` table are read on every pass, so a change needs no restart:

| Key | Effect |
|---|---|
| `docsync_poll_interval_seconds` | Seconds between passes. Default `300`, kept between `60` and `3600`. |
| `docsync_sync_enabled` | `false` stops the timer and ignores store calls for every binding on the instance. **Sync now** still works. |

## Stores on your own network

TREK reaches every store through its strict outbound guard (see [Internal-Network-Access](Internal-Network-Access)):

- **A store on a private address needs `ALLOW_INTERNAL_NETWORK=true`** on the TREK server. That includes a store in another container on the same Docker network (the container name resolves to a private address), a Tailscale address (`100.64.0.0/10`) and a `.local` name.
- **Loopback is never reached**, whatever the flag says: an address such as `localhost` or `127.0.0.1` is refused. Use the host's LAN address or the container name instead.
- A private address is saved even while the flag is off, but every request to it is refused with *That address is not allowed.* **Test connection** shows the same message for a name that does not resolve at all.
- A store with a self-signed certificate needs **Accept a self-signed certificate** in its connection form.

## MCP tools

With the [MCP](MCP-Overview) addon on as well, an assistant can see where a trip's documents live and start a sync. The tools exist only while the **Documents** addon is on, and any member of the trip may use them. Connecting a store or changing a binding is deliberately not possible through MCP: it hands over a credential to someone's document archive, and that stays with the trip owner in the file manager.

| Tool | What it does | Scope |
|---|---|---|
| `get_trip_document_sync` | Shows the trip's bindings: the store, the bound tag, folder or space, the last run and its state, and how many documents are synced, waiting, in conflict or missing in the store. | `files:read` |
| `list_trip_document_sync_issues` | Lists what **Needs a look** lists: conflicts, refused types and sizes, failed transfers and documents gone from the store. Empty when everything is in step. | `files:read` |
| `sync_trip_documents` | Runs every binding of the trip now and reports what came in, what went out and what is in conflict. `full: true` compares both sides in full. A binding whose owner left the trip, or whose store an admin switched off, is reported and not run. | `files:write` |

See [MCP-Addon-Tools](MCP-Addon-Tools) and [MCP-Scopes](MCP-Scopes).

## Which versions work

- **Paperless-ngx 3 and newer.** TREK pins the Paperless-ngx API version it was written against, so a routine upgrade of Paperless-ngx does not change the answers under it.
- The integration was checked against **Paperless-ngx 3.1.3**, **Papra 26.6.2**, **Nextcloud 31.0.14** and **OpenCloud 8.0.1**.
- **Synology** follows Synology's File Station API guide and was checked against a stand-in for it. It has not yet been confirmed on real DSM hardware.

## Troubleshooting

### Binding states

| State | What it means |
|---|---|
| **Not synced yet** | Bound, first run still to come. |
| **In sync** | The last run finished with nothing left over. |
| **Partly synced** | The last run left something undone: more than 25 documents to move, documents listed under **Needs a look**, or the mass-delete guard. The notice line names which. |
| **Failed** | The store could not be used. The notice line names the reason; TREK retries with the backoff described above. |
| **Sign in again** | The store refused the stored credential while TREK was listing documents. More often a refused credential shows as **Failed** with *The credentials were refused.* The usual causes: a revoked Paperless-ngx token or Papra key, a deleted app password or app token, a changed DSM password, or TREK removed from the account's trusted devices in DSM. If the credential still exists in the store, **Sync now** tries again. A replaced credential goes in through **Reconnect**, which the trip owner finds next to the notice on the binding in both states: it opens the store's connection form again, and the binding runs as soon as the new credential is saved. **Add another** in the sidebar still lists only the stores the trip is not connected to. |
| **Folder is gone** | The bound tag, folder or space no longer exists. TREK does not recreate it. **Disconnect**, then pick the store again under **Add another** and bind a new, empty one; TREK's documents go up into it. |
| **Owner left the trip** | The person whose account the store was connected with is no longer on the trip. The binding stopped and **Sync now** is refused, also for a paused binding. Documents stay where they are on both sides. Once that person is back on the trip, switching **Sync automatically** on lets it run again; until then the switch stays off. |

### Messages

| Message | What it usually means |
|---|---|
| *No document providers are available* | No store is switched on. An admin switches them on under **Admin → Addons → Documents**. |
| *The provider could not be reached.* | Wrong address, the store is down, or the TREK server has no route to it. An `https://` address on a port that only speaks plain HTTP lands here too. |
| *The certificate was rejected. Allow self-signed certificates if you trust this instance.* | Turn on **Accept a self-signed certificate**. |
| *The credentials were refused.* | Wrong token, key, app password or password. On Nextcloud, check that it is an app password and not the account password. On Papra, check the key's permissions. |
| *This account is not allowed to do that.* | The account lacks a permission in the store, for example creating a space in OpenCloud or reaching a shared folder on the NAS. |
| *Not found on the provider.* | On Nextcloud during **Test connection**, the username is not the login name. Otherwise the document or folder is gone. |
| *The connected folder no longer exists.* | See **Folder is gone** above. On Synology, **Create** answers the same when **Base folder** does not start with an existing shared folder. |
| *The provider is rate limiting us. TREK will try again later.* | The store asked TREK to slow down, or DSM blocked TREK's address after failed logins. |
| *The file is larger than the provider accepts.* | The store refused the upload for its size. |
| *The provider does not accept this file type.* | The store refused the upload for its type. |
| *The provider is out of space.* | The account's quota in the store is full. |
| *The document changed on both sides.* | A conflict. Nextcloud's **Create** also answers this when a folder of that name already exists; pick it from the list instead. |
| *The transfer did not arrive intact.* | The store stored something different from what TREK sent. TREK tries again. |
| *The provider reported an error.* | The store answered with an error TREK has no closer word for. On Synology, **Test connection** also answers this when the account may not use File Station, and **Create** when DSM will not accept the folder name. |
| *The provider took too long to answer.* | The store accepted the request but did not answer in time. |
| *That address is not allowed.* | The address points at loopback or link-local, does not resolve, or is private while `ALLOW_INTERNAL_NETWORK` is off. See [Stores on your own network](#stores-on-your-own-network). |
| *Most documents vanished at once, so nothing was changed. Check that the folder is still mounted.* | The mass-delete guard. See above. |
| *Paused: an administrator has switched this provider off. Syncing resumes once it is back on.* | The store, or the whole **Documents** addon, is switched off. Nothing about the binding changed. |
| *This provider is not available on this instance.* | The store is switched on but this TREK version has no adapter for it. |
| *Something went wrong.* | Anything else, including **Sync now** on a binding whose owner left the trip. |

## See also

- [Documents and Files](Documents-and-Files): the file manager every synced document lands in
- [Internal Network Access](Internal-Network-Access): reaching a store on your LAN
- [Admin: Addons](Admin-Addons): switching the stores on
- [MCP Addon Tools](MCP-Addon-Tools): the three document sync tools
- [Trip Members and Sharing](Trip-Members-and-Sharing): who is on a trip
