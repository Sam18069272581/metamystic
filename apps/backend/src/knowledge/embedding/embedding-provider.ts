import OpenAI from "openai";

export interface EmbeddingProvider {
  name: string;
  dimensions: number;
  embed(input: string): Promise<number[]>;
}

export interface EmbeddingProviderConfig {
  openAiApiKey?: string;
  model?: string;
  dimensions?: number;
}

const DEFAULT_MODEL = "text-embedding-3-small";
const DEFAULT_DIMENSIONS = 1536;

export function createEmbeddingProvider(config: EmbeddingProviderConfig): EmbeddingProvider {
  const dimensions = config.dimensions ?? DEFAULT_DIMENSIONS;
  const model = config.model ?? DEFAULT_MODEL;

  if (!config.openAiApiKey) {
    return new LocalHashEmbeddingProvider(dimensions);
  }

  return new OpenAiEmbeddingProvider(config.openAiApiKey, model, dimensions);
}

class LocalHashEmbeddingProvider implements EmbeddingProvider {
  readonly name = "local-hash";

  constructor(readonly dimensions: number) {
    if (!Number.isInteger(dimensions) || dimensions <= 0) {
      throw new Error("Embedding dimensions must be a positive integer.");
    }
  }

  async embed(input: string): Promise<number[]> {
    const vector = Array.from({ length: this.dimensions }, () => 0);
    const tokens = tokenizeForHash(input);

    tokens.forEach((token) => {
      const index = positiveHash(token) % this.dimensions;
      const sign = positiveHash(`${token}:sign`) % 2 === 0 ? 1 : -1;
      vector[index] = (vector[index] ?? 0) + sign;
    });

    return normalize(vector);
  }
}

class OpenAiEmbeddingProvider implements EmbeddingProvider {
  readonly name = "openai";
  private readonly client: OpenAI;

  constructor(
    apiKey: string,
    private readonly model: string,
    readonly dimensions: number
  ) {
    if (!Number.isInteger(dimensions) || dimensions <= 0) {
      throw new Error("Embedding dimensions must be a positive integer.");
    }

    this.client = new OpenAI({ apiKey });
  }

  async embed(input: string): Promise<number[]> {
    const response = await this.client.embeddings.create({
      model: this.model,
      input,
      dimensions: this.dimensions
    });
    const embedding = response.data.at(0)?.embedding;

    if (!embedding?.length) {
      throw new Error("OpenAI embedding response did not include an embedding vector.");
    }

    return normalize(embedding);
  }
}

function tokenizeForHash(input: string): string[] {
  const compact = input.trim().toLowerCase();
  if (!compact) {
    return ["empty"];
  }

  const lexicalTokens = compact.match(/[\p{Script=Han}]{1,2}|[a-z0-9]+/gu);
  return lexicalTokens?.length ? lexicalTokens : [compact];
}

function positiveHash(value: string): number {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function normalize(vector: number[]): number[] {
  const magnitude = Math.hypot(...vector);

  if (magnitude === 0) {
    const normalized = Array.from({ length: vector.length }, () => 0);
    if (normalized.length > 0) {
      normalized[0] = 1;
    }
    return normalized;
  }

  return vector.map((value) => value / magnitude);
}
