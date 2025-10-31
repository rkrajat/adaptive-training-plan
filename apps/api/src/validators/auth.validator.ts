import { z } from "zod";

/**
 * OAuth callback query parameters validation schema
 */
export const oauthCallbackQuerySchema = z.object({
  code: z.string().min(1, "Authorization code is required"),
  scope: z.string().optional(),
  error: z.string().optional(),
});

export type OAuthCallbackQuery = z.infer<typeof oauthCallbackQuerySchema>;
