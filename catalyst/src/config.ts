import { z } from "zod";

const positiveInt = (fallback: number) => z.coerce.number().int().positive().default(fallback);

export const environmentSchema = z.object({
  PUBLISHING_HMAC_SECRET: z.string().min(32),
  INTERNAL_JOB_SECRET: z.string().min(32),
  CATALYST_STRATUS_PRIVATE_BUCKET: z.string().trim().min(3),
  CATALYST_STRATUS_PUBLIC_BUCKET: z.string().trim().min(3),
  CATALYST_STRATUS_PUBLIC_BASE_URL: z.string().url(),
  PUBLIC_SITE_BASE_URL: z.string().url().optional(),
  CATALYST_JOBPOOL_NAME: z.string().default("genedrift-publishing"),
  CATALYST_APPSAIL_NAME: z.string().default("genedrift-publishing"),
  CATALYST_APPSAIL_BASE_URL: z.string().url(),
  CATALYST_APPSAIL_JOB_PATH: z.string().default("/internal/jobs/publish"),
  CATALYST_APPSAIL_CALLBACK_PATH: z.string().default("/internal/jobs/callback"),
  CREATOR_CALLBACK_URL: z.string().url(),
  CREATOR_VALIDATE_URL: z.string().url(),
  CREATOR_API_BASE_URL: z.string().url().default("https://www.zohoapis.in"),
  CREATOR_ACCOUNT_OWNER: z.string().trim().min(1),
  CREATOR_APP_LINK_NAME: z.string().trim().min(1),
  CREATOR_MEDIA_REPORT_LINK_NAME: z.string().trim().min(1).default("Media_Assets_Report"),
  CREATOR_MEDIA_FILE_FIELD_LINK_NAME: z.string().trim().min(1).default("Draft_File"),
  CREATOR_ENVIRONMENT: z.enum(["development", "stage", "production"]).default("production"),
  CREATOR_CONNECTION_NAME: z.string().optional(),
  CREATOR_OAUTH_CLIENT_ID: z.string().optional(),
  CREATOR_OAUTH_CLIENT_SECRET: z.string().optional(),
  CREATOR_OAUTH_REFRESH_TOKEN: z.string().optional(),
  CREATOR_OAUTH_TOKEN_URL: z.string().url().default("https://accounts.zoho.in/oauth/v2/token"),
  CREATOR_OAUTH_TOKEN: z.string().optional(),
  CALLBACK_MAX_ATTEMPTS: positiveInt(8),
  CALLBACK_BASE_DELAY_MS: positiveInt(60_000),
  CALLBACK_MAX_DELAY_MS: positiveInt(3_600_000),
  PUBLISH_MAX_ATTEMPTS: positiveInt(5),
  PUBLISH_BASE_DELAY_MS: positiveInt(60_000),
  PUBLISH_MAX_DELAY_MS: positiveInt(1_800_000),
  REQUEST_CLOCK_SKEW_SECONDS: positiveInt(300),
  LEASE_DURATION_MS: positiveInt(300_000),
  POINTER_CAS_ATTEMPTS: positiveInt(8),
  MAX_MEDIA_BYTES: positiveInt(10_485_760)
}).superRefine((value, ctx) => {
  const refreshTokenReady = Boolean(value.CREATOR_OAUTH_CLIENT_ID && value.CREATOR_OAUTH_CLIENT_SECRET && value.CREATOR_OAUTH_REFRESH_TOKEN);
  if (!refreshTokenReady && !value.CREATOR_OAUTH_TOKEN) {
    ctx.addIssue({
      code: "custom",
      path: ["CREATOR_OAUTH_REFRESH_TOKEN"],
      message: "Configure Creator OAuth client ID, client secret, and refresh token, or a development-only access token"
    });
  }
});

export type Environment = z.infer<typeof environmentSchema>;

const catalystEnvAliases: Record<string, string> = {
  CATALYST_STRATUS_PRIVATE_BUCKET: "GD_STRATUS_PRIVATE_BUCKET",
  CATALYST_STRATUS_PUBLIC_BUCKET: "GD_STRATUS_PUBLIC_BUCKET",
  CATALYST_STRATUS_PUBLIC_BASE_URL: "GD_STRATUS_PUBLIC_BASE_URL",
  CATALYST_JOBPOOL_NAME: "GD_JOBPOOL_NAME",
  CATALYST_APPSAIL_NAME: "GD_APPSAIL_NAME",
  CATALYST_APPSAIL_BASE_URL: "GD_APPSAIL_BASE_URL",
  CATALYST_APPSAIL_JOB_PATH: "GD_APPSAIL_JOB_PATH",
  CATALYST_APPSAIL_CALLBACK_PATH: "GD_APPSAIL_CALLBACK_PATH"
};

function normalizeEnvironment(source: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const normalized = { ...source };
  for (const [canonical, alias] of Object.entries(catalystEnvAliases)) {
    normalized[canonical] = normalized[canonical] ?? normalized[alias];
  }
  return normalized;
}

export function loadEnvironment(source: NodeJS.ProcessEnv = process.env): Environment {
  return environmentSchema.parse(normalizeEnvironment(source));
}
