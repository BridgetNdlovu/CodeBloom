import type {
  CharacterPreference,
  Learner,
  LearnerPreferences,
  AgeGroup,
  UserRole,
  AccountStatus,
} from "../types";
import {
  ApiError,
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  getStudentProfile,
  exchangeFirebaseToken,
  updateCharacter as apiUpdateCharacter,
  updatePreferences as apiUpdatePreferences,
  type AuthUser,
  type StudentProfileDto,
  type StudentPreferences,
  type RegisterInput,
  type LoginInput,
} from "./apiClient";
import * as firebaseClient from "./firebase";

export type { RegisterInput, LoginInput } from "./apiClient";

export class AuthError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

export function toAuthError(error: unknown, fallback: string): AuthError {
  if (error instanceof AuthError) return error;
  if (error instanceof ApiError) return new AuthError(error.message, error.status);
  if (error instanceof Error) return new AuthError(error.message || fallback, 0);
  return new AuthError(fallback, 0);
}

const DEFAULT_PREFERENCES: LearnerPreferences = {
  sound: true,
  motion: true,
  hints: true,
  reducedMotion: false,
};

function parsePreferences(json?: string | null): LearnerPreferences {
  if (!json) return { ...DEFAULT_PREFERENCES };
  try {
    const parsed = JSON.parse(json) as Partial<{
      sound: boolean;
      reducedMotion: boolean;
      showHints: boolean;
      motion: boolean;
      hints: boolean;
    }>;
    return {
      sound: parsed.sound ?? true,
      reducedMotion: parsed.reducedMotion ?? false,
      motion: parsed.motion ?? !parsed.reducedMotion,
      hints: parsed.showHints ?? parsed.hints ?? true,
    };
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

function toPublic(authUser: AuthUser, profile?: StudentProfileDto): Learner {
  return {
    id: authUser.id,
    displayName: profile?.displayName ?? authUser.displayName ?? authUser.username,
    username: authUser.username,
    email: authUser.email,
    ageGroup: (profile?.ageGroup ?? "6-8") as AgeGroup,
    character: (profile?.character ?? "girl") as CharacterPreference,
    role: authUser.role as UserRole,
    accountStatus: authUser.accountStatus as AccountStatus,
    createdAt: authUser.createdAt,
    updatedAt: authUser.createdAt,
    preferences: parsePreferences(profile?.preferencesJson),
  };
}

export async function registerLearner(input: RegisterInput): Promise<Learner> {
  try {
    const result = await registerUser({
      displayName: input.displayName,
      username: input.username,
      email: input.email,
      password: input.password,
      role: input.role,
      character: input.character,
      ageGroup: input.ageGroup,
    });
    const profile =
      result.user.role === "student"
        ? await getStudentProfile().catch(() => undefined)
        : undefined;
    return toPublic(result.user, profile);
  } catch (error) {
    throw toAuthError(error, "Unable to create your account.");
  }
}

export async function loginLearner(input: LoginInput): Promise<Learner> {
  try {
    const result = await loginUser(input);
    const profile =
      result.user.role === "student"
        ? await getStudentProfile().catch(() => undefined)
        : undefined;
    return toPublic(result.user, profile);
  } catch (error) {
    throw toAuthError(error, "Unable to sign in with those details.");
  }
}

/**
 * Exchanges a Firebase ID token for the normal CodeBloom cookie session. The API
 * verifies the token server-side and resolves the role from SQL Server, so a
 * frontend user can never grant themselves instructor or admin access.
 */
export async function loginWithFirebaseToken(idToken: string): Promise<Learner> {
  try {
    const result = await exchangeFirebaseToken(idToken);
    const profile =
      result.user.role === "student"
        ? await getStudentProfile().catch(() => undefined)
        : undefined;
    return toPublic(result.user, profile);
  } catch (error) {
    throw toAuthError(error, "Unable to sign in with Google.");
  }
}

/**
 * Starts Google sign-in. Returns the signed-in learner, or null when the browser
 * followed a redirect and the result will be completed on the next page load.
 */
export async function signInWithGoogle(): Promise<Learner | null> {
  try {
    const result = await firebaseClient.signInWithGoogle();
    if ("redirecting" in result) return null;
    return await loginWithFirebaseToken(result.idToken);
  } catch (error) {
    if (error instanceof AuthError) throw error;
    throw new AuthError(firebaseClient.describeFirebaseError(error), 0);
  }
}

/**
 * Completes a Google redirect sign-in. Safe to call on every app start: it returns
 * null when there is no redirect result.
 */
export async function completeFirebaseRedirect(): Promise<Learner | null> {
  try {
    const idToken = await firebaseClient.completeGoogleRedirect();
    if (!idToken) return null;
    return await loginWithFirebaseToken(idToken);
  } catch {
    // A stale or malformed redirect result must not prevent the normal cookie
    // session (and local login form) from working.
    return null;
  }
}

export async function logoutLearner(): Promise<void> {
  try {
    await logoutUser();
  } catch {
    /* The cookie is HttpOnly; if the request fails the session may still be
       valid server-side, but we always clear local state after sign-out. */
  }
  await firebaseClient.signOutFirebase();
}

export async function getCurrentLearner(): Promise<Learner | null> {
  try {
    const authUser = await getCurrentUser();
    const profile =
      authUser.role === "student"
        ? await getStudentProfile().catch(() => undefined)
        : undefined;
    return toPublic(authUser, profile);
  } catch {
    return null;
  }
}

/** Re-fetch the signed-in learner, including student profile data. */
export async function refreshLearner(): Promise<Learner | null> {
  return getCurrentLearner();
}

export async function changeCharacter(character: CharacterPreference): Promise<void> {
  try {
    await apiUpdateCharacter(character);
  } catch (error) {
    throw toAuthError(error, "Unable to update your character.");
  }
}

export async function changePreferences(
  preferences: StudentPreferences,
): Promise<void> {
  try {
    await apiUpdatePreferences(preferences);
  } catch (error) {
    throw toAuthError(error, "Unable to save your preferences.");
  }
}
