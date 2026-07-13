CREATE EXTENSION IF NOT EXISTS pg_trgm;

ALTER TABLE "KnowledgeSource"
  ADD COLUMN "sourceUrl" TEXT,
  ADD COLUMN "language" TEXT NOT NULL DEFAULT 'zh',
  ADD COLUMN "reviewStatus" TEXT NOT NULL DEFAULT 'draft',
  ADD COLUMN "reviewedAt" TIMESTAMP(3);

ALTER TABLE "KnowledgeChunk"
  ADD COLUMN "domain" TEXT NOT NULL DEFAULT 'bazi',
  ADD COLUMN "topic" TEXT NOT NULL DEFAULT 'general',
  ADD COLUMN "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "decisionScenarios" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "language" TEXT NOT NULL DEFAULT 'zh',
  ADD COLUMN "searchText" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "qualityScore" DOUBLE PRECISION NOT NULL DEFAULT 0.5;

UPDATE "KnowledgeSource"
SET
  "sourceType" = CASE
    WHEN "sourceType" = 'curated_commentary' THEN 'platform_explanation'
    ELSE "sourceType"
  END,
  "reviewStatus" = 'published',
  "reviewedAt" = COALESCE("reviewedAt", NOW());

UPDATE "KnowledgeChunk" kc
SET
  "domain" = COALESCE(NULLIF(kc.metadata->>'domain', ''), 'bazi'),
  "topic" = COALESCE(NULLIF(kc.metadata->>'topic', ''), 'general'),
  "tags" = COALESCE(
    ARRAY(SELECT jsonb_array_elements_text(COALESCE(kc.metadata->'tags', '[]'::jsonb))),
    ARRAY[]::TEXT[]
  ),
  "decisionScenarios" = COALESCE(
    ARRAY(SELECT jsonb_array_elements_text(COALESCE(kc.metadata->'decisionScenarios', '[]'::jsonb))),
    ARRAY[]::TEXT[]
  ),
  "language" = 'zh',
  "qualityScore" = 0.75,
  "searchText" = lower(concat_ws(' ', kc.content, kc."anchorId", kc.metadata::text));

UPDATE "KnowledgeChunk" kc
SET "searchText" = lower(concat_ws(
  ' ',
  kc."searchText",
  ks.title,
  kc."domain",
  kc."topic",
  array_to_string(kc.tags, ' '),
  array_to_string(kc."decisionScenarios", ' ')
))
FROM "KnowledgeSource" ks
WHERE ks.id = kc."sourceId";

CREATE INDEX "KnowledgeChunk_domain_topic_language_idx"
  ON "KnowledgeChunk"("domain", "topic", "language");
CREATE INDEX "KnowledgeChunk_tags_gin_idx"
  ON "KnowledgeChunk" USING GIN ("tags");
CREATE INDEX "KnowledgeChunk_searchText_trgm_idx"
  ON "KnowledgeChunk" USING GIN ("searchText" gin_trgm_ops);
CREATE INDEX "KnowledgeSource_reviewStatus_idx"
  ON "KnowledgeSource"("reviewStatus");
