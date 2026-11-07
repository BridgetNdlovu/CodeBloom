import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import {
  GoogleAuthProvider,
  getAuth,
  getRedirectResult,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type Auth,
} from "firebase/auth";

/**
 * Firebase web configuration is public by design (it identifies the project, it is
 * not a server credential). Values come from Vite environment variables so that
 * local, preview and Vercel production builds can use different projects.
 *
 * The Firebase Admin service account is NEVER placed here. Only the ASP.NET Core
 * API verifies ID tokens and owns the service-account credential.
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY?.trim() ?? "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN?.trim() ?? "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID?.trim() ?? "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET?.trim() ?? "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID?.trim() ?? "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID?.trim() ?? "",
};

export const firebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId,
);

let cachedApp: FirebaseApp | null = null;
let cachedAuth: Auth | null = null;

function getFirebaseAuth(): Auth {
  if (!firebaseConfigured) {
    throw new Error(
      "Firebase is not configured. Add the VITE_FIREBASE_* values to .env.local " +
        "or the Vercel environment variables, then restart/redeploy the frontend.",
    );
  }

  if (!cachedApp) {
    cachedApp = getApps()[0] ?? initializeApp(firebaseConfig);
  }
  if (!cachedAuth) {
    cachedAuth = getAuth(cachedApp);
  }
  return cachedAuth;
}

export type GoogleSignInResult = { idToken: string } | { redirecting: true };

/**
 * Opens the Google account picker. Most browsers support the popup flow; when a
 * popup is blocked we fall back to a full-page redirect. The redirect result is
 * completed on the next page load by completeGoogleRedirect().
 */
export async function signInWithGoogle(): Promise<GoogleSignInResult> {
  const auth = getFirebaseAuth();
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  try {
    const credential = await signInWithPopup(auth, provider);
    return { idToken: await credential.user.getIdToken() };
  } catch (error) {
    const code = readErrorCode(error);
    if (
      code === "auth/popup-blocked" ||
      code === "auth/operation-not-supported-in-this-environment"
    ) {
      await signInWithRedirect(auth, provider);
      return { redirecting: true };
    }
    throw error;
  }
}

/** Returns an ID token when the browser is returning from a redirect sign-in. */
export async function completeGoogleRedirect(): Promise<string | null> {
  if (!firebaseConfigured) return null;

  const result = await getRedirectResult(getFirebaseAuth());
  if (!result?.user) return null;
  return result.user.getIdToken();
}

/** Clears the Firebase browser session; the API cookie is cleared separately. */
export async function signOutFirebase(): Promise<void> {
  if (!firebaseConfigured) return;
  try {
    await signOut(getFirebaseAuth());
  } catch {
    /* Best effort only. The HttpOnly API cookie remains the source of truth. */
  }
}

function readErrorCode(error: unknown): string {
  if (typeof error === "object" && error !== null && "code" in error) {
    return String((error as { code: unknown }).code);
  }
  return "";
}

/** Turns Firebase SDK error codes into messages a learner can act on. */
export function describeFirebaseError(error: unknown): string {
  switch (readErrorCode(error)) {
    case "auth/popup-closed-by-user":
      return "Google sign-in was closed before it finished. Please try again.";
    case "auth/cancelled-popup-request":
      return "Another Google sign-in is already in progress. Please finish that one.";
    case "auth/popup-blocked":
      return "Your browser blocked the Google sign-in window. Allow pop-ups for this site and try again.";
    case "auth/unauthorized-domain":
      return "This website is not authorised in Firebase Authentication. Add the domain in Firebase Console > Authentication > Settings > Authorized domains.";
    case "auth/operation-not-allowed":
      return "Google sign-in is not enabled. Enable the Google provider in Firebase Console > Authentication > Sign-in method.";
    case "auth/network-request-failed":
      return "Google sign-in could not reach Firebase. Check your internet connection and try again.";
    case "auth/invalid-api-key":
      return "The Firebase web API key is invalid. Check the VITE_FIREBASE_* values.";
    case "auth/account-exists-with-different-credential":
      return "An account already exists with this email using a different sign-in method.";
    default:
      return error instanceof Error && error.message
        ? error.message
        : "Google sign-in could not be completed. Please try again.";
  }
}
