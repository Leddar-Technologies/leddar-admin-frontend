import { z } from "zod";

export const registerBrandSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  businessName: z.string(),
  productType: z.string(),
  whatsapp: z.string(),
  contactInfo: z.string(),
  acceptedTerms: z.literal(true, {
    errorMap: () => ({ message: "You must accept the terms and conditions" }),
  }),
});

export const registerArtisanSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string(),
  phone: z.string().optional(),
  whatsapp: z.string(),
  specialty: z.string(),
  yearsOfExperience: z.coerce.number().optional(),
  bio: z.string().optional(),
  city: z.string(),
  state: z.string(),
  // Note: If portfolio comes as files, Zod might not see them in req.body
  // but keeping it here for consistency if you're validating the array
  acceptedTerms: z.literal(true, {
    errorMap: () => ({ message: "You must accept the terms and conditions" }),
  }),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});
