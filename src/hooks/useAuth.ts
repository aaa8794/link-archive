import { useState, useEffect, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export interface Profile {
  username: string;
  interests: string[];
  onboardingCompleted: boolean;
}

const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (u: User) => {
    const { data } = await supabase
      .from('profiles')
      .select('username, interests, onboarding_completed')
      .eq('id', u.id)
      .single();

    if (data) {
      setProfile({
        username: data.username,
        interests: data.interests ?? [],
        onboardingCompleted: data.onboarding_completed,
      });
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) fetchProfile(u);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) fetchProfile(u);
      else setProfile(null);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const checkUsername = async (username: string): Promise<boolean> => {
    const { data } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username)
      .maybeSingle();
    return !!data;
  };

  const signUp = async (email: string, password: string, username: string) => {
    const taken = await checkUsername(username);
    if (taken) return { error: new Error('username_taken') };

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });
    return { error };
  };

  // 아이디로 로그인 — profiles에서 email 조회 후 signInWithPassword
  const signIn = async (username: string, password: string) => {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('email')
      .eq('username', username)
      .maybeSingle();

    if (!profileData?.email) {
      return { error: new Error('user_not_found') };
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: profileData.email,
      password,
    });
    return { error };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const completeOnboarding = async (interests: string[]) => {
    if (!user) return;
    await supabase
      .from('profiles')
      .update({ interests, onboarding_completed: true })
      .eq('id', user.id);
    setProfile((prev) =>
      prev ? { ...prev, interests, onboardingCompleted: true } : null
    );
  };

  return {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    checkUsername,
    completeOnboarding,
  };
};

export default useAuth;
