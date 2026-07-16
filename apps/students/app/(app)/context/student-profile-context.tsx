"use client";

import { createClient } from "@/lib/client";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

interface StudentProfile {
  id: string;
  onboarding_completed: boolean;
}

interface StudentProfileContextValue {
  profile: StudentProfile | null;
  isLoading: boolean;
  error: string | null;
  refreshProfile: () => Promise<void>;
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

  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(
    async (authenticatedUserId: string) => {
      setIsLoading(true);
      setError(null);

      const { data, error: profileError } = await supabase
        .from("profiles")
        .select("id, onboarding_completed")
        .eq("id", authenticatedUserId)
        .maybeSingle();

      if (profileError) {
        console.error(
          "[LOAD_STUDENT_PROFILE_ERROR]",
          profileError
        );

        setProfile(null);
        setError("Não foi possível carregar o perfil do aluno.");
        setIsLoading(false);
        return;
      }

      if (!data) {
        setProfile(null);
        setError("Perfil do aluno não encontrado.");
        setIsLoading(false);
        return;
      }

      setProfile({
        id: data.id,
        onboarding_completed:
          data.onboarding_completed ?? false,
      });

      setIsLoading(false);
    },
    [supabase]
  );

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const authenticatedUser = session?.user;

      if (!authenticatedUser) {
        setUserId(null);
        setProfile(null);
        setError(null);
        setIsLoading(false);
        return;
      }

      setUserId(authenticatedUser.id);

      if (
        event === "INITIAL_SESSION" ||
        event === "SIGNED_IN"
      ) {
        void loadProfile(authenticatedUser.id);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadProfile, supabase]);

  const refreshProfile = useCallback(async () => {
    if (!userId) {
      return;
    }

    await loadProfile(userId);
  }, [loadProfile, userId]);

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
      isLoading,
      error,
      refreshProfile,
      markOnboardingCompleted,
    }),
    [
      profile,
      isLoading,
      error,
      refreshProfile,
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