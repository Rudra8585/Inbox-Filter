import { GoogleSignin } from "@react-native-google-signin/google-signin";

// Set via environment variables, not hardcoded — see README.md "Set up
// Google OAuth". EXPO_PUBLIC_-prefixed vars are inlined into the JS bundle
// at build time by Expo/Metro, and work the same way whether you're
// running `expo start` locally (reads .env) or building with EAS
// (reads values set via `eas env:create`). Neither path requires
// committing the value to git.
const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

if (!WEB_CLIENT_ID) {
  throw new Error(
    "EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID is not set. For local runs, add it to " +
      ".env (see .env.example). For EAS builds, set it with " +
      "`eas env:create` so it's available during the cloud build. " +
      "See README.md, 'Set up Google OAuth'."
  );
}

const SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"];

let configured = false;

export function configureGoogleSignIn() {
  if (configured) return;
  GoogleSignin.configure({
    webClientId: WEB_CLIENT_ID,
    iosClientId: IOS_CLIENT_ID,
    scopes: SCOPES,
    offlineAccess: false,
  });
  configured = true;
}

export async function isSignedIn() {
  configureGoogleSignIn();
  try {
    const user = await GoogleSignin.getCurrentUser();
    return !!user;
  } catch {
    return false;
  }
}

export async function signIn() {
  configureGoogleSignIn();
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  return GoogleSignin.signIn();
}

export async function signOut() {
  configureGoogleSignIn();
  await GoogleSignin.signOut();
}

/**
 * Returns a valid access token, refreshing under the hood if needed.
 * The native library handles token refresh transparently.
 */
export async function getAccessToken() {
  configureGoogleSignIn();
  const tokens = await GoogleSignin.getTokens();
  return tokens.accessToken;
}
