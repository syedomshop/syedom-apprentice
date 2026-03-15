import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User, AuthError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import { clearUserCache } from "@/lib/cache";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  internProfile: any | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  internProfile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [internProfile, setInternProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from("intern_profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        if (error.code === "PGRST301" || error.message?.includes("JWT")) {
          console.warn("[Auth] Session expired or invalid token — signing out");
          await supabase.auth.signOut();
          return;
        }
        console.error("[Auth] fetchProfile error:", error.message, error.code);
      }
      setInternProfile(profile || null);
    } catch (err) {
      console.error("[Auth] fetchProfile unexpected error:", err);
    }
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  useEffect(() => {
    let initialised = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("[Auth] State change:", event, session?.user?.email || "no user");

        if (event === "TOKEN_REFRESHED") {
          console.log("[Auth] Token refreshed successfully");
        }

        if (event === "SIGNED_OUT" || (!session && event !== "INITIAL_SESSION")) {
          setSession(null);
          setUser(null);
          setInternProfile(null);
          setLoading(false);
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          setTimeout(() => fetchProfile(session.user.id), 0);
        } else {
          setInternProfile(null);
        }

        if (!initialised) {
          setLoading(false);
          initialised = true;
        }
      }
    );

    // Get the current session on mount to handle page refreshes
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error("[Auth] getSession error:", error.message);
        setLoading(false);
        return;
      }
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      if (!initialised) {
        setLoading(false);
        initialised = true;
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      clearUserCache();
      await supabase.auth.signOut();
    } catch (err) {
      console.error("[Auth] signOut error:", err);
    } finally {
      setSession(null);
      setUser(null);
      setInternProfile(null);
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, internProfile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
