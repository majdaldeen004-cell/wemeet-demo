'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, FormProvider, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PlusCircle, X, ArrowLeft, Map, MapPin, ImagePlus, Camera } from 'lucide-react';
import dynamic from 'next/dynamic';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui';
import { FormInput, FormSelect, FormTextarea } from '@/components/forms/FormFields';
import { DateTimePicker } from '@/components/ui/DateTimePicker';
import { useCreateEvent } from '@/hooks/useEvents';
import { createEventSchema, type CreateEventFormValues } from '@/lib/validation/schemas';
import { apiClient } from '@/lib/api/client';

const LocationPicker = dynamic(
  () => import('@/components/maps/EventMap').then((m) => m.LocationPicker),
  { ssr: false, loading: () => <div className="w-full h-[280px] bg-sand-dark rounded-xl animate-pulse" /> },
);
const RouteDrawer = dynamic(
  () => import('@/components/maps/EventMap').then((m) => m.RouteDrawer),
  { ssr: false, loading: () => <div className="w-full h-[320px] bg-sand-dark rounded-xl animate-pulse" /> },
);

const CATEGORIES = [
  { value: 'CYCLING', label: 'دراجات' }, { value: 'OUTDOOR', label: 'طبيعة' },
  { value: 'STUDY',   label: 'دراسة' },  { value: 'GAMING',  label: 'ألعاب' },
  { value: 'PETS',    label: 'حيوانات' },{ value: 'SOCIAL',  label: 'اجتماعي' },
  { value: 'SPORTS',  label: 'رياضة' },  { value: 'OTHER',   label: 'أخرى' },
];
const VISIBILITY = [
  { value: 'PUBLIC',     label: 'عام — يمكن للجميع الانضمام' },
  { value: 'RESTRICTED', label: 'مقيّد — يتطلب موافقة' },
  { value: 'PRIVATE',    label: 'خاص — بكود دعوة فقط' },
];
const GENDER = [
  { value: 'MIXED',        label: 'الكل' },
  { value: 'MALES_ONLY',   label: 'ذكور فقط' },
  { value: 'FEMALES_ONLY', label: 'إناث فقط' },
];

const ROUTE_CATEGORIES = ['CYCLING', 'OUTDOOR', 'SPORTS'];

