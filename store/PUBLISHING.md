# Publishing Diamond Bid on the App Store with your Apple developer account

Thanks for publishing Diamond Bid! The app is finished and builds itself in the cloud, so **you don't need a Mac or Xcode**. Everything below works in a web browser, including on an iPhone. It takes about 30 minutes of clicking plus Apple's review (1–3 days). The app will show your name as the seller.

Everything you need is in this repository: https://github.com/nsss225-bit/diamond-bid

| What | Where |
| --- | --- |
| Store text to copy (name, description, keywords, privacy answers, reviewer notes) | [`store/app-store-listing.md`](app-store-listing.md) |
| Screenshots: 6 for iPhone (1320 × 2868), 5 for iPad (2064 × 2752) | [`store/screenshots/`](screenshots/) |
| Support page | https://nsss225-bit.github.io/diamond-bid/ |
| Privacy policy | https://nsss225-bit.github.io/diamond-bid/privacy.html |
| The app (built automatically) | [`.github/workflows/ios.yml`](../.github/workflows/ios.yml) builds it on a cloud Mac and uploads it to your TestFlight |

App details: bundle ID **`com.diamondbid.game`**, version **1.6**, free, no in-app purchases, no ads, age rating 4+.

---

## Step 1: Register the app ID (developer.apple.com)
1. Go to https://developer.apple.com/account → **Certificates, IDs & Profiles** → **Identifiers** → **+**.
2. **App IDs** → Continue → **App** → Continue.
3. Description `Diamond Bid`. Bundle ID: **Explicit**, `com.diamondbid.game`. Don't tick any capabilities.
4. **Continue** → **Register**.

## Step 2: Create the app (appstoreconnect.apple.com)
1. **Apps** → **+** → **New App**.
2. Platform **iOS**. Name **Diamond Bid** (if taken: `Diamond Bid: Card Game`). Language **English (U.S.)**. Bundle ID **com.diamondbid.game**. SKU `diamondbid1`. User access **Full Access**.
3. **Create**.

## Step 3: Create an upload key for the cloud build
1. App Store Connect → **Users and Access** → **Integrations** → **App Store Connect API**. If you see **Request Access**, request it and accept.
2. **Team Keys** → **+**. Name `Diamond Bid GitHub`, access **App Manager** → **Generate**.
3. Note the **Key ID** and the **Issuer ID**, and **Download** the `.p8` file (it can only be downloaded once).
4. Note your **Team ID**: developer.apple.com/account → **Membership details**.

This key can only upload and manage apps on your account. You can revoke it any time on the same page, for example once the app is live.

## Step 4: Put the key in GitHub
Your sibling will add you as a collaborator on the GitHub repository, so the key goes straight from you to GitHub and nobody else sees it. (If you'd rather not use GitHub, send them the four values privately and they'll add them.)

1. Accept the GitHub invite (by email, or at https://github.com/nsss225-bit/diamond-bid/invitations).
2. In the repository: **Settings** → **Secrets and variables** → **Actions** → **New repository secret**. Add four secrets:

| Name | Value |
| --- | --- |
| `APPLE_TEAM_ID` | your Team ID |
| `ASC_KEY_ID` | the Key ID |
| `ASC_ISSUER_ID` | the Issuer ID |
| `ASC_KEY_P8` | the whole text of the `.p8` file, including the `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----` lines |

On an iPhone: in the Files app, rename the `.p8` file to `.txt`, open it, Select All, Copy, and paste it into the secret.

## Step 5: Build and upload
1. In the repository, open **Actions** → **iOS build** → **Run workflow** → **Run workflow**.
2. It runs about 15 minutes on GitHub's Mac. A green check means the build was uploaded.
3. 10–20 minutes later it appears in App Store Connect → Diamond Bid → **TestFlight**. To try it, add yourself (and your sibling's Apple ID email) under **Internal Testing**, and install it with the TestFlight app.

If the run turns red, send your sibling a screenshot of the error; it's usually a mistyped secret.

## Step 6: Fill in the store page
In App Store Connect → Diamond Bid. Copy everything from [`store/app-store-listing.md`](app-store-listing.md).

- **iOS App 1.6** (version page): upload the screenshots from `store/screenshots/` (iPhone 6.9" and iPad 13"), paste the promotional text, description, keywords, support URL, then under **Build** tap **Add Build** and pick the TestFlight build.
- **App Review Information**: sign-in required **off**; paste the reviewer notes; add a contact phone and email.
- **App Information**: category **Games**, subcategories **Card** and **Board**; content rights: no third-party content; age rating: answer None/No to everything (4+).
- **App Privacy**: privacy policy URL above. Data collection **Yes**: **User ID**, **Name**, **Gameplay Content**, each used for **App Functionality**, **not linked** to identity, **not used for tracking**. Then **Publish**.
- **Pricing and Availability**: **Free**, all countries.

Optional, to let your sibling handle the store text and screenshots themself: **Users and Access** → **+** → their email, role **App Manager**, app access **Diamond Bid**.

## Step 7: Submit
**Add for Review** → **Submit to App Review**. Apple replies by email in 1–3 days. If they ask for changes, forward the message to your sibling.

---

### Good to know
- **Online play** runs on the game's own Firebase server (owned by your sibling). There are no accounts: each player gets an anonymous ID automatically. Quick match starts a bot game after 20 seconds if nobody else is online, so Apple's reviewer can try it alone.
- **Export compliance**: already answered in the app (`ITSAppUsesNonExemptEncryption = NO`), so TestFlight won't ask.
- **Updates**: your sibling changes the game, then you (or they) tap **Run workflow** again and submit the new build as a new version in App Store Connect. The version number comes from the repository variable `VERSION_NAME` (Settings → Secrets and variables → Actions → Variables); without it the version is 1.6.
- **Android** is separate (Google Play) and not needed for this.
