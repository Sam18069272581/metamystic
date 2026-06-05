CREATE TABLE IF NOT EXISTS "CompatibilityReading" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "profileAId" TEXT NOT NULL,
  "profileBId" TEXT NOT NULL,
  "chartAId" TEXT NOT NULL,
  "chartBId" TEXT NOT NULL,
  "overallScore" INTEGER NOT NULL,
  "level" TEXT NOT NULL,
  "reading" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "CompatibilityReading_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CompatibilityReading_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CompatibilityReading_profileAId_fkey" FOREIGN KEY ("profileAId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CompatibilityReading_profileBId_fkey" FOREIGN KEY ("profileBId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "CompatibilityReading_userId_createdAt_idx" ON "CompatibilityReading"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "CompatibilityReading_profileAId_createdAt_idx" ON "CompatibilityReading"("profileAId", "createdAt");
CREATE INDEX IF NOT EXISTS "CompatibilityReading_profileBId_createdAt_idx" ON "CompatibilityReading"("profileBId", "createdAt");
