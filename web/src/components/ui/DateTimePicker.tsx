'use client';

/**
 * web/src/components/ui/DateTimePicker.tsx
 *
 * Custom Arabic date/time picker — embedded calendar + scroll-wheel time.
 * No native <input type="datetime-local"> used anywhere.
 *
 * Props:
 *   value      — controlled Date | null
 *   onChange   — called with confirmed Date
 *   label      — optional field label
 *   placeholder— shown when no value
 *   minDate    — disables dates before this
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Clock, Check } from 'lucide-react';

// ─── Arabic locale tables ─────────────────────────────────────────────────────

const AR_MONTHS = [
  'يناير','فبراير','مارس','أبريل','مايو','يونيو',
  'يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر',
];
const AR_DAYS_SHORT  = ['أحد','إث','ثل','أرب','خم','جم','سب'];
const AR_DAYS_FULL   = ['الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];

function formatDisplay(date: Date): string {
  const d   = date.getDate().toString().padStart(2, '0');
  const mon = AR_MONTHS[date.getMonth()];
  const y   = date.getFullYear();
  const day = AR_DAYS_FULL[date.getDay()];
  const h   = date.getHours().toString().padStart(2, '0');
  const m   = date.getMinutes().toString().padStart(2, '0');
  return `${day}، ${d} ${mon} ${y} - ${h}:${m}`;
}

// ─── Scroll-wheel list ────────────────────────────────────────────────────────

interface WheelProps {
  items:    string[];
  selected: number;
  onSelect: (i: number) => void;
}

const ITEM_H = 36; // px per wheel row

function ScrollWheel({ items, selected, onSelect }: WheelProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Centre the selected item on mount + whenever it changes
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.scrollTo({ top: selected * ITEM_H, behavior: 'smooth' });
  }, [selected]);

  const handleScroll = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const idx = Math.round(el.scrollTop / ITEM_H);
    if (idx !== selected && idx >= 0 && idx < items.length) onSelect(idx);
  }, [items.length, onSelect, selected]);

  return (
    <div className="relative flex-1 select-none">
      {/* Top fade */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-10 z-10"
        style={{ background: 'linear-gradient(to bottom, var(--color-surface, #fff), transparent)' }} />

      {/* Scrollable list */}
      <div
        ref={ref}
        onScroll={handleScroll}
        className="h-32 overflow-y-scroll rounded-xl border border-border bg-surface"
        style={{ scrollSnapType: 'y mandatory', scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
      >
        {/* Padding so first/last items can centre */}
        <div style={{ height: 48 }} />
        {items.map((label, i) => (
          <div
            key={i}
            onClick={() => onSelect(i)}
            style={{ scrollSnapAlign: 'center', height: ITEM_H }}
            className={`flex items-center justify-center text-sm cursor-pointer transition-colors font-medium
              ${i === selected
                ? 'bg-brand-green text-white rounded-lg mx-1 font-bold'
                : 'text-ink hover:bg-sand'}`}
          >
            {label}
          </div>
        ))}
        <div style={{ height: 48 }} />
      </div>

      {/* Bottom fade */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 z-10"
        style={{ background: 'linear-gradient(to top, var(--color-surface, #fff), transparent)' }} />
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export interface DateTimePickerProps {
  value:       Date | null;
  onChange:    (date: Date) => void;
  label?:      string;
  placeholder?: string;
  minDate?:    Date;
  error?:      string;
}

const HOURS   = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

export function DateTimePicker({
  value, onChange, label, placeholder = 'اختر التاريخ والوقت', minDate, error,
}: DateTimePickerProps) {

  const now = new Date();

  // ── Internal state ──────────────────────────────────────────────────────────
  const [open,      setOpen]      = useState(false);
  const [viewYear,  setViewYear]  = useState(value?.getFullYear()  ?? now.getFullYear());
  const [viewMonth, setViewMonth] = useState(value?.getMonth()     ?? now.getMonth());
  const [selDay,    setSelDay]    = useState<number | null>(value?.getDate()         ?? null);
  const [selMonth,  setSelMonth]  = useState<number | null>(value?.getMonth()        ?? null);
  const [selYear,   setSelYear]   = useState<number | null>(value?.getFullYear()     ?? null);
  const [hour,      setHour]      = useState(value?.getHours()   ?? 8);
  const [minute,    setMinute]    = useState(value?.getMinutes() ?? 0);

  const wrapRef = useRef<HTMLDivElement>(null);

  // ── Sync with controlled value ──────────────────────────────────────────────
  useEffect(() => {
    if (!value) return;
    setViewYear(value.getFullYear());
    setViewMonth(value.getMonth());
    setSelDay(value.getDate());
    setSelMonth(value.getMonth());
    setSelYear(value.getFullYear());
    setHour(value.getHours());
    setMinute(value.getMinutes());
  }, [value]);

  // ── Close on outside click ──────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  // ── Calendar helpers ────────────────────────────────────────────────────────
  const daysInMonth    = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const firstDayOfMon  = (y: number, m: number) => new Date(y, m, 1).getDay();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const isBefore = (day: number) => {
    if (!minDate) return false;
    const min = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());
    return new Date(viewYear, viewMonth, day) < min;
  };

  const isSelected = (day: number) =>
    selDay === day && selMonth === viewMonth && selYear === viewYear;

  const isToday = (day: number) =>
    now.getDate() === day && now.getMonth() === viewMonth && now.getFullYear() === viewYear;

  // Build calendar grid (null = empty cell)
  const cells: (number | null)[] = [
    ...Array(firstDayOfMon(viewYear, viewMonth)).fill(null),
    ...Array.from({ length: daysInMonth(viewYear, viewMonth) }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  // ── Day click: select day, keep open to adjust time ────────────────────────
  const pickDay = (day: number) => {
    if (isBefore(day)) return;
    setSelDay(day);
    setSelMonth(viewMonth);
    setSelYear(viewYear);
  };

  // ── Confirm: assemble Date and call onChange ────────────────────────────────
  const confirm = () => {
    const d = new Date(
      selYear  ?? viewYear,
      selMonth ?? viewMonth,
      selDay   ?? 1,
      hour, minute,
    );
    onChange(d);
    setOpen(false);
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div ref={wrapRef} className="relative">
      {label && (
        <label className="block text-sm font-medium text-ink mb-1.5">{label}</label>
      )}

      {/* ── Trigger (entire field is clickable) ── */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-sm text-left transition-colors focus:outline-none focus:ring-2 focus:ring-brand-green/30
          ${error ? 'border-red-400 bg-red-50' : 'border-border-sand bg-sand-dark hover:border-brand-green/60'}
          ${open ? 'border-brand-green/60 ring-2 ring-brand-green/20' : ''}`}
      >
        <Calendar size={16} className="flex-shrink-0 text-ink-muted" />
        <span className={value ? 'text-ink flex-1' : 'text-ink-muted flex-1'}>
          {value ? formatDisplay(value) : placeholder}
        </span>
      </button>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}

      {/* ── Dropdown ── */}
      {open && (
        <div
          className="absolute z-50 mt-2 left-0 bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden"
          style={{ width: 316 }}
        >

          {/* ─ Calendar ─ */}
          <div className="p-4">
            {/* Month nav */}
            <div className="flex items-center justify-between mb-3">
              <button
                type="button" onClick={prevMonth}
                className="p-1.5 rounded-lg hover:bg-sand transition text-ink-muted hover:text-ink"
              >
                <ChevronRight size={15} />
              </button>
              <span className="text-sm font-bold text-ink">
                {AR_MONTHS[viewMonth]} {viewYear}
              </span>
              <button
                type="button" onClick={nextMonth}
                className="p-1.5 rounded-lg hover:bg-sand transition text-ink-muted hover:text-ink"
              >
                <ChevronLeft size={15} />
              </button>
            </div>

            {/* Day-of-week headers (Sun→Sat, Arabic) */}
            <div className="grid grid-cols-7 mb-1">
              {AR_DAYS_SHORT.map(d => (
                <div key={d} className="text-center text-[11px] font-bold text-ink-muted py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Date cells */}
            <div className="grid grid-cols-7 gap-y-0.5">
              {cells.map((day, idx) => (
                <div key={idx} className="flex items-center justify-center">
                  {day ? (
                    <button
                      type="button"
                      onClick={() => pickDay(day)}
                      disabled={isBefore(day)}
                      className={`w-9 h-9 rounded-full text-[13px] font-medium transition-all
                        ${isSelected(day)
                          ? 'bg-brand-green text-white font-bold shadow-sm'
                          : isToday(day)
                            ? 'border-2 border-brand-green text-brand-green'
                            : isBefore(day)
                              ? 'text-ink-muted/30 cursor-not-allowed'
                              : 'text-ink hover:bg-brand-green-light hover:text-brand-green-dark'
                        }`}
                    >
                      {day}
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          {/* ─ Time picker ─ */}
          <div className="border-t border-border bg-sand/40 px-4 py-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Clock size={12} className="text-ink-muted" />
              <span className="text-[11px] font-bold text-ink-muted tracking-wide">الوقت</span>
            </div>

            <div className="flex items-center gap-3">
              {/* Hours scroll wheel */}
              <ScrollWheel items={HOURS}   selected={hour}   onSelect={setHour}   />
              <span className="text-ink font-black text-xl pb-1">:</span>
              {/* Minutes scroll wheel */}
              <ScrollWheel items={MINUTES} selected={minute} onSelect={setMinute} />
            </div>
          </div>

          {/* ─ Confirm ─ */}
          <div className="px-4 pb-4 pt-3 border-t border-border/50">
            <button
              type="button"
              onClick={confirm}
              disabled={selDay === null}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-green text-white text-sm font-bold hover:bg-brand-green-dark transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Check size={15} />
              {selDay ? `اختيار — ${selDay.toString().padStart(2,'0')}/${((selMonth??0)+1).toString().padStart(2,'0')} ${hour.toString().padStart(2,'0')}:${minute.toString().padStart(2,'0')}` : 'اختر يوماً أولاً'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
