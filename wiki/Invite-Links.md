# Invite Links

Invite new users to register on your TREK instance, even when open registration is disabled. Invite links work by embedding a short-lived token in the registration URL.

![Invite Links](assets/UsersAndInvites.png)

## What invite links do

An invite link lets a person register a new TREK account without requiring the site to have open registration enabled. Visiting `/register?invite=<token>` pre-validates the token and switches the page to the Register form. The token's use count is incremented on successful registration, and the link stops working once the use limit is reached.

> Invite links here are for **registering new accounts**. To let people who *already* have an account join a specific trip, use the trip invite link in the trip's Share panel — see [Trip-Members-and-Sharing](Trip-Members-and-Sharing).

## Creating invite links

> **Admin:** invite link management is available in [Admin-Users-and-Invites](Admin-Users-and-Invites). Only admins can create invite links.

When creating an invite link you set two parameters:

**Max uses** — how many times the link can be used to register an account. Choose from preset buttons: **1×, 2×, 3×, 4×, 5×**, or **∞** (unlimited).

**Expiry** — how long until the link stops working. Choose from preset buttons: **1d, 3d, 7d, 14d**, or **∞** (no expiry).

**Add to trip (optional)** — bind the invite to one of your trips. When someone registers through the link, they are automatically added to that trip as a member. Leave it on **No trip** for a plain registration invite. The selector only appears when at least one trip exists.

Once created, a 32-character hexadecimal token is generated and the URL is automatically copied to your clipboard.

## Sharing the link

Copy the generated URL and send it directly to the person you want to invite. The link works in any browser without any prior authentication.

## Revoking an invite link

Delete the invite from [Admin-Users-and-Invites](Admin-Users-and-Invites). The token is invalidated immediately and visiting the URL will no longer unlock the Register form.

## Related pages

[Login-and-Registration](Login-and-Registration) · [Admin-Users-and-Invites](Admin-Users-and-Invites)
