# Inbox Filter

A personal Android app that pulls your recent mail, hides the messages
that don't apply to you, and shows a short summary of the ones that do.

Built for the situation where you're on a few high-volume mailing lists —
a university batch list, a careers office list, a department announcement
list — and most of what arrives is addressed to someone else.

Everything runs on the phone. There is no server, no account to create,
and no copy of your mail anywhere but your own device.

## What it does

**Hides mail meant for other courses.** Bulk recruitment mail usually
names the programmes it's open to. If the message lists eligible courses
and yours isn't among them, it's filtered out — even when it's full of
words that would otherwise mark it as important.

**Hides mail meant for the other residence group.** Notices addressed
only to residents, or only to commuters, are skipped for whoever they
don't apply to.

**Scores what's left by category.** Exams, deadlines, recruitment,
scholarships, scam warnings and so on each carry a weight you control.
Purely social announcements are marked low-priority and stay out of the
way unless something else about them matters.

**Summarises each message** in a sentence or two, with the repeated
signature/footer block stripped out first so the summary is about the
actual content.

**Shows its reasoning.** Every message says which rules matched and why
it scored what it did, so when something is wrongly hidden or shown you
can see exactly which keyword to change.

## What it doesn't do

- No cloud service, no telemetry, no analytics.
- Read-only mail access. It cannot send, delete, label or modify anything.
- No AI model calls. Filtering and summarising are plain deterministic
  code, so there's no per-message cost and nothing leaves the device.

## Not affiliated with anyone

This is an independent personal project. It isn't endorsed by, connected
to, or produced in cooperation with any university, employer, mail
provider, or any company whose name might appear in your inbox. All
sample data in the repository is invented.

The shipped keyword lists are deliberately generic. Terms specific to
your own institution — internal portal names, department acronyms,
in-house jargon — are yours to add under **Settings → Category
Keywords**; they're stored on your device and are not part of this
project.

## Setup

You'll need [Node.js](https://nodejs.org/), an
[Expo](https://expo.dev/) account (free), and a Google Cloud project.

### 1. Install

```bash
git clone <your-repo-url>
cd <repo>
npm install
```

### 2. Check the filtering logic runs

No phone or mail account needed — this is plain Node:

```bash
node src/logic/testOffline.js
```

Every case should report `pass`.

### 3. Set an app identifier

In `app.json`, set `android.package` to something unique to you, for
example `com.yourname.inboxfilter`. Whatever you choose must match the
value you register with Google in step 5, and changing it later means
re-registering.

### 4. Build a development client

Mail sign-in uses a native library that isn't in the standard Expo Go
app, so you build your own client once:

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --profile development --platform android
```

Install the resulting APK on your phone.

### 5. Set up Google OAuth

Get your app's signing fingerprint:

```bash
eas credentials -p android
```

Choose *Keystore* and note the **SHA-1**. Then in the
[Google Cloud Console](https://console.cloud.google.com/):

1. **APIs & Services → Library** → enable **Gmail API**.
2. **Credentials → Create Credentials → OAuth client ID → Android.**
   Enter the package name from step 3 and the SHA-1 above.
3. **Credentials → Create Credentials → OAuth client ID → Web
   application.** No redirect URIs needed. The sign-in library requires
   this one to issue tokens.
4. **OAuth consent screen** → add your own account under **Test users**.

Paste the *Web* client ID into `src/auth/googleAuthConfig.js` (copy it from
`src/auth/googleAuthConfig.example.js` first — the real file is gitignored
so your client ID never ends up in the repo). The Android client ID isn't
pasted anywhere — it's matched automatically from your package name and
fingerprint.

Because the app stays unverified, Google shows a warning on first
sign-in. That's expected for a personal app talking to your own account.

### 6. Run it

```bash
npx expo start --dev-client
```

### 7. Build a standalone APK

The development build above needs `expo start` running on your computer.
For one that works on its own, make sure `eas.json` has:

```json
"preview": {
  "distribution": "internal",
  "android": { "buildType": "apk" }
}
```

then:

```bash
eas build --profile preview --platform android
```

That APK has everything bundled and needs nothing else running.

## Tuning it to your inbox

Open **Settings** and adjust as you go. The main levers:

| Setting | What it changes |
|---|---|
| Minimum score | The bar a message must clear. Raise to see less, lower to see more. |
| Category keywords | Words that put a message in a category. Add the vocabulary your own mail uses. |
| Category weight | How much a category pushes a message up. |
| Low priority | Category only counts when something else matches too. |
| Email footer | Phrases marking where the repeated signature block starts, so it's ignored. |

Expect to spend a little time here at first. The reasons shown on each
message tell you which keyword to change.

Your course and residence status live under **Profile** and drive the
eligibility and audience rules.

## Project layout

```
src/
├── logic/          filtering, summarising, cleaning — plain JS, runs under Node
│   ├── rules.js            scoring, eligibility and audience matching
│   ├── summarizer.js       extractive summariser
│   ├── emailUtils.js       quote/emphasis/footer stripping
│   ├── base64.js           decodes message bodies, UTF-8 safe
│   ├── defaultConfig.js    starting keywords and weights
│   └── testOffline.js      offline checks against invented messages
├── api/            Gmail REST calls
├── auth/           Google sign-in
├── storage/        on-device settings
├── screens/        Inbox, Profile, Settings
├── components/     message card, keyword editor
└── theme/          light and dark palettes
```

Everything under `src/logic/` is dependency-free and testable from the
command line, which is the easiest place to start if you want to change
how filtering works.

## Licence

MIT — see [LICENSE](LICENSE).
