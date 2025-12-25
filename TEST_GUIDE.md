# Quick Test Guide

## ✅ Compilation Successful!

The extension has been compiled successfully. All TypeScript files are now in the `out/` directory.

## Testing the Extension

### Option 1: Launch from VS Code (Recommended)

1. **Press F5** in VS Code (or click Run → Start Debugging)
2. This will open a new "Extension Development Host" window
3. The extension will be loaded automatically

### Option 2: Run Watch Mode

```bash
npm run watch
```

This will automatically recompile whenever you make changes.

## Setting Up for Testing

### 1. Configure OpenAI API Key

In the Extension Development Host window:

1. Open Settings: `Cmd+,` (macOS) or `Ctrl+,` (Windows/Linux)
2. Search for: `PDF RAG`
3. Set `pdfRag.openaiApiKey` to your OpenAI API key

Or add to `settings.json`:
```json
{
  "pdfRag.openaiApiKey": "sk-your-api-key-here"
}
```

### 2. Test PDF Indexing

1. Open Command Palette: `Cmd+Shift+P` / `Ctrl+Shift+P`
2. Type: `PDF RAG: Add PDF Files to Knowledge Base`
3. Select one or more PDF files
4. Wait for indexing to complete

### 3. Test Search

1. Command Palette → `PDF RAG: Search Knowledge Base`
2. Enter a search query
3. Results will open in a new document

### 4. Test with Copilot

Ask Copilot questions like:
- "Search my PDFs for information about..."
- "What does my documentation say about..."
- "According to the indexed PDFs..."

### 5. Test Other Commands

- **List Documents**: `PDF RAG: List Indexed Documents`
- **Clear Database**: `PDF RAG: Clear Knowledge Base`

## Troubleshooting

### Extension Not Loading

Check the Debug Console in VS Code for errors.

### API Key Issues

Make sure your OpenAI API key is valid and has sufficient credits.

### No PDFs Available

You'll need some PDF files to test with. Any PDF with text content will work.

## Next Steps

Once testing is successful, you can:

1. **Package the extension**:
   ```bash
   npm install -g @vscode/vsce
   vsce package
   ```

2. **Install the .vsix file** in VS Code:
   - Extensions view → ... menu → Install from VSIX

3. **Publish to marketplace** (optional):
   ```bash
   vsce publish
   ```

## Development Tips

- Check the **Debug Console** for logs
- Use `console.log()` statements for debugging
- Reload the Extension Development Host window after changes (unless using watch mode)
- Check the **Output** panel for extension-specific logs

Happy testing! 🎉
