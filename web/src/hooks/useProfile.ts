'use client';
import { useState, useCallback } from 'react';
import { usersApi, redFlagsApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import type { RedFlagScore, User } from '@/types';
import { extractApiError } from './useEvents';

export const useProfile = () => {
  const { user, updateUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [redFlags, setRedFlags] = useState<RedFlagScore | null>(null);
  const [redFlagsLoading, setRedFlagsLoading] = useState(false);

  const refreshMe = useCallback(async () => {
    setLoading(true);
    try {
      const me = await usersApi.getMe();
      updateUser(me);
      return me;
    } catch {
      return null;
    } finally {
      setLoading(false);
    }
  }, [updateUser]);

  const updateProfile = useCallback(async (data: {
    displayName?: string; bio?: string; gender?: string;
  }) => {
    setLoading(true);
    try {
      const updated = await usersApi.updateMe(data);
      updateUser(updated);
      toast.success('Profile updated');
      return true;
    } catch (err) {
      toast.error(extractApiError(err, 'Failed to update'));
      return false;
    } finally {
      setLoading(false);
    }
  }, [updateUser]);

  const loadRedFlags = useCallback(async () => {
    setRedFlagsLoading(true);
    try {
      const score = await redFlagsApi.myScore();
      setRedFlags(score);
    } catch { /* silent */ }
    finally { setRedFlagsLoading(false); }
  }, []);

  return { user, loading, redFlags, redFlagsLoading, refreshMe, updateProfile, loadRedFlags };
};
