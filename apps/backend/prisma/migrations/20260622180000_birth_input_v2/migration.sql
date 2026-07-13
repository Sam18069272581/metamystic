ALTER TABLE "Profile"
  ADD COLUMN "birthCalendarType" TEXT NOT NULL DEFAULT 'solar',
  ADD COLUMN "birthLocalDate" TEXT,
  ADD COLUMN "birthLocalTime" TEXT,
  ADD COLUMN "birthTimePrecision" TEXT NOT NULL DEFAULT 'exact',
  ADD COLUMN "trueSolarTime" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "trueSolarCorrection" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN "lateZiHourRule" TEXT NOT NULL DEFAULT 'sameDay',
  ADD COLUMN "birthDataVersion" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "birthInput" JSONB;
