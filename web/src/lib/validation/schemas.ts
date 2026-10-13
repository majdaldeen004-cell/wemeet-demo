import { z } from 'zod';

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(/^\+[1-9]\d{7,14}$/, 'Enter phone with country code (e.g. +966501234567)'),
});

export const otpSchema = z.object({
  code: z
    .string()
    .length(6, 'Must be exactly 6 digits')
    .regex(/^\d{6}$/, 'Digits only'),
});

export const completeProfileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, 'At least 2 characters')
    .max(40, 'Max 40 characters'),
  birthDate: z
    .string()
    .min(1, 'Required')
    .refine((val) => {
      const d = new Date(val);
      const age = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
      return age >= 18;
    }, 'You must be at least 18 years old'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']),
  bio: z.string().trim().max(200, 'Max 200 characters').optional(),
});

export type LoginFormValues          = z.infer<typeof loginSchema>;
export type OtpFormValues            = z.infer<typeof otpSchema>;
export type CompleteProfileFormValues= z.infer<typeof completeProfileSchema>;

// ─── Profile Update ───────────────────────────────────────────────────────────

export const updateProfileSchema = z.object({
  displayName: z.string().trim().min(2, 'At least 2 characters').max(40, 'Max 40 characters'),
  bio: z.string().trim().max(200, 'Max 200 characters').optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']).optional(),
});
export type UpdateProfileFormValues = z.infer<typeof updateProfileSchema>;

// ─── Create Event ─────────────────────────────────────────────────────────────

export const createEventSchema = z.object({
  title: z.string().trim().min(3, 'At least 3 characters').max(80, 'Max 80 characters'),
  description: z.string().trim().max(1000, 'Max 1000 characters').optional(),
  category: z.enum(['CYCLING', 'OUTDOOR', 'STUDY', 'GAMING', 'PETS', 'SOCIAL', 'SPORTS', 'OTHER']),
  visibility: z.enum(['PUBLIC', 'RESTRICTED', 'PRIVATE']),
  genderFilter: z.enum(['MALES_ONLY', 'FEMALES_ONLY', 'MIXED']),
  maxAttendees: z.coerce.number().int().min(2).max(500).optional().or(z.literal('')),
  scheduledAt: z
    .string()
    .min(1, 'Required')
    .refine((v) => new Date(v) > new Date(), 'Must be in the future'),
  endsAt: z.string().optional(),
  locationName: z.string().trim().max(120).optional(),
  rules: z.array(z.string().trim().min(3).max(120)).max(10).default([]),
}).refine(
  (d) => !d.endsAt || !d.scheduledAt || new Date(d.endsAt) > new Date(d.scheduledAt),
  { message: 'End time must be after start time', path: ['endsAt'] },
);
export type CreateEventFormValues = z.infer<typeof createEventSchema>;

// ─── Chat message ─────────────────────────────────────────────────────────────

export const chatMessageSchema = z.object({
  content: z.string().trim().min(1, 'Cannot be empty').max(1000, 'Max 1000 characters'),
});
export type ChatMessageFormValues = z.infer<typeof chatMessageSchema>;
