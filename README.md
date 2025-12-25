# PDF RAG for VS Code Copilot

A VS Code extension that enables **Retrieval-Augmented Generation (RAG)** for GitHub Copilot by indexing and querying multiple PDF documents. Feed your PDFs into a vector database and let Copilot reference them when answering questions.

## Features

- 📄 **PDF Ingestion**: Index multiple PDF files into a local vector database
- 🔍 **Semantic Search**: Query your PDF knowledge base with natural language
- 🤖 **Copilot Integration**: Copilot can automatically search your PDFs using agent skills
- 💾 **Persistent Storage**: File-based vector store for efficient retrieval
- ⚡ **OpenAI Embeddings**: High-quality text embeddings using OpenAI's API
- 📊 **Chunk Management**: Smart text chunking with configurable size and overlap

## Installation

### Prerequisites

- VS Code version 1.85.0 or higher
- Node.js 18+ installed
- OpenAI API key (for embeddings)

### Setup

1. **Clone and Install**:
   ```bash
   cd vscode-rag
   npm install
   ```

2. **Compile the Extension**:
   ```bash
   npm run compile
   ```

3. **Run in Development**:
   - Press `F5` in VS Code to launch Extension Development Host
   - Or run: `npm run watch` for auto-compilation

4. **Package for Installation** (optional):
   ```bash
   npm install -g @vscode/vsce
   vsce package
   # Install the generated .vsix file
   ```

## Configuration

Open VS Code settings and configure the following:

### Required Settings

- **`pdfRag.openaiApiKey`**: Your OpenAI API key
  ```json
  {
    "pdfRag.openaiApiKey": "sk-..."
  }
  ```

### Optional Settings

- **`pdfRag.embeddingModel`**: OpenAI embedding model (default: `text-embedding-3-small`)
- **`pdfRag.chunkSize`**: Size of text chunks (default: `1000`)
- **`pdfRag.chunkOverlap`**: Overlap between chunks (default: `200`)
- **`pdfRag.maxResults`**: Maximum search results (default: `5`)

Example configuration:
```json
{
  "pdfRag.openaiApiKey": "sk-your-api-key-here",
  "pdfRag.embeddingModel": "text-embedding-3-small",
  "pdfRag.chunkSize": 1000,
  "pdfRag.chunkOverlap": 200,
  "pdfRag.maxResults": 5
}
```

## Usage

### 1. Index PDF Files

**Command**: `PDF RAG: Add PDF Files to Knowledge Base`

1. Open Command Palette (`Cmd+Shift+P` on macOS, `Ctrl+Shift+P` on Windows/Linux)
2. Type "PDF RAG: Add PDF Files"
3. Select one or more PDF files
4. Wait for indexing to complete

The extension will:
- Extract text from PDFs
- Split into chunks
- Generate embeddings
- Store in vector database

### 2. Search Your Knowledge Base

**Command**: `PDF RAG: Search Knowledge Base`

1. Open Command Palette
2. Type "PDF RAG: Search Knowledge Base"
3. Enter your search query
4. View results in a new document with source references

### 3. Use with Copilot

Once PDFs are indexed, Copilot can automatically access them when using the `@workspace` participant or when explicitly instructed:

**Example prompts**:
```
@workspace Search my PDFs for information about machine learning algorithms

What does my documentation say about API authentication?

Based on the PDFs I indexed, explain the deployment process
```

The extension registers a tool called `pdf-rag-search` that Copilot can invoke to retrieve relevant context from your PDFs.

### 4. Manage Your Knowledge Base

**List Indexed Documents**:
```
Command: PDF RAG: List Indexed Documents
```

**Clear Database**:
```
Command: PDF RAG: Clear Knowledge Base
```

## Architecture

```
┌─────────────────┐
│   PDF Files     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  PDF Processor  │ ◄── Chunking & Extraction
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Embedding Svc   │ ◄── OpenAI API
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Vector Store   │ ◄── File-based JSON
│   (JSON file)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   RAG Engine    │ ◄── Query & Retrieval
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Copilot Tool    │ ◄── VS Code Integration
└─────────────────┘
```

### Key Components

1. **PDF Processor** (`src/pdfProcessor.ts`): Extracts and chunks text from PDFs
2. **Embedding Service** (`src/embeddingService.ts`): Generates embeddings via OpenAI
3. **Vector Store** (`src/vectorStore.ts`): Manages file-based vector storage with cosine similarity
4. **RAG Engine** (`src/ragEngine.ts`): Orchestrates indexing and retrieval
5. **Extension** (`src/extension.ts`): VS Code commands and Copilot integration

## How It Works

### Indexing Pipeline

1. **PDF Parsing**: Extracts raw text from PDF files
2. **Chunking**: Splits text into overlapping chunks (configurable size)
3. **Embedding**: Generates vector embeddings for each chunk using OpenAI
4. **Storage**: Stores embeddings in ChromaDB with metadata (source, page number)

### Query Pipeline

1. **Query Embedding**: Converts user query to vector embedding
2. **Similarity Search**: Finds most similar chunks using cosine similarity
3. **Context Assembly**: Formats results with source attribution
4. **Copilot Integration**: Returns context to Copilot for answer generation

## Troubleshooting

### "OpenAI API key not configured"

Set your API key in VS Code settings:
```json
{
  "pdfRag.openaiApiKey": "sk-..."
}
```

### "Error initializing vector store"

The vector store is now file-based and should work without additional setup. Check that the extension has write permissions to its storage directory.

### "No results found"

- Ensure PDFs are successfully indexed (check command output)
- Try broader search queries
- Increase `pdfRag.maxResults` setting

### Embedding API Rate Limits

The extension batches requests and adds delays. If you hit rate limits:
- Use a smaller batch of PDFs
- Check your OpenAI API tier and limits

## Development

### Project Structure

```
vscode-rag/
├── src/
│   ├── extension.ts          # Main extension entry point
│   ├── ragEngine.ts           # RAG orchestration
│   ├── vectorStore.ts         # ChromaDB integration
│   ├── embeddingService.ts    # OpenAI embeddings
│   └── pdfProcessor.ts        # PDF parsing & chunking
├── package.json               # Extension manifest
├── tsconfig.json              # TypeScript config
└── README.md                  # This file
```

### Build Commands

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch mode (auto-compile)
npm run watch

# Lint code
npm run lint

# Package extension
vsce package
```

### Testing

1. Press `F5` in VS Code to launch Extension Development Host
2. Test commands in the Command Palette
3. Check Developer Console for logs

## Limitations

- Requires OpenAI API key (embeddings are not free)
- PDF parsing quality depends on PDF structure
- Large PDFs may take time to index
- Vector database stored locally as JSON (not optimized for very large datasets)
- For production use with large datasets, consider implementing a more scalable vector store

## Roadmap

- [ ] Support for local embedding models (no API required)
- [ ] Support for other document types (Word, Markdown, etc.)
- [ ] Enhanced PDF parsing (tables, images)
- [ ] Export/import knowledge base
- [ ] Advanced filtering and metadata search
- [ ] Usage analytics and cost tracking

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## License

MIT License - see LICENSE file for details

## Credits

Built with:
- [OpenAI](https://openai.com/) - Embeddings API
- [pdf-parse](https://www.npmjs.com/package/pdf-parse) - PDF parsing
- Custom file-based vector store with cosine similarity

---

**Happy RAG-ing! 🚀**
