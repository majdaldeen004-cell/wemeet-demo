'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { List, MapPin } from 'lucide-react';
import dynamic from 'next/dynamic';
import { AppShell } from '@/components/layout/AppShell';
import { EventFiltersBar } from '@/components/events/EventFilters';
import { EventListSkeleton } from '@/components/ui/Skeletons';
import { EventCard } from '@/components/events/EventCard';
import { Button } from '@/components/ui/Button';
import { useEvents } from '@/hooks/useEvents';
import type { Event, EventFilters } from '@/types';

// Dynamic import — Google Maps only loads client-side
const EventsMap = dynamic(
  () => import('@/components/maps/EventMap').then((m) => m.EventsMap),
  { ssr: false, loading: () => <div className="w-full h-[420px] bg-sand-dark rounded-2xl animate-pulse" /> },
);

export default function EventsMapPage() {
  const router = useRouter();
  const { events, loading, filters, applyFilters } = useEvents(true);
  const [highlighted, setHighlighted] = useState<Event | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | undefined>();

  // Try to get user location for map centering
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => { /* use default center */ },
    );
  }, []);

  // Events that have coordinates
  const mappableEvents = events.filter((e) => e.locationLat && e.locationLng);
  const unmappedEvents  = events.filter((e) => !e.locationLat && !e.locationLng);

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-ink">Events Map</h1>
            <p className="text-sm text-ink-muted">
              {mappableEvents.length} event{mappableEvents.length !== 1 ? 's' : ''} on map
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/home')}
          >
            <List size={16} /> List view
          </Button>
        </div>

        {/* Filters */}
        <EventFiltersBar filters={filters} onChange={applyFilters} />

        {/* Map */}
        <div className="rounded-2xl overflow-hidden shadow-card border border-border">
          {loading ? (
            <div className="w-full h-[420px] bg-sand-dark animate-pulse rounded-2xl" />
          ) : (
            <EventsMap
              events={mappableEvents}
              center={userLocation}
              height="420px"
              onEventClick={(event) => {
                setHighlighted(event);
                document.getElementById(`event-${event.id}`)?.scrollIntoView({
                  behavior: 'smooth', block: 'nearest',
                });
              }}
            />
          )}
        </div>

        {/* Highlighted event card */}
        {highlighted && (
          <div className="border-2 border-brand-green rounded-2xl overflow-hidden" id={`event-${highlighted.id}`}>
            <div className="px-3 pt-2 pb-0">
              <p className="text-xs text-brand-green font-semibold flex items-center gap-1"><MapPin size={11}/>تم الاختيار على الخريطة</p>
            </div>
            <EventCard event={highlighted} />
          </div>
        )}

        {/* Scrollable event list below map */}
        {mappableEvents.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-ink-muted uppercase tracking-widest mb-3">All mapped events</p>
            <div className="space-y-3">
              {loading
                ? <EventListSkeleton count={3} />
                : mappableEvents.map((event) => (
                  <div key={event.id} id={`event-${event.id}`}
                    className={highlighted?.id === event.id ? 'ring-2 ring-brand-green rounded-2xl' : ''}
                  >
                    <EventCard event={event} />
                  </div>
                ))
              }
            </div>
          </div>
        )}

        {/* Events without location */}
        {unmappedEvents.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-ink-muted uppercase tracking-widest mb-3">Without location</p>
            <div className="space-y-3">
              {unmappedEvents.map((event) => <EventCard key={event.id} event={event} />)}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
