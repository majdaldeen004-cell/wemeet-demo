import { useRouter } from 'next/navigation';
import { MapPin, Users, Calendar, Lock, Eye, Globe, Bike, Trees, BookOpen, Gamepad2, PawPrint, Coffee, Dumbbell, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Card, Badge, Avatar } from '@/components/ui';
import type { Event } from '@/types';

const CATEGORY_ICON: Record<string, React.ReactNode> = {
  CYCLING: <Bike size={13} className="text-green-600" />,
  OUTDOOR: <Trees size={13} className="text-green-700" />,
  STUDY:   <BookOpen size={13} className="text-blue-500" />,
  GAMING:  <Gamepad2 size={13} className="text-purple-500" />,
  PETS:    <PawPrint size={13} className="text-amber-500" />,
  SOCIAL:  <Coffee size={13} className="text-pink-500" />,
  SPORTS:  <Dumbbell size={13} className="text-red-500" />,
  OTHER:   <Sparkles size={13} className="text-slate-400" />,
};

const CATEGORY_LABEL: Record<string, string> = {
  CYCLING:'دراجات', OUTDOOR:'طبيعة', STUDY:'دراسة', GAMING:'ألعاب',
  PETS:'حيوانات', SOCIAL:'اجتماعي', SPORTS:'رياضة', OTHER:'أخرى',
};
const GENDER_LABEL: Record<string, string> = {
  MALES_ONLY: 'ذكور فقط', FEMALES_ONLY: 'إناث فقط', MIXED: 'مختلط',
};
const VISIBILITY_ICON: Record<string, React.ReactNode> = {
  PUBLIC:     <Globe size={12} />,
  RESTRICTED: <Eye size={12} />,
  PRIVATE:    <Lock size={12} />,
};

export const EventCard = ({ event }: { event: Event }) => {
  const router = useRouter();
  const isMember = event.myMembership?.status === 'APPROVED';

  return (
    <Card
      className="p-4 space-y-3"
      onClick={() => router.push(`/events/${event.id}`)}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            {CATEGORY_ICON[event.category] ?? <Sparkles size={13} className="text-slate-400" />}
            <span className="text-xs font-medium text-ink-muted">{CATEGORY_LABEL[event.category] ?? event.category}</span>
            <h3 className="font-semibold text-ink text-sm truncate">{event.title}</h3>
          </div>
          {event.description && (
            <p className="text-xs text-ink-muted line-clamp-2">{event.description}</p>
          )}
        </div>
        {isMember && (
          <Badge variant="green">Joined</Badge>
        )}
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap gap-2">
        <div className="flex items-center gap-1 text-xs text-ink-muted">
          {VISIBILITY_ICON[event.visibility]}
          <span>{event.visibility.toLowerCase()}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-ink-muted">
          <Users size={12} />
          <span>{event.memberCount}{event.maxAttendees ? `/${event.maxAttendees}` : ''}</span>
        </div>
        <Badge variant="sand">{GENDER_LABEL[event.genderFilter]}</Badge>
      </div>

      {/* Time + location */}
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-xs text-ink-soft">
          <Calendar size={12} className="text-brand-green flex-shrink-0" />
          <span>{format(new Date(event.scheduledAt), 'EEE, d MMM · h:mm a', { locale: ar })}</span>
        </div>
        {event.locationName && (
          <div className="flex items-center gap-1.5 text-xs text-ink-soft">
            <MapPin size={12} className="text-brand-green flex-shrink-0" />
            <span className="truncate">{event.locationName}</span>
          </div>
        )}
      </div>

      {/* Organizer */}
      <div className="flex items-center gap-2 pt-1 border-t border-border">
        <Avatar src={event.organizer.avatarUrl} name={event.organizer.displayName} size="sm" />
        <span className="text-xs text-ink-muted">by <span className="text-ink font-medium">{event.organizer.displayName}</span></span>
      </div>
    </Card>
  );
};
