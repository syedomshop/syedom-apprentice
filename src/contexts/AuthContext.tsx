import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  role: "admin" | "intern" | null;
  internProfile: any | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  role: null,
  internProfile: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<"admin" | "intern" | null>(null);
  const [internProfile, setInternProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (userId: string) => {
    // Fetch role
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    if (roles && roles.length > 0) {
      setRole(roles[0].role as "admin" | "intern");
    } else {
      setRole("intern");
    }

    // Fetch intern profile
    const { data: profile } = await supabase
      .from("intern_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    setInternProfile(profile);
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Use setTimeout to avoid Supabase client deadlock
          setTimeout(() => fetchUserData(session.user.id), 0);
        } else {
          setRole(null);
          setInternProfile(null);
        }
        setLoading(false);
      }
    );

    // THEN check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setRole(null);
    setInternProfile(null);
  };

  return (
    <AuthContext.Provider value={{ session, user, role, internProfile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
