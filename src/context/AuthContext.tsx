/* eslint-disable react-refresh/only-export-components -- Provider and hook share one context. */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Learner } from "../types";
import * as authService from "../services/authService";
import type { RegisterInput, LoginInput } from "../services/authService";

interface AuthContextValue {
  learner: Learner | null;
  loading: boolean;
  signIn: (input: LoginInput) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  signOut: () => Promise<void>;
  /** Re-fetch the current learner from the API. */
  refresh: () => Promise<Learner | null>;
  /** Apply a local patch after a successful profile update. */
  updateLearner: (patch: Partial<Learner>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [learner, setLearner] = useState<Learner | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      // If the browser is returning from a Google redirect sign-in, exchange the
      // Firebase ID token first. Otherwise use the existing CodeBloom cookie.
      const redirected = await authService.completeFirebaseRedirect();
      const current = redirected ?? (await authService.getCurrentLearner());
      if (!cancelled) setLearner(current);
    })().finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (input: LoginInput) => {
    const result = await authService.loginLearner(input);
    setLearner(result);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const result = await authService.signInWithGoogle();
    if (result) setLearner(result);
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const result = await authService.registerLearner(input);
    setLearner(result);
  }, []);

  const signOut = useCallback(async () => {
    await authService.logoutLearner();
    setLearner(null);
  }, []);

  const refresh = useCallback(async () => {
    const current = await authService.refreshLearner();
    setLearner(current);
    return current;
  }, []);

  const updateLearner = useCallback((patch: Partial<Learner>) => {
    setLearner((current) => (current ? { ...current, ...patch } : current));
  }, []);

  const value = useMemo(
    () => ({
      learner,
      loading,
      signIn,
      signInWithGoogle,
      register,
      signOut,
      refresh,
      updateLearner,
    }),
    [
      learner,
      loading,
      signIn,
      signInWithGoogle,
      register,
      signOut,
      refresh,
      updateLearner,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
