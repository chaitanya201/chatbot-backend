import z from "zod";

const configSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().default(3000),
  DATASTAX_COLLECTION_NAME: z.string(),
  DATASTAX_NAMESPACE: z.string(),
  DATASTAX_TOKEN: z.string(),
  DATASTAX_API_ENDPOINT: z.string(),
  GEMINI_API_KEY: z.string(),
  API_BASE_URL: z.string(),
});

const config = configSchema.safeParse(process.env);
if (!config.success) {
  console.error("Invalid environment variables:", config.error.format());
  throw new Error("Invalid environment variables");
}

export const NODE_CONFIG = config.data;
