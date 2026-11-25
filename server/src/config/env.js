// Every environment variable is read HERE and nowhere else. Missing one? Check server/.env.example.
const DEV_JWT_SECRET = "dev-only-secret";

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: Number(process.env.PORT ?? 4000),
  CLIENT_URL: process.env.CLIENT_URL ?? "http://localhost:5173",
  DATABASE_URL: process.env.DATABASE_URL ?? "",
  JWT_SECRET: process.env.JWT_SECRET ?? DEV_JWT_SECRET,
  SERVE_CLIENT: process.env.SERVE_CLIENT === "true",
  SMTP_HOST: process.env.SMTP_HOST ?? "",
  SMTP_PORT: Number(process.env.SMTP_PORT ?? 587),
  SMTP_USER: process.env.SMTP_USER ?? "",
  SMTP_PASS: process.env.SMTP_PASS ?? "",
};

// Anyone who knows the secret can make login tokens for any account, including admin.
// The built-in one is public (it's in this file), so a real deployment must set its own.
if (
  env.NODE_ENV === "production" &&
  (!process.env.JWT_SECRET || env.JWT_SECRET === DEV_JWT_SECRET)
) {
  throw new Error(
    "Set JWT_SECRET in server/.env to a long random string before running in production",
  );
}
