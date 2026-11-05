-- Usage buckets are keyed by a quota subject (a user id or a shared key such as
-- "global:anonymous"), so they can no longer reference "User" directly.
ALTER TABLE "AiUsageBucket" DROP CONSTRAINT "AiUsageBucket_userId_fkey";
ALTER TABLE "AiUsageBucket" RENAME COLUMN "userId" TO "subject";
ALTER INDEX "AiUsageBucket_userId_feature_windowType_windowStart_key"
  RENAME TO "AiUsageBucket_subject_feature_windowType_windowStart_key";
