CREATE TABLE "ProfileMemoryEvent" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "consultationId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfileMemoryEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProfileMemoryEvent_consultationId_key"
ON "ProfileMemoryEvent"("consultationId");

CREATE INDEX "ProfileMemoryEvent_profileId_createdAt_idx"
ON "ProfileMemoryEvent"("profileId", "createdAt");

ALTER TABLE "ProfileMemoryEvent"
ADD CONSTRAINT "ProfileMemoryEvent_profileId_fkey"
FOREIGN KEY ("profileId") REFERENCES "Profile"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "ProfileMemoryEvent" ("id", "profileId", "consultationId", "payload", "createdAt")
SELECT
    'legacy_' || "id",
    "id",
    'legacy:' || "id",
    "memorySignals",
    "createdAt"
FROM "Profile"
WHERE "memorySignals" <> '{}'::jsonb;
