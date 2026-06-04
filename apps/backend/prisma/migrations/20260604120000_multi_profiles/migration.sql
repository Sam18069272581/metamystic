-- Evolve user profiles from one profile per user to multiple profiles per user.
ALTER TABLE "Profile" DROP CONSTRAINT IF EXISTS "Profile_userId_key";

ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "label" TEXT;
ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "isDefault" BOOLEAN NOT NULL DEFAULT false;

UPDATE "Profile"
SET "label" = COALESCE("label", "displayName", 'self'),
    "isDefault" = true
WHERE "isDefault" = false;

CREATE INDEX IF NOT EXISTS "Profile_userId_isDefault_idx" ON "Profile"("userId", "isDefault");
CREATE INDEX IF NOT EXISTS "Profile_userId_createdAt_idx" ON "Profile"("userId", "createdAt");
