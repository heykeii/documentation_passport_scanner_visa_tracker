import { z } from "zod";

// ── Signup Schema ──────────────────────────────────────
// Mirrors: server/schemas/authSchema.js → signupSchema
export const signupSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be less than 50 characters"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[0-9]/, "Must contain at least one number"),
});

// ── Login Schema ───────────────────────────────────────
// Mirrors: server/schemas/authSchema.js → loginSchema
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address"),
  password: z
    .string()
    .min(1, "Password is required"),
});

// ── Password Strength Check (for UI feedback) ─────────
export const checkPasswordStrength = (password) => {
  let score = 0;
  
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9!@#$%^&*]/.test(password)) score++;
  
  if (score === 1) return { level: "weak", color: "#f87171" };
  if (score === 2) return { level: "fair", color: "#fb923c" };
  if (score >= 3) return { level: "strong", color: "#4ade80" };
  
  return { level: "weak", color: "#e2e8f0" };
};