export default function CreateEventPage() {
  const router = useRouter();
  const { create, loading } = useCreateEvent();
  const [ruleInput, setRuleInput] = useState('');
  const [location, setLocation] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const [routePolyline, setRoutePolyline] = useState('');
  const [routeDistKm, setRouteDistKm] = useState(0);
  const [showMap, setShowMap] = useState(false);
  const [showRoute, setShowRoute] = useState(false);
  // Cover image
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setCoverPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const methods = useForm<CreateEventFormValues>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      title: '', description: '', category: 'SOCIAL',
      visibility: 'PUBLIC', genderFilter: 'MIXED',
      maxAttendees: '', scheduledAt: '', endsAt: '',
      locationName: '', rules: [],
    },
  });

  const watchCategory = methods.watch('category');

  const { fields: ruleFields, append: appendRule, remove: removeRule } = useFieldArray({
    control: methods.control,
    name: 'rules' as never,
  });

  const handleAddRule = () => {
    if (!ruleInput.trim() || ruleFields.length >= 10) return;
    appendRule(ruleInput.trim() as never);
    setRuleInput('');
  };

  const handleSubmit = methods.handleSubmit(async (data) => {
    // Upload cover image first (reuses avatar storage endpoint)
    let coverImageUrl: string | undefined;
    if (coverFile) {
      const form = new FormData();
      form.append('avatar', coverFile);
      const res = await apiClient.post<{ data: { avatarUrl: string } }>(
        '/users/me/avatar', form,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      coverImageUrl = res.data.data.avatarUrl ?? undefined;
    }

    const event = await create({
      title:        data.title,
      description:  data.description || undefined,
      category:     data.category,
      visibility:   data.visibility,
      genderFilter: data.genderFilter,
      maxAttendees: data.maxAttendees ? Number(data.maxAttendees) : undefined,
      scheduledAt:  new Date(data.scheduledAt).toISOString(),
      endsAt:       data.endsAt ? new Date(data.endsAt).toISOString() : undefined,
      locationName: location?.name || data.locationName || undefined,
      location:     location ? { lat: location.lat, lng: location.lng } : undefined,
      routePolyline: routePolyline || undefined,
      rules:        data.rules as string[],
      coverImage:   coverImageUrl,
    });
    if (event) router.push(`/events/${event.id}`);
  });

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-ink-muted hover:text-ink transition">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-ink">Create event</h1>
        </div>

        <FormProvider {...methods}>
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Cover image */}
            <Card className="p-4 space-y-3">
              <p className="text-xs font-semibold text-ink-muted uppercase tracking-widest">صورة الغلاف (اختياري)</p>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleCoverChange}
              />
              {coverPreview ? (
                <div className="relative rounded-xl overflow-hidden" style={{ height: 160 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={coverPreview} alt="غلاف الفعالية" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => { setCoverFile(null); setCoverPreview(null); if (coverInputRef.current) coverInputRef.current.value = ''; }}
                    className="absolute top-2 left-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80 transition"
                  >
                    <X size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => coverInputRef.current?.click()}
                    className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-black/60 text-white text-xs rounded-xl px-3 py-1.5 hover:bg-black/80 transition"
                  >
                    <Camera size={12} /> تغيير الصورة
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  className="w-full rounded-xl border-2 border-dashed border-border-sand flex flex-col items-center justify-center gap-2 py-8 hover:border-brand-green hover:bg-brand-green-light/20 transition"
                >
                  <ImagePlus size={28} className="text-ink-muted" />
                  <span className="text-sm text-ink-muted">اضغط لإضافة صورة غلاف</span>
                  <span className="text-xs text-ink-muted opacity-70">JPEG · PNG · WebP — حتى 5 ميجابايت</span>
                </button>
              )}
            </Card>

            {/* Basic info */}
            <Card className="p-4 space-y-4">
              <p className="text-xs font-semibold text-ink-muted uppercase tracking-widest">Basic info</p>
              <FormInput<CreateEventFormValues> name="title" label="العنوان" placeholder="Morning cycling tour" required />
              <FormTextarea<CreateEventFormValues> name="description" label="الوصف" placeholder="Tell people what this is about..." rows={3} />
              <FormSelect<CreateEventFormValues> name="category" label="الفئة" options={CATEGORIES} required />
            </Card>

            {/* Date & location */}
            <Card className="p-4 space-y-4">
              <p className="text-xs font-semibold text-ink-muted uppercase tracking-widest">Date & location</p>
              <Controller
                control={methods.control}
                name="scheduledAt"
                render={({ field, fieldState }) => (
                  <DateTimePicker
                    label="تاريخ ووقت البدء"
                    value={field.value ? new Date(field.value) : null}
                    onChange={(d) => field.onChange(d.toISOString())}
                    minDate={new Date()}
                    error={fieldState.error?.message}
                  />
                )}
              />
              <Controller
                control={methods.control}
                name="endsAt"
                render={({ field, fieldState }) => (
                  <DateTimePicker
                    label="وقت الانتهاء (اختياري)"
                    value={field.value ? new Date(field.value) : null}
                    onChange={(d) => field.onChange(d.toISOString())}
                    minDate={new Date()}
                    error={fieldState.error?.message}
                  />
                )}
              />

              {/* Location picker toggle */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-ink">Location</label>
                  <button
                    type="button"
                    onClick={() => setShowMap(!showMap)}
                    className="flex items-center gap-1 text-xs text-brand-blue hover:underline"
                  >
                    <Map size={12} />
                    {showMap ? 'إخفاء الخريطة' : 'اختر على الخريطة'}
                  </button>
                </div>

                {location ? (
                  <div className="flex items-center gap-2 bg-brand-green-light border border-green-200 rounded-xl px-3 py-2">
                    <span className="text-green-700 text-sm flex-1 truncate flex items-center gap-1"><MapPin size={12}/>{location.name}</span>
                    <button type="button" onClick={() => { setLocation(null); setShowMap(false); }} className="text-ink-muted hover:text-red-500">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <FormInput<CreateEventFormValues>
                    name="locationName"
                    placeholder="e.g. Corniche, Jeddah (or pick on map)"
                  />
                )}

                {showMap && (
                  <LocationPicker
                    value={location ?? undefined}
                    onChange={(loc) => { setLocation(loc); methods.setValue('locationName', loc.name); }}
                    height="280px"
                  />
                )}
              </div>

              {/* Route drawer for cycling/outdoor/sports */}
              {ROUTE_CATEGORIES.includes(watchCategory) && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-ink">Route (optional)</label>
                    <button
                      type="button"
                      onClick={() => setShowRoute(!showRoute)}
                      className="text-xs text-brand-blue hover:underline"
                    >
                      {showRoute ? 'إخفاء رسم المسار' : '+ رسم المسار'}
                    </button>
                  </div>
                  {routePolyline && !showRoute && (
                    <div className="flex items-center gap-2 bg-brand-blue-light border border-blue-200 rounded-xl px-3 py-2">
                      <span className="text-blue-700 text-sm flex-1">تم تحديد المسار — {routeDistKm} كم</span>
                      <button type="button" onClick={() => { setRoutePolyline(''); setRouteDistKm(0); }} className="text-ink-muted hover:text-red-500">
                        <X size={14} />
                      </button>
                    </div>
                  )}
                  {showRoute && (
                    <RouteDrawer
                      onChange={(poly, dist) => { setRoutePolyline(poly); setRouteDistKm(dist); }}
                      height="320px"
                    />
                  )}
                </div>
              )}
            </Card>

            {/* Settings */}
            <Card className="p-4 space-y-4">
              <p className="text-xs font-semibold text-ink-muted uppercase tracking-widest">Settings</p>
              <FormSelect<CreateEventFormValues> name="visibility" label="الظهور" options={VISIBILITY} />
              <FormSelect<CreateEventFormValues> name="genderFilter" label="فلتر الجنس" options={GENDER} />
              <FormInput<CreateEventFormValues> name="maxAttendees" label="الحد الأقصى للحضور (اختياري)" type="number" placeholder="Unlimited" />
            </Card>

            {/* Rules */}
            <Card className="p-4 space-y-3">
              <p className="text-xs font-semibold text-ink-muted uppercase tracking-widest">Rules ({ruleFields.length}/10)</p>
              {ruleFields.map((field, i) => (
                <div key={field.id} className="flex items-center gap-2 bg-sand rounded-xl px-3 py-2">
                  <span className="text-brand-green font-bold text-sm flex-shrink-0">{i + 1}.</span>
                  <span className="text-sm text-ink flex-1">{methods.getValues(`rules.${i}` as 'rules.0') as unknown as string}</span>
                  <button type="button" onClick={() => removeRule(i)} className="text-ink-muted hover:text-red-500 flex-shrink-0">
                    <X size={14} />
                  </button>
                </div>
              ))}
              {ruleFields.length < 10 && (
                <div className="flex gap-2">
                  <input
                    className="flex-1 rounded-xl border border-border-sand bg-sand-dark px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green placeholder:text-ink-muted"
                    placeholder="Add a rule..."
                    value={ruleInput}
                    onChange={(e) => setRuleInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddRule(); } }}
                  />
                  <Button type="button" variant="ghost" size="sm" onClick={handleAddRule}>
                    <PlusCircle size={16} /> Add
                  </Button>
                </div>
              )}
            </Card>

            <Button type="submit" fullWidth size="lg" loading={loading}>
              إنشاء الفعالية
            </Button>
          </form>
        </FormProvider>
      </div>
    </AppShell>
  );
}
