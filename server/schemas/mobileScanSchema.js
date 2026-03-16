import { z } from 'zod';

export const scanUploadSchema = z.object({
    imageBase64: z.string().min(50).optional(),
    source: z.string().optional().default('mobile'),
    deviceId: z.string().optional().default(''),
});

export const confirmScanSchema = z.object({
    portalRefNo: z.string().min(1, 'Portal Ref No is required'),
    agency: z.string().optional().default(''),
    embassy: z.string().optional().default(''),
    appointmentDate: z.string().optional().default(''),
    appointmentTime: z.string().optional().default(''),
    departureDate: z.string().optional().default(''),
    tourName: z.string().optional().default(''),
    payment: z.enum(['', 'partial', 'paid']).default(''),
});