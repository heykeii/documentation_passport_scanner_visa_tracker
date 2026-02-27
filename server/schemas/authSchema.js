import {z} from 'zod';

export const signupSchema = z.object({
  email: z.string().email("Invalid email address").min(1,"Email is required"),
  password: z.string().min(6, "Password must be at least 6 characters").regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  name: z.string().min(2, "Name must be at least 2 characters").max(60, "Name must be less than 60 characters"),
  role: z.enum(['documentation']).default('documentation')
});

export const loginSchema = z.object({
    email: z.string().email("Invalid email address").min(1,"Email is required"),
    password: z.string().min(1, 'Password is required')
});

export const updatePasswordSchema = z.object({
    currentPassword: z.string().min(1, "Current password required"),
    newPassword: z.string().min(6, "Password must be at least 6 characters").regex(/[A-Z]/, "Must contain uppercase letter")
    .regex(/[0-9]/, "Must contain a number")
})