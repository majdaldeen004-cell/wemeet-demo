'use client';
import { clsx } from 'clsx';
import {
  Bike, Trees, BookOpen, Gamepad2, PawPrint, Coffee, Dumbbell,
  Users, UserCheck, UserX, LayoutGrid,
} from 'lucide-react';
import type { EventCategory, EventGenderFilter, EventFilters } from '@/types';

const CATEGORIES: { value: EventCategory | ''; label: string; icon?: React.ReactNode }[] = [
  { value: '',        label: 'الكل',      icon: <LayoutGrid size={12} /> },
  { value: 'CYCLING', label: 'دراجات',   icon: <Bike       size={12} /> },
  { value: 'OUTDOOR', label: 'طبيعة',    icon: <Trees      size={12} /> },
  { value: 'STUDY',   label: 'دراسة',    icon: <BookOpen   size={12} /> },
  { value: 'GAMING',  label: 'ألعاب',    icon: <Gamepad2   size={12} /> },
  { value: 'PETS',    label: 'حيوانات',  icon: <PawPrint   size={12} /> },
  { value: 'SOCIAL',  label: 'اجتماعي',  icon: <Coffee     size={12} /> },
  { value: 'SPORTS',  label: 'رياضة',    icon: <Dumbbell   size={12} /> },
];

// No MIXED option — only "الكل" (all), males only, females only
const GENDER_FILTERS: { value: EventGenderFilter | ''; label: string; icon?: React.ReactNode }[] = [
  { value: '',             label: 'الكل',      icon: <Users     size={12} /> },
  { value: 'MALES_ONLY',  label: 'ذكور فقط',  icon: <UserCheck size={12} /> },
  { value: 'FEMALES_ONLY',label: 'إناث فقط',  icon: <UserX     size={12} /> },
];

interface Props {
  filters: EventFilters;
  onChange: (f: Partial<EventFilters>) => void;
}

export const EventFiltersBar = ({ filters, onChange }: Props) => (
  <div className="space-y-3">
    {/* Category scroll */}
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {CATEGORIES.map(({ value, label, icon }) => (
        <button
          key={value}
          onClick={() => onChange({ category: value || undefined, page: 1 })}
          className={clsx(
            'flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
            filters.category === (value || undefined)
              ? 'bg-brand-green text-white border-brand-green'
              : 'bg-surface text-ink-soft border-border hover:border-brand-green',
          )}
        >
          {icon}{label}
        </button>
      ))}
    </div>

    {/* Gender filter */}
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {GENDER_FILTERS.map(({ value, label, icon }) => (
        <button
          key={value}
          onClick={() => onChange({ genderFilter: value || undefined, page: 1 })}
          className={clsx(
            'flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
            filters.genderFilter === (value || undefined)
              ? 'bg-brand-blue text-white border-brand-blue'
              : 'bg-surface text-ink-soft border-border hover:border-brand-blue',
          )}
        >
          {icon}{label}
        </button>
      ))}
    </div>
  </div>
);
