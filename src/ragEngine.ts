import { VectorStore, QueryResult } from './vectorStore';
import { EmbeddingService } from './embeddingService';
import { PDFProcessor, PDFChunk } from './pdfProcessor';
import * as crypto from 'crypto';

export interface RAGResult {
  content: string;
  source: string;
  page: number;
  similarity: number;
}

export class RAGEngine {
  private vectorStore: VectorStore;
  private embeddingService: EmbeddingService;
  private pdfProcessor: PDFProcessor;

  constructor(
    vectorStore: VectorStore,
    embeddingService: EmbeddingService,
    pdfProcessor: PDFProcessor
  ) {
    this.vectorStore = vectorStore;
    this.embeddingService = embeddingService;
    this.pdfProcessor = pdfProcessor;
  }

  async indexPDFs(filePaths: string[], progressCallback?: (progress: number, total: number) => void): Promise<void> {
    // Process PDFs into chunks
    const allChunks: PDFChunk[] = [];
    
    console.log(`Processing ${filePaths.length} PDF file(s)...`);
    
    for (let i = 0; i < filePaths.length; i++) {
      console.log(`Processing PDF ${i + 1}/${filePaths.length}: ${filePaths[i]}`);
      const chunks = await this.pdfProcessor.processPDF(filePaths[i]);
      allChunks.push(...chunks);
      
      if (progressCallback) {
        progressCallback(i + 1, filePaths.length);
      }
    }

    if (allChunks.length === 0) {
      throw new Error('No content extracted from PDFs');
    }

    console.log(`Extracted ${allChunks.length} chunks from PDFs`);

    // Generate embeddings for all chunks with smaller batch size (10 for local models)
    const texts = allChunks.map(chunk => chunk.text);
    console.log(`Generating embeddings for ${texts.length} chunks...`);
    const embeddings = await this.embeddingService.embedTexts(texts, 10);
    console.log(`Generated ${embeddings.length} embeddings`);

    // Generate unique IDs for each chunk
    const ids = allChunks.map((chunk, index) => {
      const hash = crypto.createHash('md5')
        .update(`${chunk.metadata.source}-${chunk.metadata.page}-${chunk.metadata.chunkIndex}`)
        .digest('hex');
      return hash;
    });

    // Prepare metadata
    const metadatas = allChunks.map(chunk => ({
      source: chunk.metadata.source,
      page: chunk.metadata.page,
      timestamp: new Date().toISOString(),
    })) as any[];

    // Add to vector store
    await this.vectorStore.addDocuments(texts, embeddings, metadatas, ids);
  }

  async query(queryText: string, maxResults: number = 5): Promise<RAGResult[]> {
    // Generate embedding for query
    const queryEmbedding = await this.embeddingService.embedText(queryText);

    // Search vector store
    const results = await this.vectorStore.query(queryEmbedding, maxResults);

    // Transform results
    return results.map(result => ({
      content: result.content,
      source: result.metadata.source,
      page: result.metadata.page || 0,
      similarity: result.similarity,
    }));
  }

  async getContextForQuery(queryText: string, maxResults: number = 5): Promise<string> {
    const results = await this.query(queryText, maxResults);

    if (results.length === 0) {
      return 'No relevant context found in the knowledge base.';
    }

    // Format context for Copilot
    let context = 'Relevant context from indexed PDFs:\n\n';

    for (const result of results) {
      context += `[${result.source} - Page ${result.page}] (Similarity: ${(result.similarity * 100).toFixed(1)}%)\n`;
      context += `${result.content}\n\n`;
      context += '---\n\n';
    }

    return context;
  }

  async listIndexedDocuments(): Promise<{ source: string; count: number }[]> {
    return await this.vectorStore.listDocuments();
  }

  async clearDatabase(): Promise<void> {
    await this.vectorStore.clear();
  }

  async getDocumentCount(): Promise<number> {
    return await this.vectorStore.getCount();
  }
}
