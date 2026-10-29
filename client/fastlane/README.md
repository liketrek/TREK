# Store listings

The texts, review notes, policy drafts and images for the App Store and Google
Play listings of **TREK Travel Planner** (`com.liketrek.trek`). The folder
layout is the one fastlane's `deliver` (App Store) and `supply` (Google Play)
read, so the listings can be uploaded from here; the builds themselves come from
`.github/workflows/native-release.yml`.

| Path | What |
| --- | --- |
| `metadata/en-US/` | App Store texts: name, subtitle, keywords, description, URLs, release notes |
| `metadata/review_information/` | App Review notes and contact. Placeholders only: the review server, accounts and passwords are entered in App Store Connect, never committed |
| `metadata/android/en-US/` | Google Play texts, the changelog, and `images/` (feature graphic, icon, screenshots) |
| `metadata/privacy-policy.md`, `metadata/delete-account.md` | Drafts of the pages published at https://liketrek.com/privacy and https://liketrek.com/delete-account |
| `screenshots/en-US/` | App Store screenshots, iPhone 6.9" and iPad 13" |

`npm run store:check` (in `client/`) checks every text against its store limit
and every image for its size and for an alpha channel, which both stores refuse.
CI runs it in the `metadata` job of `native.yml`.

## Screenshots

The screenshots are not committed yet: they are captured from a running TREK
with the seeded demo trip, which is a Playwright run and does not run in CI.
To make them, from `client/`:

1. `npx playwright install chromium` (once).
2. `npm run store:shots` starts its own backend on a throwaway database and the
   Vite dev server, seeds the demo trip (the same one the wiki pictures show)
   and captures six screens at five device sizes into `e2e/.tmp/store/`.
3. `npm run store:promote` checks each capture's size, flattens it onto the app
   background (no alpha) and copies it into `screenshots/en-US/` (iPhone 6.9"
   1320x2868, iPad 13" 2064x2752) and
   `metadata/android/en-US/images/{phone,sevenInch,tenInch}Screenshots/`
   (1080x1920, 1620x2880, 1920x1080).
4. `npm run store:graphic` rebuilds the feature graphic, now with a crop of the
   first phone screenshot, and the 512 px icon.
5. `npm run store:check`, look through the pictures, commit.

The capture lives in `e2e/store/capture.store.ts`; the device sizes and screens
are listed at its top.

## Uploading the listing

With fastlane installed and the App Store Connect API key and Play service
account at hand (the same ones the release workflow uses, see
`wiki/Native-Apps.md`), from `client/`:

```bash
fastlane deliver --skip_binary_upload --metadata_path fastlane/metadata --screenshots_path fastlane/screenshots
fastlane supply --skip_upload_apk --skip_upload_aab --metadata_path fastlane/metadata/android --package_name com.liketrek.trek
```

Both also work from the consoles by hand; the files here are the source of
truth for what the listings say.
