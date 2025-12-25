# Using Ollama for Local Embeddings

The extension now supports **Ollama** for completely local, free embeddings without requiring an OpenAI API key.

## Setup Ollama

### 1. Install Ollama

**macOS:**
```bash
brew install ollama
```

**Or download from:** https://ollama.ai/download

### 2. Start Ollama Service

```bash
ollama serve
```

This starts the Ollama server on `http://localhost:11434`

### 3. Pull an Embedding Model

You need an embedding model. Check what you have installed:

```bash
ollama list
```

If you don't have an embedding model, pull one:

**nomic-embed-text** (Recommended - 274MB):
```bash
ollama pull nomic-embed-text
```

**mxbai-embed-large** (Alternative - 669MB):
```bash
ollama pull mxbai-embed-large
```

**all-minilm** (Smaller - 46MB):
```bash
ollama pull all-minilm
```

**Note**: Use the exact model name shown in `ollama list` (including `:latest` if shown)

### 4. Configure VS Code Extension

Open VS Code Settings and set:

```json
{
  "pdfRag.embeddingProvider": "ollama",
  "pdfRag.ollamaModel": "nomic-embed-text",
  "pdfRag.ollamaBaseUrl": "http://localhost:11434"
}
```

Or use the Settings UI:
1. `Cmd+,` (Settings)
2. Search for "PDF RAG"
3. Set **Embedding Provider** to `ollama`
4. Set **Ollama Model** to `nomic-embed-text`

## Verify Setup

Test that Ollama is working:

```bash
curl http://localhost:11434/api/tags
```

You should see your installed models listed.

## Usage

Once configured, the extension works exactly the same:

1. **Add PDFs**: Command Palette → "PDF RAG: Add PDF Files"
2. **Search**: Command Palette → "PDF RAG: Search Knowledge Base"
3. **Copilot**: Ask questions and Copilot will search your PDFs

## Comparison: Ollama vs OpenAI

| Feature | Ollama | OpenAI |
|---------|--------|--------|
| **Cost** | Free | ~$0.02 per 1M tokens |
| **Privacy** | 100% local | Cloud-based |
| **Speed** | Depends on hardware | Fast |
| **Quality** | Good (nomic-embed-text) | Excellent |
| **Setup** | Requires installation | Just API key |
| **Internet** | Not required | Required |

## Recommended Models

### nomic-embed-text (Best Overall)
- Size: 274MB
- Dimensions: 768
- Good quality, reasonable size
- Optimized for semantic search

### mxbai-embed-large (Higher Quality)
- Size: 669MB  
- Dimensions: 1024
- Better quality but slower
- Good for smaller datasets

### all-minilm (Smallest)
- Size: 46MB
- Dimensions: 384
- Faster but lower quality
- Good for quick testing

## Troubleshooting

### "Could not connect to Ollama"

1. Make sure Ollama is running: `ollama serve`
2. Check the base URL in settings
3. Verify model is installed: `ollama list`

### "Model not found"

Pull the model:
```bash
ollama pull nomic-embed-text
```

### Slow Performance

- Use a smaller model (all-minilm)
- Reduce chunk size in settings
- Process fewer PDFs at once

## Advanced Configuration

### Custom Ollama Host

If running Ollama on a different machine:

```json
{
  "pdfRag.ollamaBaseUrl": "http://192.168.1.100:11434"
}
```

### Multiple Models

Switch models anytime in settings. The vector store is compatible across models (though quality may vary).

## Performance Tips

1. **First-time setup**: Download models ahead of time
2. **Hardware**: GPU acceleration helps (if supported by Ollama)
3. **Batch size**: The extension processes in batches automatically
4. **Model selection**: Use nomic-embed-text for best balance

## Example Workflow

```bash
# 1. Install and start Ollama
brew install ollama
ollama serve

# 2. In another terminal, pull model
ollama pull nomic-embed-text

# 3. Configure VS Code
# Set embedding provider to "ollama"

# 4. Index your PDFs
# Use command: "PDF RAG: Add PDF Files"

# 5. Search!
# Use command: "PDF RAG: Search Knowledge Base"
```

---

**Ready to use!** Your PDFs are now indexed locally without any API costs.
