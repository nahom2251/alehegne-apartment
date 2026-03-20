import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  status: "pending" | "approved" | "rejected";
  language: string;
}

interface UserRole {
  role: "super_admin" | "admin" | "user";
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: string[];
  loading: boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isApproved: boolean;

  signIn: (
    email: string,
    password: string,
    rememberMe?: boolean
  ) => Promise<{ error: any }>;

  signUp: (
    email: string,
    password: string,
    fullName: string
  ) => Promise<{ error: any }>;

  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ FETCH PROFILE + ROLES (FIXED)
  const fetchProfile = async (userId: string) => {
    try {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (profileData) {
        setProfile(profileData as Profile);
      }

      const { data: rolesData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (rolesData) {
        setRoles(rolesData.map((r: UserRole) => r.role));
      }
    } catch (err) {
      console.error("Profile fetch error:", err);
    }
  };

  // ✅ MANUAL REFRESH (used after approval if needed)
  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    // ✅ LISTEN FOR AUTH CHANGES (FIXED)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await fetchProfile(session.user.id); // ✅ FIX: removed setTimeout
      } else {
        setProfile(null);
        setRoles([]);
      }

      setLoading(false);
    });

    // ✅ INITIAL SESSION LOAD (FIXED)
    const loadSession = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await fetchProfile(session.user.id);
      }

      setLoading(false);
    };

    loadSession();

    return () => subscription.unsubscribe();
  }, []);

  // 🔐 LOGIN
  const signIn = async (
    email: string,
    password: string,
    rememberMe: boolean = true
  ) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!rememberMe) {
      await supabase.auth.signOut();
    }

    return { error };
  };

  // 📝 SIGN UP
  const signUp = async (
    email: string,
    password: string,
    fullName: string
  ) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: window.location.origin,
      },
    });

    return { error };
  };

  // 🚪 SIGN OUT
  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setRoles([]);
  };

  // 🔁 RESET PASSWORD
  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/auth",
    });

    return { error };
  };

  const isSuperAdmin = roles.includes("super_admin");
  const isAdmin = isSuperAdmin || roles.includes("admin");
  const isApproved = profile?.status === "approved";

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        roles,
        loading,
        isSuperAdmin,
        isAdmin,
        isApproved,
        signIn,
        signUp,
        signOut,
        refreshProfile,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};