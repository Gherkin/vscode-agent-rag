import * as fs from 'fs';
import * as path from 'path';
// @ts-ignore - pdf-parse doesn't have TypeScript declarations
import pdfParse from 'pdf-parse';

export interface PDFChunk {
  text: string;
  metadata: {
    source: string;
    page: number;
    chunkIndex: number;
  };
}

export class PDFProcessor {
  private chunkSize: number;
  private chunkOverlap: number;

  constructor(chunkSize: number = 1000, chunkOverlap: number = 200) {
    this.chunkSize = chunkSize;
    this.chunkOverlap = chunkOverlap;
  }

  async processPDF(filePath: string): Promise<PDFChunk[]> {
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(dataBuffer);
    
    const chunks: PDFChunk[] = [];
    const text = pdfData.text;
    const fileName = path.basename(filePath);

    // Split by pages if possible, or use the full text
    const pages = this.extractPages(text);

    let globalChunkIndex = 0;

    for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
      const pageText = pages[pageIndex];
      const pageChunks = this.chunkText(pageText);

      for (const chunk of pageChunks) {
        if (chunk.trim().length > 0) {
          chunks.push({
            text: chunk,
            metadata: {
              source: fileName,
              page: pageIndex + 1,
              chunkIndex: globalChunkIndex++,
            },
          });
        }
      }
    }

    return chunks;
  }

  async processMultiplePDFs(filePaths: string[]): Promise<PDFChunk[]> {
    const allChunks: PDFChunk[] = [];

    for (const filePath of filePaths) {
      try {
        const chunks = await this.processPDF(filePath);
        allChunks.push(...chunks);
      } catch (error) {
        console.error(`Error processing PDF ${filePath}:`, error);
        throw error;
      }
    }

    return allChunks;
  }

  private extractPages(text: string): string[] {
    // Simple page extraction - split by form feed or double newlines
    // This is a basic heuristic; pdf-parse doesn't provide page-level text directly
    const pages = text.split(/\f/); // Form feed character
    
    if (pages.length === 1) {
      // If no form feeds, split by large gaps (approximation)
      return text.split(/\n\n\n+/).filter(p => p.trim().length > 0);
    }
    
    return pages.filter(p => p.trim().length > 0);
  }

  private chunkText(text: string): string[] {
    const chunks: string[] = [];
    
    // Clean up the text
    const cleanText = text.replace(/\s+/g, ' ').trim();
    
    if (cleanText.length <= this.chunkSize) {
      return [cleanText];
    }

    let start = 0;
    
    while (start < cleanText.length) {
      let end = start + this.chunkSize;
      
      // If we're not at the end, try to break at a sentence or word boundary
      if (end < cleanText.length) {
        // Try to find a period followed by space
        const periodIndex = cleanText.lastIndexOf('. ', end);
        if (periodIndex > start && periodIndex > start + this.chunkSize / 2) {
          end = periodIndex + 1;
        } else {
          // Try to find a space
          const spaceIndex = cleanText.lastIndexOf(' ', end);
          if (spaceIndex > start) {
            end = spaceIndex;
          }
        }
      }

      chunks.push(cleanText.slice(start, end).trim());
      
      // Move start position with overlap
      start = end - this.chunkOverlap;
      
      // Ensure we're moving forward
      if (start <= chunks[chunks.length - 1].length - this.chunkSize) {
        start = end;
      }
    }

    return chunks;
  }

  setChunkSize(size: number): void {
    this.chunkSize = size;
  }

  setChunkOverlap(overlap: number): void {
    this.chunkOverlap = overlap;
  }
}
