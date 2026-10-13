import { create } from 'zustand';
import type { Event, EventFilters, PaginationMeta } from '@/types';
import { eventsApi } from '@/lib/api';

interface EventStore {
  events:   Event[];
  selected: Event | null;
  filters:  EventFilters;
  meta:     PaginationMeta | null;
  loading:  boolean;
  error:    string | null;

  fetchEvents:  (filters?: EventFilters) => Promise<void>;
  fetchById:    (id: string) => Promise<Event | null>;
  setFilters:   (filters: EventFilters) => void;
  setSelected:  (event: Event | null) => void;
  reset:        () => void;
}

export const useEventStore = create<EventStore>((set, get) => ({
  events:   [],
  selected: null,
  filters:  { upcoming: true, page: 1, limit: 20 },
  meta:     null,
  loading:  false,
  error:    null,

  fetchEvents: async (filters) => {
    set({ loading: true, error: null });
    try {
      const merged = { ...get().filters, ...filters };
      const res = await eventsApi.list(merged);
      set({ events: res.items, meta: res.meta, loading: false, filters: merged });
    } catch (e: unknown) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  fetchById: async (id) => {
    set({ loading: true, error: null });
    try {
      const event = await eventsApi.getById(id);
      set({ selected: event, loading: false });
      return event;
    } catch (e: unknown) {
      set({ error: (e as Error).message, loading: false });
      return null;
    }
  },

  setFilters:  (filters) => set({ filters: { ...get().filters, ...filters } }),
  setSelected: (event)   => set({ selected: event }),
  reset:       ()        => set({ events: [], selected: null, meta: null, error: null }),
}));
