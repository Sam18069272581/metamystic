-- Keep only the earliest existing default before adding the invariant.
WITH ranked_defaults AS (
  SELECT "id", ROW_NUMBER() OVER (PARTITION BY "userId" ORDER BY "createdAt", "id") AS rank
  FROM "Profile"
  WHERE "isDefault" = true
)
UPDATE "Profile" AS profile
SET "isDefault" = false
FROM ranked_defaults
WHERE profile."id" = ranked_defaults."id" AND ranked_defaults.rank > 1;

CREATE UNIQUE INDEX "Profile_one_default_per_user"
  ON "Profile" ("userId")
  WHERE "isDefault" = true;

ALTER TABLE "RefreshToken"
  ADD COLUMN "familyId" TEXT,
  ADD COLUMN "replacedByTokenId" TEXT;

ALTER TABLE "BaziChart"
  ADD COLUMN "engine" TEXT NOT NULL DEFAULT 'legacy',
  ADD COLUMN "engineVersion" TEXT NOT NULL DEFAULT '1',
  ADD COLUMN "inputHash" TEXT,
  ADD COLUMN "inputSnapshot" JSONB,
  ADD COLUMN "supersededAt" TIMESTAMP(3);

ALTER TABLE "ZiweiChart"
  ADD COLUMN "fingerprint" TEXT,
  ADD COLUMN "engine" TEXT NOT NULL DEFAULT 'legacy-seeded',
  ADD COLUMN "engineVersion" TEXT NOT NULL DEFAULT '1',
  ADD COLUMN "inputSnapshot" JSONB,
  ADD COLUMN "supersededAt" TIMESTAMP(3);
CREATE UNIQUE INDEX "ZiweiChart_profileId_fingerprint_key" ON "ZiweiChart"("profileId", "fingerprint");

ALTER TABLE "AstrologyChart"
  ADD COLUMN "fingerprint" TEXT,
  ADD COLUMN "engine" TEXT NOT NULL DEFAULT 'legacy-seeded',
  ADD COLUMN "engineVersion" TEXT NOT NULL DEFAULT '1',
  ADD COLUMN "inputSnapshot" JSONB,
  ADD COLUMN "supersededAt" TIMESTAMP(3);
CREATE UNIQUE INDEX "AstrologyChart_profileId_fingerprint_key" ON "AstrologyChart"("profileId", "fingerprint");

ALTER TABLE "Consultation"
  ADD COLUMN "idempotencyKey" TEXT,
  ADD COLUMN "provider" TEXT,
  ADD COLUMN "model" TEXT,
  ADD COLUMN "promptVersion" TEXT,
  ADD COLUMN "retrievalVersion" TEXT,
  ADD COLUMN "tokenUsage" JSONB,
  ADD COLUMN "errorCode" TEXT,
  ADD COLUMN "startedAt" TIMESTAMP(3),
  ADD COLUMN "finishedAt" TIMESTAMP(3);
CREATE INDEX "Consultation_profileId_userId_createdAt_idx" ON "Consultation"("profileId", "userId", "createdAt");
CREATE UNIQUE INDEX "Consultation_userId_idempotencyKey_key" ON "Consultation"("userId", "idempotencyKey");

ALTER TABLE "CompatibilityReading"
  ADD COLUMN "fingerprint" TEXT,
  ADD COLUMN "engineVersion" TEXT NOT NULL DEFAULT '1';
CREATE UNIQUE INDEX "CompatibilityReading_userId_fingerprint_key" ON "CompatibilityReading"("userId", "fingerprint");

ALTER TABLE "KnowledgeSource"
  ADD COLUMN "edition" TEXT,
  ADD COLUMN "license" TEXT,
  ADD COLUMN "contentChecksum" TEXT,
  ADD COLUMN "contentVersion" TEXT;

ALTER TABLE "KnowledgeChunk"
  ADD COLUMN "chapter" TEXT,
  ADD COLUMN "pageReference" TEXT,
  ADD COLUMN "embeddingModel" TEXT,
  ADD COLUMN "embeddingDimensions" INTEGER;
