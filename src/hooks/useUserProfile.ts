"use client";

import { useState, useEffect, useCallback } from 'react';
import { getOrCreateUserProfile, type Profile } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

type UseUserProfileReturn = {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  refreshProfile: () => Promise<void>;
};

export function useUserProfile(): UseUserProfileReturn {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const userProfile = await getOrCreateUserProfile(user.id);

      if (userProfile) {
        setProfile(userProfile);
      } else {
        setError('Não foi possível carregar o perfil');
        setProfile(null);
      }
    } catch (err) {
      console.error('Erro inesperado ao carregar perfil:', err);
      setError('Erro inesperado ao carregar perfil');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const refreshProfile = useCallback(async () => {
    await fetchProfile();
  }, [fetchProfile]);

  return { profile, loading, error, refreshProfile };
}
