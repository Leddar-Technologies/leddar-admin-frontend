import { z } from "zod";

export const registerBrandSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  businessName: z.string(),
  productType: z.string(),
  whatsapp: z.string(),
  contactInfo: z.string(),
});

export const registerArtisanSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string(),
  phone: z.string().optional(),
  whatsapp: z.string(),
  specialty: z.string(),
  yearsOfExperience: z.number().optional(),
  bio: z.string().optional(),
  city: z.string(),
  state: z.string(),
  portfolio: z.array(z.string()).min(3),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});
