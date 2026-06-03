CREATE TABLE "ZiweiChart" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "lifePalace" TEXT NOT NULL,
    "bodyPalace" TEXT NOT NULL,
    "palaces" JSONB NOT NULL,
    "summary" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ZiweiChart_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AstrologyChart" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "placements" JSONB NOT NULL,
    "houses" JSONB NOT NULL,
    "dominantElements" JSONB NOT NULL,
    "summary" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AstrologyChart_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ZiweiChart_profileId_createdAt_idx" ON "ZiweiChart"("profileId", "createdAt");
CREATE INDEX "AstrologyChart_profileId_createdAt_idx" ON "AstrologyChart"("profileId", "createdAt");

ALTER TABLE "ZiweiChart" ADD CONSTRAINT "ZiweiChart_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AstrologyChart" ADD CONSTRAINT "AstrologyChart_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
