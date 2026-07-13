ALTER TABLE "Consultation"
  ADD COLUMN "locale" TEXT NOT NULL DEFAULT 'zh',
  ADD COLUMN "accessMode" TEXT NOT NULL DEFAULT 'public_beta',
  ADD COLUMN "charged" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "accessRemaining" INTEGER,
  ADD COLUMN "accessResetsAt" TIMESTAMP(3);

CREATE TABLE "AiUsageBucket" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "feature" TEXT NOT NULL,
  "windowType" TEXT NOT NULL,
  "windowStart" TIMESTAMP(3) NOT NULL,
  "used" INTEGER NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AiUsageBucket_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AiUsageBucket_userId_feature_windowType_windowStart_key"
  ON "AiUsageBucket"("userId", "feature", "windowType", "windowStart");
CREATE INDEX "AiUsageBucket_windowStart_idx" ON "AiUsageBucket"("windowStart");

ALTER TABLE "AiUsageBucket"
  ADD CONSTRAINT "AiUsageBucket_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
