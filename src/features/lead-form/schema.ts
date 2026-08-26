import { z } from "zod";
import { isValidPhoneNumber, type CountryCode } from "libphonenumber-js";
import { formContent } from "@/content";
import { countryCodes } from "./countries";

const telegramPattern = /^(?:@?[A-Za-z0-9_]{5,32}|https?:\/\/t\.me\/[A-Za-z0-9_]{5,32})$/i;

export const leadSchema = z.object({
  firstName: z.string().trim().min(2, formContent.errors.firstNameRequired).max(80, formContent.errors.firstNameLength),
  lastName: z.string().trim().min(2, formContent.errors.lastNameRequired).max(80, formContent.errors.lastNameLength),
  email: z.string().trim().email(formContent.errors.emailInvalid).max(160, formContent.errors.emailInvalid),
  phone: z
    .string()
    .trim()
    .refine((value) => isValidPhoneNumber(value), formContent.errors.phoneInvalid),
  telegram: z
    .string()
    .trim()
    .max(64, formContent.errors.telegramInvalid)
    .refine((value) => !value || telegramPattern.test(value), formContent.errors.telegramInvalid),
  country: z
    .string()
    .trim()
    .refine((value) => countryCodes.includes(value as CountryCode), formContent.errors.countryRequired),
  message: z.string().trim().min(30, formContent.errors.messageShort).max(3000, formContent.errors.messageLong),
  consent: z.boolean().refine(Boolean, formContent.errors.consentRequired),
  website: z.string().max(200).optional(),
});

export type LeadValues = z.infer<typeof leadSchema>;
