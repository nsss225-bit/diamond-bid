# Diamond Bid for iPhone, iPad and Android

The store apps are the web game (`../web`) wrapped with [Capacitor](https://capacitorjs.com). Every change to the web game reaches both apps with the next build.

- **Phones:** portrait only. **Tablets:** any orientation. In landscape, scores and controls sit in a side panel and 4 players sit around the table.
- **App icon and launch screen:** made from the in-game logo (`assets/`). After changing those images, run `npm run assets` again.
- **Online play and the shared daily leaderboard:** they use claude.ai's online service, so the apps show "coming soon" for them. Everything else works offline: bots, pass and play, the daily challenge, coins and languages.

## The free home-screen web app

`npm run web-app` also builds `../docs/play`: the game as an installable web app on GitHub Pages (https://nsss225-bit.github.io/diamond-bid/play/), with an icon, offline play (`sw.js`) and the same layout as the store apps. On iPhone: open it in Safari → Share → Add to Home Screen. Run it again and push after changing the game.

## Layout

| Path | What it is |
| --- | --- |
| `build-www.js` | Copies the web game into `www/` as a standalone page (viewport and notch settings included). |
| `capacitor.config.json` | App name and id (`com.diamondbid.game`). The id must match the App Store and Play listings. |
| `ios/`, `android/` | The native projects, kept in the repo. |
| `scripts/configure-native.js` | Locks phones to portrait and lets tablets rotate. It was already applied to `ios/` and `android/`; run it again only if those folders are regenerated. |
| `../.github/workflows/ios.yml` | Builds on a cloud Mac and uploads to TestFlight. |
| `../.github/workflows/android.yml` | Builds the Play bundle (`.aab`) and a test `.apk`. |

## Building without a computer (GitHub Actions)

Each workflow runs from the repo's **Actions** tab ("Run workflow"), or when a `v*` tag is pushed. You can do all of this from a phone or iPad browser.

### iOS → TestFlight → App Store

1. Join the Apple Developer Program ($99/year) at developer.apple.com.
2. In App Store Connect, create the app with bundle id `com.diamondbid.game`.
3. In App Store Connect, go to Users and Access → Integrations → App Store Connect API. Create a key with the **App Manager** role and download the `.p8` file (it can only be downloaded once).
4. In the GitHub repo, add these secrets under Settings → Secrets and variables → Actions:
   - `APPLE_TEAM_ID`: your 10-character Team ID (Membership page).
   - `ASC_KEY_ID`: the key's ID.
   - `ASC_ISSUER_ID`: the Issuer ID shown above the keys.
   - `ASC_KEY_P8`: the `.p8` file's text, pasted exactly as it is (from `-----BEGIN PRIVATE KEY-----` to `-----END PRIVATE KEY-----`). On an iPhone: in the Files app, rename the file from `.p8` to `.txt`, open it, select all, copy, and paste it into the secret. (`ASC_KEY_P8_BASE64` with the base64-encoded file also works.)
5. Run **iOS build**. About 15 minutes later the build appears in TestFlight. Install the TestFlight app on your iPhone to try it, then submit it for review from App Store Connect.

### Android → Google Play

1. Create a Google Play developer account ($25, one time) at play.google.com/console.
2. Create the app, and keep **Play App Signing** on (the default).
3. Create an upload key (a `.jks` keystore) and add these secrets:
   - `ANDROID_KEYSTORE_BASE64`
   - `ANDROID_KEYSTORE_PASSWORD`
   - `ANDROID_KEY_ALIAS`
   - `ANDROID_KEY_PASSWORD`
4. Run **Android build**, and download `diamond-bid-android` from the run's Artifacts.
5. Upload the `.aab` to an Internal testing release in Play Console. The first upload must be made by hand; later uploads can be automated.

Without the keystore secrets, the workflow still builds a debug `.apk` you can install on an Android phone to test.

## On a computer (optional)

```
npm install
npm run sync        # rebuild www/ and copy it into ios/ and android/
npx cap open ios    # Xcode (Mac only)
npx cap open android
```
