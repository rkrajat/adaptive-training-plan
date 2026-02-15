import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const configSchema = z.object({
  // Server Configuration
  port: z.string().default("4000"),
  nodeEnv: z.enum(["development", "production", "test"]).default("development"),

  // Database Configuration
  mongoUri: z.string().min(1, "MONGO_URI is required"),

  // Strava Configuration
  strava: z.object({
    clientId: z.string().min(1, "STRAVA_CLIENT_ID is required"),
    clientSecret: z.string().min(1, "STRAVA_CLIENT_SECRET is required"),
    redirectUri: z.string().url(),
  }),

  // JWT Configuration
  jwt: z.object({
    secret: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
    expiresIn: z.string().default("24h"),
  }),

  // Frontend Configuration
  frontendUrl: z.string().url(),

  // OpenAI Configuration
  openai: z.object({
    apiKey: z.string().min(1, "OPENAI_API_KEY is required"),
    model: z.string().default("gpt-5.1"),
    temperature: z.number().min(0).max(2).default(0.7),
  }),

  // Application Constants
  activities: z.object({
    lookbackDays: z.number().int().positive().default(30),
    perPage: z.number().int().positive().default(200),
  }),

  // Rate Limiting
  rateLimit: z.object({
    windowMs: z
      .number()
      .int()
      .positive()
      .default(15 * 60 * 1000), // 15 minutes
    maxRequests: z.number().int().positive().default(200),
  }),

  // Recommendation Settings
  recommendation: z.object({
    expiryDayOfWeek: z.number().int().min(0).max(6).default(0), // 0=Sunday through 6=Saturday
  }),

  // Cache Settings
  cache: z.object({
    activitiesTtlMs: z.number().int().positive().default(600000), // 10 min in ms
    maxEntries: z.number().int().positive().default(1000),
  }),
});

const parseConfig = () => {
  const rawConfig = {
    port: process.env.PORT,
    nodeEnv: process.env.NODE_ENV,
    mongoUri: process.env.MONGODB_URI,
    strava: {
      clientId: process.env.STRAVA_CLIENT_ID,
      clientSecret: process.env.STRAVA_CLIENT_SECRET,
      redirectUri: process.env.STRAVA_REDIRECT_URI,
    },
    jwt: {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRES_IN,
    },
    frontendUrl: process.env.FRONTEND_URL,
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL,
      temperature: process.env.OPENAI_TEMPERATURE
        ? parseFloat(process.env.OPENAI_TEMPERATURE)
        : undefined,
    },
    activities: {
      lookbackDays: process.env.STRAVA_LOOKBACK_DAYS
        ? parseInt(process.env.STRAVA_LOOKBACK_DAYS, 10)
        : undefined,
      perPage: process.env.STRAVA_ACTIVITIES_PER_PAGE
        ? parseInt(process.env.STRAVA_ACTIVITIES_PER_PAGE, 10)
        : undefined,
    },
    rateLimit: {
      windowMs: process.env.RATE_LIMIT_WINDOW_MS
        ? parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10)
        : undefined,
      maxRequests: process.env.RATE_LIMIT_MAX_REQUESTS
        ? parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10)
        : undefined,
    },
    recommendation: {
      expiryDayOfWeek: process.env.RECOMMENDATION_EXPIRY_DAY_OF_WEEK
        ? parseInt(process.env.RECOMMENDATION_EXPIRY_DAY_OF_WEEK, 10)
        : undefined,
    },
    cache: {
      activitiesTtlMs: process.env.CACHE_ACTIVITIES_TTL_MS
        ? parseInt(process.env.CACHE_ACTIVITIES_TTL_MS, 10)
        : undefined,
      maxEntries: process.env.CACHE_MAX_ENTRIES
        ? parseInt(process.env.CACHE_MAX_ENTRIES, 10)
        : undefined,
    },
  };

  try {
    return configSchema.parse(rawConfig);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues
        .map((err: z.ZodIssue) => `${err.path.join(".")}: ${err.message}`)
        .join("\n");
      throw new Error(
        `Configuration validation failed:\n${errorMessages}\n\nPlease check your .env file.`
      );
    }
    throw error;
  }
};

export const config = parseConfig();

export type Config = z.infer<typeof configSchema>;
