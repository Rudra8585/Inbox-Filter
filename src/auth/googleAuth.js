import { GoogleSignin } from "@react-native-google-signin/google-signin";

let authConfig;
try {
  // Your real, untracked config — see googleAuthConfig.example.js
  authConfig = require("./googleAuthConfig");
} catch {
  throw new Error(
    "Missing src/auth/googleAuthConfig.js. Copy googleAuthConfig.example.js " +
      "to googleAuthConfig.js and fill in your own Google Cloud OAuth client IDs " +
      "(see README.md)."
  );
}

const { WEB_CLIENT_ID, IOS_CLIENT_ID } = authConfig;

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
