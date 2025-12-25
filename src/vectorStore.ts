import * as path from 'path';
import * as fs from 'fs';

export interface DocumentMetadata {
  source: string;
  page?: number;
  timestamp: string;
}

export interface StoredDocument {
  id: string;
  content: string;
  embedding: number[];
  metadata: DocumentMetadata;
}

export interface QueryResult {
  id: string;
  content: string;
  metadata: DocumentMetadata;
  similarity: number;
}

export class VectorStore {
  private documents: StoredDocument[] = [];
  private dbPath: string;
  private dbFile: string;

  constructor(storagePath: string) {
    this.dbPath = path.join(storagePath, 'vector_db');
    this.dbFile = path.join(this.dbPath, 'documents.json');
    this.ensureDbDirectory();
  }

  private ensureDbDirectory(): void {
    if (!fs.existsSync(this.dbPath)) {
      fs.mkdirSync(this.dbPath, { recursive: true });
    }
  }

  async initialize(): Promise<void> {
    try {
      // Load existing documents if available
      if (fs.existsSync(this.dbFile)) {
        const data = fs.readFileSync(this.dbFile, 'utf-8');
        this.documents = JSON.parse(data);
        console.log(`Loaded ${this.documents.length} documents from storage`);
      } else {
        this.documents = [];
        this.saveToFile();
      }
    } catch (error) {
      console.error('Error initializing vector store:', error);
      this.documents = [];
      this.saveToFile();
    }
  }

  private saveToFile(): void {
    try {
      fs.writeFileSync(this.dbFile, JSON.stringify(this.documents, null, 2));
    } catch (error) {
      console.error('Error saving to file:', error);
      throw error;
    }
  }

  async addDocuments(
    texts: string[],
    embeddings: number[][],
    metadatas: DocumentMetadata[],
    ids: string[]
  ): Promise<void> {
    try {
      for (let i = 0; i < texts.length; i++) {
        // Check if document already exists and update it, or add new
        const existingIndex = this.documents.findIndex(doc => doc.id === ids[i]);
        const newDoc: StoredDocument = {
          id: ids[i],
          content: texts[i],
          embedding: embeddings[i],
          metadata: metadatas[i],
        };

        if (existingIndex >= 0) {
          this.documents[existingIndex] = newDoc;
        } else {
          this.documents.push(newDoc);
        }
      }

      this.saveToFile();
      console.log(`Added ${texts.length} documents. Total: ${this.documents.length}`);
    } catch (error) {
      console.error('Error adding documents:', error);
      throw error;
    }
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  async query(
    queryEmbedding: number[],
    nResults: number = 5
  ): Promise<QueryResult[]> {
    try {
      if (this.documents.length === 0) {
        return [];
      }

      // Calculate similarity for all documents
      const similarities = this.documents.map(doc => ({
        ...doc,
        similarity: this.cosineSimilarity(queryEmbedding, doc.embedding),
      }));

      // Sort by similarity (descending) and take top N
      const topResults = similarities
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, nResults);

      return topResults.map(result => ({
        id: result.id,
        content: result.content,
        metadata: result.metadata,
        similarity: result.similarity,
      }));
    } catch (error) {
      console.error('Error querying vector store:', error);
      throw error;
    }
  }

  async listDocuments(): Promise<{ source: string; count: number }[]> {
    try {
      const docCounts = new Map<string, number>();

      for (const doc of this.documents) {
        const source = doc.metadata.source;
        docCounts.set(source, (docCounts.get(source) || 0) + 1);
      }

      return Array.from(docCounts.entries()).map(([source, count]) => ({
        source,
        count,
      }));
    } catch (error) {
      console.error('Error listing documents:', error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      this.documents = [];
      this.saveToFile();
      console.log('Vector store cleared');
    } catch (error) {
      console.error('Error clearing vector store:', error);
      throw error;
    }
  }

  async getCount(): Promise<number> {
    return this.documents.length;
  }
}
