CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE "KnowledgeChunk"
ADD COLUMN "embedding" vector(1536);

CREATE INDEX "KnowledgeChunk_embedding_ivfflat_idx"
ON "KnowledgeChunk"
USING ivfflat ("embedding" vector_cosine_ops)
WITH (lists = 100)
WHERE "embedding" IS NOT NULL;
