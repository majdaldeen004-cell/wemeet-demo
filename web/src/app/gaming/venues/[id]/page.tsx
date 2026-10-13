/**
 * web/src/app/gaming/venues/[id]/page.tsx
 *
 * Gaming Venue detail page with reactive booking form.
 */
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MapPin, Clock, Monitor, DollarSign, ArrowLeft, CalendarCheck } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { apiGet, apiPost } from '@/lib/api/client';
import { clsx } from 'clsx';
import { format, addHours } from 'date-fns';
import type { VenueDetail } from '@wemeet/shared';

function toLocalDatetimeInput(d: Date): string {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString().slice(0, 16);
}

export default function VenuePage() {
  const { id }  = useParams<{ id: string }>();
  const router  = useRouter();

  const [venue,     setVenue]     = useState<VenueDetail | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [submitting,setSubmitting]= useState(false);
  const [success,   setSuccess]   = useState(false);
  const [serverErr, setServerErr] = useState<string | null>(null);

  // Form state
  const now       = new Date();
  const defaultStart = addHours(now, 1);
  const defaultEnd   = addHours(now, 3);

  const [startTime,  setStartTime]  = useState(toLocalDatetimeInput(defaultStart));
  const [endTime,    setEndTime]    = useState(toLocalDatetimeInput(defaultEnd));
  const [stations,   setStations]   = useState(1);
  const [notes,      setNotes]      = useState('');

  useEffect(() => {
    apiGet<VenueDetail>(`/gaming/venues/${id}`)
      .then(setVenue)
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [id]);

  const computedCost = (): number => {
    if (!venue || !startTime || !endTime) return 0;
    const diff = new Date(endTime).getTime() - new Date(startTime).getTime();
    if (diff <= 0) return 0;
    const hours = Math.ceil(diff / 3_600_000);
    return hours * Number(venue.pricePerHour) * stations;
  };

  const handleBook = async () => {
    setSubmitting(true);
    setServerErr(null);
    try {
      await apiPost(`/gaming/venues/${venue!.id}/bookings`, {
        startTime: new Date(startTime).toISOString(),
        endTime:   new Date(endTime).toISOString(),
        stationsBooked: stations,
        notes: notes || undefined,
      });
      setSuccess(true);
    } catch (e: unknown) {
      setServerErr((e as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ?? 'Booking failed');
    } finally { setSubmitting(false); }
  };

  if (loading) return <AppShell><div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-brand-green border-t-transparent rounded-full animate-spin" /></div></AppShell>;
  if (!venue)  return <AppShell><div className="text-center py-16 text-ink-muted">Venue not found</div></AppShell>;

  const cost = computedCost();

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">

        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition">
          <ArrowLeft size={15} /> Back
        </button>

        {/* Venue header */}
        <div className="bg-surface rounded-2xl border border-border p-6">
          <h1 className="text-2xl font-bold text-ink">{venue.name}</h1>
          {venue.address && (
            <p className="flex items-center gap-1.5 text-sm text-ink-muted mt-1">
              <MapPin size={13} />{venue.address}
            </p>
          )}
          {venue.description && <p className="text-sm text-ink-soft mt-3 leading-relaxed">{venue.description}</p>}

          <div className="grid grid-cols-2 xs:grid-cols-3 gap-3 mt-4">
            <div className="bg-sand rounded-xl p-3 text-center">
              <Monitor size={18} className="mx-auto text-brand-green mb-1" />
              <p className="text-lg font-bold text-ink">{venue.stationCount}</p>
              <p className="text-xs text-ink-muted">Stations</p>
            </div>
            <div className="bg-sand rounded-xl p-3 text-center">
              <DollarSign size={18} className="mx-auto text-brand-green mb-1" />
              <p className="text-lg font-bold text-ink">{Number(venue.pricePerHour).toFixed(0)}</p>
              <p className="text-xs text-ink-muted">{venue.currency}/hr</p>
            </div>
            <div className="bg-sand rounded-xl p-3 text-center">
              <Clock size={18} className="mx-auto text-brand-green mb-1" />
              <p className="text-sm font-bold text-ink">{venue.openTime ?? '—'}</p>
              <p className="text-xs text-ink-muted">Opens</p>
            </div>
          </div>

          {venue.amenities.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {venue.amenities.map((a) => (
                <span key={a} className="text-xs bg-brand-green-light text-brand-green-dark font-medium px-2.5 py-1 rounded-full">{a}</span>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming bookings */}
        {venue.bookings.length > 0 && (
          <div>
            <h2 className="text-base font-bold text-ink mb-2">Upcoming Bookings</h2>
            <div className="space-y-2">
              {venue.bookings.map((b, i) => (
                <div key={i} className="flex items-center justify-between bg-sand rounded-xl border border-border px-4 py-2.5 text-sm">
                  <span className="text-ink-muted">{format(new Date(b.startTime), 'dd MMM HH:mm')} → {format(new Date(b.endTime), 'HH:mm')}</span>
                  <span className="text-xs font-semibold text-brand-green">{b.stationsBooked} station{b.stationsBooked !== 1 ? 's' : ''}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Booking form */}
        {success ? (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
            <CalendarCheck size={36} className="mx-auto text-green-600 mb-3" />
            <p className="font-bold text-green-800">Booking Confirmed!</p>
            <p className="text-sm text-green-700 mt-1">Your venue is reserved. Check your bookings for details.</p>
            <button onClick={() => setSuccess(false)} className="mt-4 text-sm text-green-700 underline">Book another slot</button>
          </div>
        ) : (
          <div className="bg-surface rounded-2xl border border-border p-6 space-y-4">
            <h2 className="text-lg font-bold text-ink">Book a Time Slot</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-ink-muted mb-1.5">Start Time</label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-sand focus:outline-none focus:border-brand-green transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-muted mb-1.5">End Time</label>
                <input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-sand focus:outline-none focus:border-brand-green transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-1.5">
                Stations (1–{venue.stationCount})
              </label>
              <input
                type="number" min={1} max={venue.stationCount} value={stations}
                onChange={(e) => setStations(Math.max(1, Math.min(venue.stationCount, Number(e.target.value))))}
                className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-sand focus:outline-none focus:border-brand-green transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-1.5">Notes (optional)</label>
              <textarea
                value={notes} onChange={(e) => setNotes(e.target.value)}
                rows={2} placeholder="Anything to tell the venue?"
                className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-sand focus:outline-none focus:border-brand-green transition resize-none"
              />
            </div>

            {/* Cost preview */}
            {cost > 0 && (
              <div className="flex items-center justify-between bg-brand-green-light rounded-xl px-4 py-3">
                <span className="text-sm text-brand-green-dark font-medium">Estimated cost</span>
                <span className="text-lg font-bold text-brand-green-dark">{cost.toFixed(2)} {venue.currency}</span>
              </div>
            )}

            {serverErr && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{serverErr}</p>
            )}

            <button
              onClick={handleBook}
              disabled={submitting || !startTime || !endTime}
              className={clsx(
                'w-full py-3.5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition',
                submitting || !startTime || !endTime
                  ? 'bg-brand-green/50 cursor-not-allowed'
                  : 'bg-brand-green hover:bg-brand-green-dark shadow-md',
              )}
            >
              {submitting
                ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Confirming…</>
                : <><CalendarCheck size={16} /> Confirm Booking</>
              }
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
