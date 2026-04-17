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
        username: data.username ?? '',
        interests: data.interests ?? [],
        onboardingCompleted: data.onboarding_completed,
      });
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const u = session?.user ?? null;
      if (!u) {
        const { data } = await supabase.auth.signInAnonymously();
        setUser(data.user ?? null);
      } else {
        setUser(u);
        if (!u.is_anonymous) fetchProfile(u);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u && !u.is_anonymous) fetchProfile(u);
      else if (!u) setProfile(null);
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

  // 기존 익명 세션을 실제 계정으로 전환 (데이터 그대로 유지)
  const convertAccount = async (email: string, password: string, username: string) => {
    const taken = await checkUsername(username);
    if (taken) return { error: new Error('username_taken') };

    const { error } = await supabase.auth.updateUser({
      email,
      password,
      data: { username },
    });

    if (!error && user) {
      await supabase
        .from('profiles')
        .update({ username, email })
        .eq('id', user.id);
      setProfile({ username, interests: [], onboardingCompleted: false });
    }

    return { error };
  };

  // 새 계정 회원가입 (익명 세션 없을 때)
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

  // 아이디로 로그인 (익명 세션 있으면 먼저 로그아웃)
  const signIn = async (username: string, password: string) => {
    if (user?.is_anonymous) {
      await supabase.auth.signOut();
    }

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

  // 로그아웃 후 새 익명 세션 생성
  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    const { data } = await supabase.auth.signInAnonymously();
    setUser(data.user ?? null);
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
    isAnonymous: user?.is_anonymous ?? true,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    checkUsername,
    completeOnboarding,
    convertAccount,
  };
};

export default useAuth;
