import { z } from 'zod';

// ─── Common Field Validators ──────────────────────────────────────────────────

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+[1-9]\d{7,14}$/, 'Phone must be in E.164 format (e.g. +966501234567)');

export const displayNameSchema = z
  .string()
  .trim()
  .min(2, 'Display name must be at least 2 characters')
  .max(40, 'Display name must not exceed 40 characters');

export const bioSchema = z
  .string()
  .trim()
  .max(200, 'Bio must not exceed 200 characters')
  .optional();

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const uuidSchema = z.string().uuid('Invalid ID format');

export const coordinateSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

// ─── Date Validators ──────────────────────────────────────────────────────────

export const futureDateSchema = z
  .string()
  .datetime({ offset: true })
  .refine((val) => new Date(val) > new Date(), {
    message: 'Date must be in the future',
  });

export const birthDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Birth date must be in YYYY-MM-DD format')
  .refine(
    (val) => {
      const date = new Date(val);
      const now = new Date();
      const age = now.getFullYear() - date.getFullYear();
      const hasBirthdayPassed =
        now.getMonth() > date.getMonth() ||
        (now.getMonth() === date.getMonth() && now.getDate() >= date.getDate());
      return hasBirthdayPassed ? age >= 18 : age - 1 >= 18;
    },
    { message: 'You must be at least 18 years old to use WeMeet' },
  );

// ─── OTP Validator ────────────────────────────────────────────────────────────

export const otpCodeSchema = z
  .string()
  .length(6, 'OTP must be exactly 6 digits')
  .regex(/^\d{6}$/, 'OTP must contain only digits');

// ─── Event Rule Validator ─────────────────────────────────────────────────────

export const eventRulesSchema = z
  .array(z.string().trim().min(3).max(120))
  .max(10, 'Maximum 10 rules allowed')
  .default([]);
