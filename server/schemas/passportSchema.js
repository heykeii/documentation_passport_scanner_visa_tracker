import {z} from 'zod';

export const passportSchema = z.object({
  passportNumber: z.string().min(5, "Invalid Passport Number"),
  firstName: z.string().min(1, "First Name is required"),
  lastName: z.string().min(1, "Last Name is required"),
  nationality: z.string().length(3, "Use 3-letter ISO code (e.g., PHL)"),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format: YYYY-MM-DD"),
  expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format: YYYY-MM-DD"),
  imageUrl: z.string().url("Valid Cloudinary URL required"),
});