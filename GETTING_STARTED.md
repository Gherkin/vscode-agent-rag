# Getting Started with PDF RAG Extension

This guide will help you set up and use the PDF RAG extension to enhance VS Code Copilot with your own PDF documents.

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure OpenAI API Key

You need an OpenAI API key for generating embeddings:

1. Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Open VS Code Settings (`Cmd+,` on macOS, `Ctrl+,` on Windows/Linux)
3. Search for "PDF RAG"
4. Set `pdfRag.openaiApiKey` to your API key

Or add to your `settings.json`:

```json
{
  "pdfRag.openaiApiKey": "sk-your-api-key-here"
}
```

### 3. Build and Run

```bash
# Compile the extension
npm run compile

# Or run in watch mode
npm run watch
```

Then press `F5` to launch the Extension Development Host.

### 4. Index Your First PDF

1. Open Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`)
2. Run: `PDF RAG: Add PDF Files to Knowledge Base`
3. Select one or more PDF files
4. Wait for indexing to complete

### 5. Search Your PDFs

**Option A: Direct Search**
1. Command Palette → `PDF RAG: Search Knowledge Base`
2. Enter your query
3. View results with source references

**Option B: Through Copilot**
Ask Copilot questions and it will automatically search your PDFs:

```
What does my documentation say about authentication?

@workspace Find information about deployment in my PDFs

Summarize the key points from the indexed documents about security
```

## Configuration Options

### Embedding Settings

```json
{
  // Which embedding model to use
  "pdfRag.embeddingModel": "text-embedding-3-small",
  
  // Alternative: more powerful but more expensive
  // "pdfRag.embeddingModel": "text-embedding-3-large"
}
```

### Chunking Settings

Control how PDFs are split into chunks:

```json
{
  // Size of each text chunk (in characters)
  "pdfRag.chunkSize": 1000,
  
  // Overlap between chunks to preserve context
  "pdfRag.chunkOverlap": 200
}
```

**Tips**:
- Larger chunks: Better context but less precise matching
- Smaller chunks: More precise but may lose context
- Overlap: Helps avoid breaking important information across chunks

### Search Settings

```json
{
  // Number of results to return
  "pdfRag.maxResults": 5
}
```

## Usage Examples

### Example 1: Technical Documentation

Index your project's technical documentation:

1. Index PDFs: API docs, architecture diagrams, design specs
2. Ask Copilot:
   ```
   Based on the architecture docs, how should I implement user authentication?
   
   What's the recommended approach for error handling according to our docs?
   ```

### Example 2: Research Papers

Index research papers for a project:

1. Add relevant papers as PDFs
2. Query:
   ```
   What methodologies do the papers mention for data preprocessing?
   
   Summarize the key findings about neural networks from my papers
   ```

### Example 3: Legal/Compliance Documents

Index contracts, policies, or compliance documents:

1. Add policy PDFs
2. Ask:
   ```
   What are the data retention requirements in our policies?
   
   Find all mentions of GDPR compliance in the documents
   ```

## Commands Reference

| Command | Description |
|---------|-------------|
| `PDF RAG: Add PDF Files to Knowledge Base` | Index new PDF files |
| `PDF RAG: Search Knowledge Base` | Manually search indexed PDFs |
| `PDF RAG: List Indexed Documents` | View all indexed documents |
| `PDF RAG: Clear Knowledge Base` | Delete all indexed data |

## Copilot Integration

The extension registers a tool that Copilot can call automatically. When you ask questions, Copilot will:

1. Detect if your query might benefit from PDF context
2. Call the `pdf-rag-search` tool
3. Receive relevant chunks from your PDFs
4. Incorporate that context into its response

You can also explicitly request PDF context:

```
Search my PDFs for [topic]

What do my documents say about [question]?

According to the indexed PDFs, how do I [task]?
```

## Best Practices

### 1. Choose Relevant Documents

Only index PDFs you'll actually reference:
- Project documentation
- Technical specifications
- Research papers
- Reference materials

### 2. Organize by Topic

Consider creating separate knowledge bases for different projects:
- Use `Clear Knowledge Base` between projects
- Or create multiple VS Code workspaces

### 3. Use Descriptive Queries

Be specific in your searches:
- ❌ "authentication"
- ✅ "OAuth 2.0 authentication flow with JWT tokens"

### 4. Monitor Costs

OpenAI embeddings cost money:
- `text-embedding-3-small`: ~$0.02 per 1M tokens
- `text-embedding-3-large`: ~$0.13 per 1M tokens

A typical page of text is ~500 tokens, so indexing 100 pages:
- Small model: ~$0.001
- Large model: ~$0.006

### 5. Re-index When Documents Change

If you update PDFs, re-index them:
1. `Clear Knowledge Base`
2. `Add PDF Files` again

## Troubleshooting

### PDFs Not Indexing

**Problem**: No content extracted from PDF

**Solutions**:
- Ensure PDF has actual text (not just scanned images)
- Try exporting PDF with text layer
- Check console logs for errors

### Low Quality Results

**Problem**: Search returns irrelevant results

**Solutions**:
- Increase `chunkOverlap` setting
- Adjust `chunkSize` (try larger chunks)
- Use more specific queries
- Increase `maxResults` to see more options

### Copilot Not Using PDFs

**Problem**: Copilot doesn't reference your PDFs

**Solutions**:
- Explicitly mention PDFs in your prompt
- Use phrases like "according to my documents" or "search my PDFs"
- Verify PDFs are indexed: `PDF RAG: List Indexed Documents`

### API Errors

**Problem**: OpenAI API errors

**Solutions**:
- Check API key is correct
- Verify you have API credits
- Check rate limits on your OpenAI account
- Try reducing batch size (submit fewer PDFs at once)

## Advanced Usage

### Custom Embedding Models

Currently supports OpenAI models. Future versions will support:
- Local models (Sentence Transformers)
- Azure OpenAI
- Other providers

### Programmatic Access

Developers can access the RAG engine directly:

```typescript
import { ragEngine } from './extension';

// Query programmatically
const results = await ragEngine.query('my query', 10);

// Get formatted context
const context = await ragEngine.getContextForQuery('my query');
```

## Performance Tips

1. **Index in batches**: Don't index 100 PDFs at once
2. **Monitor storage**: ChromaDB uses disk space
3. **Clear unused data**: Regularly clear old/unused documents
4. **Optimize chunks**: Experiment with chunk size for your use case

## Next Steps

- Read the main [README.md](README.md) for architecture details
- Check [package.json](package.json) for all configuration options
- Explore the source code in `src/` directory
- Report issues or contribute on GitHub

---

**Need help?** Open an issue or check the documentation.
