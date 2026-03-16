import {z} from 'zod';

export const extractedPassportSchema = z.object({
    surname: z.string().optional().default(''),
    firstName: z.string().optional().default(''),
    middleName: z.string().optional().default(''),
    dateOfBirth: z.string().optional().default(''),
    passportNumber: z.string().optional().default(''),
    dateOfIssue: z.string().optional().default(''),
    dateOfExpiry: z.string().optional().default(''),
    confidence: z.object({
        surname: z.number().min(0).max(1).optional(),
        firstName: z.number().min(0).max(1).optional(),
        middleName: z.number().min(0).max(1).optional(),
        dateOfBirth: z.number().min(0).max(1).optional(),
        passportNumber: z.number().min(0).max(1).optional(),
        dateOfIssue: z.number().min(0).max(1).optional(),
        dateOfExpiry: z.number().min(0).max(1).optional(),
    }).optional().default({}),
});