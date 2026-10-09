"use client";

import { createClient } from "@/lib/client";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

interface StudentProfile {
  id: string;
  onboarding_completed: boolean;
}

interface StudentProfileContextValue {
  profile: StudentProfile | null;
  isAuthenticated: boolean | null;
  isLoading: boolean;
  error: string | null;
  retryProfile: () => Promise<void>;
  markOnboardingCompleted: () => void;
}

const StudentProfileContext =
  createContext<StudentProfileContextValue | null>(null);

interface StudentProfileProviderProps {
  children: ReactNode;
}

export function StudentProfileProvider({
  children,
}: StudentProfileProviderProps) {
  const [supabase] = useState(() => createClient());

  const [profile, setProfile] =
    useState<StudentProfile | null>(null);

  const [isAuthenticated, setIsAuthenticated] =
    useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const activeUserIdRef = useRef<string | null>(null);
  const loadedUserIdRef = useRef<string | null>(null);
  const loadingUserIdRef = useRef<string | null>(null);
  const failedUserIdRef = useRef<string | null>(null);
  const requestVersionRef = useRef(0);

  const loadProfile = useCallback(
    async (authenticatedUserId: string) => {
      if (loadingUserIdRef.current === authenticatedUserId) {
        return;
      }

      const requestVersion = ++requestVersionRef.current;

      loadingUserIdRef.current = authenticatedUserId;
      setIsLoading(true);
      setError(null);

      try {
        const { data, error: profileError } = await supabase
          .from("profiles")
          .select("id, onboarding_completed")
          .eq("id", authenticatedUserId)
          .maybeSingle();

        if (
          requestVersion !== requestVersionRef.current ||
          activeUserIdRef.current !== authenticatedUserId
        ) {
          return;
        }

        if (profileError) {
          console.error(
            "[LOAD_STUDENT_PROFILE_ERROR]",
            profileError
          );

          failedUserIdRef.current = authenticatedUserId;
          setProfile(null);
          setError("Não foi possível carregar o perfil do aluno.");
          return;
        }

        if (!data) {
          failedUserIdRef.current = authenticatedUserId;
          setProfile(null);
          setError("Perfil do aluno não encontrado.");
          return;
        }

        loadedUserIdRef.current = authenticatedUserId;
        failedUserIdRef.current = null;
        setProfile({
          id: data.id,
          onboarding_completed:
            data.onboarding_completed ?? false,
        });
      } catch (profileError) {
        if (
          requestVersion !== requestVersionRef.current ||
          activeUserIdRef.current !== authenticatedUserId
        ) {
          return;
        }

        console.error(
          "[LOAD_STUDENT_PROFILE_FATAL_ERROR]",
          profileError
        );

        failedUserIdRef.current = authenticatedUserId;
        setProfile(null);
        setError("Não foi possível carregar o perfil do aluno.");
      } finally {
        if (
          requestVersion === requestVersionRef.current &&
          activeUserIdRef.current === authenticatedUserId
        ) {
          loadingUserIdRef.current = null;
          setIsLoading(false);
        }
      }
    },
    [supabase]
  );

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const authenticatedUser = session?.user;

      if (!authenticatedUser) {
        requestVersionRef.current += 1;
        activeUserIdRef.current = null;
        loadedUserIdRef.current = null;
        loadingUserIdRef.current = null;
        failedUserIdRef.current = null;
        setProfile(null);
        setIsAuthenticated(false);
        setError(null);
        setIsLoading(false);
        return;
      }

      const authenticatedUserId = authenticatedUser.id;
      const userChanged =
        activeUserIdRef.current !== authenticatedUserId;

      setIsAuthenticated(true);

      if (userChanged) {
        requestVersionRef.current += 1;
        activeUserIdRef.current = authenticatedUserId;
        loadedUserIdRef.current = null;
        loadingUserIdRef.current = null;
        failedUserIdRef.current = null;
        setProfile(null);
      }

      const profileIsUnresolved =
        loadedUserIdRef.current !== authenticatedUserId &&
        loadingUserIdRef.current !== authenticatedUserId &&
        failedUserIdRef.current !== authenticatedUserId;

      if (profileIsUnresolved) {
        void loadProfile(authenticatedUserId);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadProfile, supabase]);

  const retryProfile = useCallback(async () => {
    const authenticatedUserId = activeUserIdRef.current;

    if (!authenticatedUserId) {
      return;
    }

    failedUserIdRef.current = null;
    await loadProfile(authenticatedUserId);
  }, [loadProfile]);

  const markOnboardingCompleted = useCallback(() => {
    setProfile((currentProfile) => {
      if (!currentProfile) {
        return currentProfile;
      }

      return {
        ...currentProfile,
        onboarding_completed: true,
      };
    });
  }, []);

  const value = useMemo<StudentProfileContextValue>(
    () => ({
      profile,
      isAuthenticated,
      isLoading,
      error,
      retryProfile,
      markOnboardingCompleted,
    }),
    [
      profile,
      isAuthenticated,
      isLoading,
      error,
      retryProfile,
      markOnboardingCompleted,
    ]
  );

  return (
    <StudentProfileContext.Provider value={value}>
      {children}
    </StudentProfileContext.Provider>
  );
}

export function useStudentProfile() {
  const context = useContext(StudentProfileContext);

  if (!context) {
    throw new Error(
      "useStudentProfile deve ser utilizado dentro de StudentProfileProvider."
    );
  }

  return context;
}
