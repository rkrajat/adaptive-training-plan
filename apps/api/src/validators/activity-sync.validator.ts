import { z } from "zod";

/**
 * Response schema for activity sync endpoint
 * Used for type validation and documentation
 */
export const activitySyncResponseSchema = z.object({
  totalUsers: z.number(),
  processedUsers: z.number(),
  failedUsers: z.number(),
  activitiesSynced: z.number(),
  activitiesDeleted: z.number(),
  failures: z.array(
    z.object({
      userId: z.string(),
      error: z.string(),
    })
  ),
  durationMs: z.number(),
});

/**
 * Inferred TypeScript type from the response schema
 */
export type ActivitySyncResponse = z.infer<typeof activitySyncResponseSchema>;
