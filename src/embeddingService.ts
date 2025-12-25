import OpenAI from 'openai';
import { Ollama } from 'ollama';

export interface EmbeddingProvider {
  generateEmbeddings(texts: string[]): Promise<number[][]>;
  generateEmbedding(text: string): Promise<number[]>;
}

export class OpenAIEmbeddingProvider implements EmbeddingProvider {
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model: string = 'text-embedding-3-small') {
    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      const response = await this.client.embeddings.create({
        model: this.model,
        input: texts,
      });

      return response.data.map(item => item.embedding);
    } catch (error) {
      console.error('Error generating embeddings:', error);
      throw error;
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const embeddings = await this.generateEmbeddings([text]);
    return embeddings[0];
  }
}

export class OllamaEmbeddingProvider implements EmbeddingProvider {
  private client: Ollama;
  private model: string;

  constructor(baseUrl: string = 'http://localhost:11434', model: string = 'nomic-embed-text') {
    this.client = new Ollama({ host: baseUrl });
    this.model = model;
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      const embeddings: number[][] = [];
      
      console.log(`Generating ${texts.length} embeddings with Ollama (${this.model})...`);
      console.log(`Note: This may take a while (~20 seconds per chunk with mxbai-embed-large)`);
      
      const startTime = Date.now();
      
      for (let i = 0; i < texts.length; i++) {
        const chunkStart = Date.now();
        
        // Show progress every 5 chunks or on first chunk
        if (i % 5 === 0 || i === 0) {
          const elapsed = Math.round((Date.now() - startTime) / 1000);
          const avgTimePerChunk = i > 0 ? elapsed / i : 0;
          const remaining = Math.round((texts.length - i) * avgTimePerChunk);
          console.log(`Progress: ${i}/${texts.length} (${Math.round(i/texts.length*100)}%) - Elapsed: ${elapsed}s, Est. remaining: ~${remaining}s`);
        }
        
        const response = await this.client.embeddings({
          model: this.model,
          prompt: texts[i],
        });
        embeddings.push(response.embedding);
        
        // Log first chunk timing for better estimation
        if (i === 0) {
          const firstChunkDuration = Math.round((Date.now() - chunkStart) / 1000);
          const estimatedTotal = Math.round(texts.length * firstChunkDuration / 60);
          console.log(`First embedding took ${firstChunkDuration}s - estimated total time: ~${estimatedTotal} minutes`);
        }
      }

      const totalTime = Math.round((Date.now() - startTime) / 1000);
      console.log(`✓ Completed generating ${embeddings.length} embeddings in ${totalTime}s (~${Math.round(totalTime/60)} minutes)`);
      return embeddings;
    } catch (error) {
      console.error('Error generating embeddings with Ollama:', error);
      throw new Error(`Ollama embedding error: ${error}. Make sure Ollama is running and the model '${this.model}' is installed.`);
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const embeddings = await this.generateEmbeddings([text]);
    return embeddings[0];
  }
}

export class EmbeddingService {
  private provider: EmbeddingProvider;

  constructor(provider: EmbeddingProvider) {
    this.provider = provider;
  }

  async embedTexts(texts: string[], batchSize: number = 100, progressCallback?: (current: number, total: number) => void): Promise<number[][]> {
    const allEmbeddings: number[][] = [];

    console.log(`Processing ${texts.length} texts in batches of ${batchSize}`);

    // Process in batches to avoid rate limits
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(texts.length / batchSize)}`);
      
      const embeddings = await this.provider.generateEmbeddings(batch);
      allEmbeddings.push(...embeddings);

      if (progressCallback) {
        progressCallback(Math.min(i + batchSize, texts.length), texts.length);
      }

      // Small delay between batches to respect rate limits
      if (i + batchSize < texts.length) {
        await this.delay(100);
      }
    }

    console.log(`Completed processing ${allEmbeddings.length} embeddings`);
    return allEmbeddings;
  }

  async embedText(text: string): Promise<number[]> {
    return await this.provider.generateEmbedding(text);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
