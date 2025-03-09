-- Create IP Bans table
CREATE TABLE IF NOT EXISTS "ip_bans" (
  "id" SERIAL PRIMARY KEY,
  "ip_address" TEXT NOT NULL UNIQUE,
  "reason" TEXT,
  "banned_by" INTEGER NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "expires_at" TIMESTAMP,
  "is_active" BOOLEAN NOT NULL DEFAULT TRUE
);