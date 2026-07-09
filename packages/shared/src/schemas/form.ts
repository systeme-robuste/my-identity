import { z } from "zod";

export const formFieldTypeSchema = z.enum([
  "text",
  "email",
  "phone",
  "textarea",
  "select",
  "checkbox",
  "radio",
  "date",
  "number",
  "url",
  "file",
]);

export const formFieldSchema = z.object({
  name: z.string().min(1).max(64).regex(/^[a-z][a-z0-9_]*$/, "Field name must be snake_case"),
  label: z.string().min(1).max(120),
  type: formFieldTypeSchema,
  required: z.boolean(),
  placeholder: z.string().max(120).nullable().optional(),
  options: z.array(z.string().min(1).max(200)).max(50).optional(),
  order: z.number().int().min(0).max(10_000),
});

export const createFormSchema = z.object({
  name: z.string().min(1).max(120),
  fields: z.array(formFieldSchema).min(1).max(100),
  successMessage: z.string().min(1).max(2000).default("Thanks — we'll be in touch."),
  emailTo: z.string().email().nullable().optional(),
  emailSubject: z.string().min(1).max(200).nullable().optional(),
  storeSubmissions: z.boolean().default(true),
  turnstileRequired: z.boolean().default(true),
});

export const submitFormSchema = z.object({
  data: z.record(z.union([z.string(), z.number(), z.boolean(), z.array(z.string())])),
  turnstileToken: z.string().min(1).max(2048).optional(),
});

export type CreateFormInput = z.infer<typeof createFormSchema>;
export type SubmitFormInput = z.infer<typeof submitFormSchema>;
