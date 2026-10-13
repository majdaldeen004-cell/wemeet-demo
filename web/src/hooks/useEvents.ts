'use client';
import { useState, useCallback, useEffect } from 'react';
import { eventsApi } from '@/lib/api';
import { useEventStore } from '@/store/eventStore';
import type { Event, EventFilters, CreateEventInput } from '@/types';
import toast from 'react-hot-toast';

export const useEvents = (initialFetch = false) => {
  const store = useEventStore();

  useEffect(() => {
    if (initialFetch) store.fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFetch]);

  const applyFilters = useCallback((filters: EventFilters) => {
    store.fetchEvents({ ...store.filters, ...filters, page: 1 });
  }, [store]);

  const loadMore = useCallback(() => {
    if (!store.meta?.hasNext) return;
    store.fetchEvents({ ...store.filters, page: (store.filters.page ?? 1) + 1 });
  }, [store]);

  return {
    events:      store.events,
    loading:     store.loading,
    error:       store.error,
    meta:        store.meta,
    filters:     store.filters,
    applyFilters,
    loadMore,
    refetch:     () => store.fetchEvents(store.filters),
  };
};

export const useEvent = (id: string) => {
  const store = useEventStore();
  const [joining, setJoining]   = useState(false);
  const [leaving, setLeaving]   = useState(false);

  useEffect(() => {
    store.fetchById(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const join = useCallback(async (inviteCode?: string) => {
    setJoining(true);
    try {
      const res = await eventsApi.join(id, inviteCode);
      toast.success(res.message);
      await store.fetchById(id);
      return true;
    } catch (err: unknown) {
      const msg = extractApiError(err, 'Failed to join event');
      toast.error(msg);
      return false;
    } finally {
      setJoining(false);
    }
  }, [id, store]);

  const leave = useCallback(async () => {
    setLeaving(true);
    try {
      const res = await eventsApi.leave(id);
      if (res.penaltyApplied) {
        toast('Red flag issued for late cancellation', { icon: '🚩' });
      } else {
        toast.success('Left event');
      }
      await store.fetchById(id);
      return true;
    } catch (err: unknown) {
      toast.error(extractApiError(err, 'Failed to leave'));
      return false;
    } finally {
      setLeaving(false);
    }
  }, [id, store]);

  return {
    event:   store.selected,
    loading: store.loading,
    error:   store.error,
    joining,
    leaving,
    join,
    leave,
    refetch: () => store.fetchById(id),
  };
};

export const useCreateEvent = () => {
  const [loading, setLoading] = useState(false);

  const create = useCallback(async (data: CreateEventInput): Promise<Event | null> => {
    setLoading(true);
    try {
      const event = await eventsApi.create(data);
      toast.success('Event created! ');
      return event;
    } catch (err: unknown) {
      toast.error(extractApiError(err, 'Failed to create event'));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { create, loading };
};

// ─── Helper ───────────────────────────────────────────────────────────────────
export const extractApiError = (
  err: unknown,
  fallback = 'Something went wrong',
): string => {
  const apiErr = err as {
    response?: { data?: { error?: { message?: string; details?: { path: string; message: string }[] } } };
  };
  return apiErr?.response?.data?.error?.message ?? fallback;
};
