ALTER TABLE "BaziChart" ADD COLUMN "fingerprint" TEXT;

CREATE UNIQUE INDEX "BaziChart_profileId_fingerprint_key" ON "BaziChart"("profileId", "fingerprint");
