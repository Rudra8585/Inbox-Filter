# Privacy

This app has no backend. There is no account to create, nothing is
uploaded, and the developer has no way to see any of your data.

## What it accesses

Read-only access to your mail, via Google's `gmail.readonly` scope. That
scope cannot send, delete, label or modify anything.

Messages are fetched directly from Google to your phone over HTTPS.
Filtering and summarising happen on the device.

## What is stored

On the device only:

- Your settings: course, residence status, keywords, weights, theme.
- Any reference details you enter on the Profile screen.
- The Google sign-in token, held by Google's own sign-in library.

Message contents are held in memory while the list is on screen and are
not written to storage.

## What is sent anywhere

Requests to Google's Gmail API to fetch your own mail. That is all.
No analytics, no crash reporting, no third-party services.

## Removing everything

Sign out under Settings, then uninstall. That clears the stored settings
and the token. To revoke access independently, remove the app from your
[Google account permissions](https://myaccount.google.com/permissions).
