import * as vscode from 'vscode';
import { VectorStore } from './vectorStore';
import { EmbeddingService, OpenAIEmbeddingProvider, OllamaEmbeddingProvider } from './embeddingService';
import { PDFProcessor } from './pdfProcessor';
import { RAGEngine } from './ragEngine';

let ragEngine: RAGEngine | null = null;

export function activate(context: vscode.ExtensionContext) {
  console.log('PDF RAG extension is now active');

  // Initialize RAG engine
  initializeRAGEngine(context);

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('pdfRag.addPdfFiles', async () => {
      await addPdfFilesCommand(context);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('pdfRag.clearDatabase', async () => {
      await clearDatabaseCommand();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('pdfRag.searchKnowledge', async () => {
      await searchKnowledgeCommand();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('pdfRag.listDocuments', async () => {
      await listDocumentsCommand();
    })
  );

  // Register language model tool for Copilot integration
  registerCopilotTool(context);

  // Watch for configuration changes and reinitialize
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(async (e) => {
      if (e.affectsConfiguration('pdfRag.embeddingProvider') ||
          e.affectsConfiguration('pdfRag.ollamaModel') ||
          e.affectsConfiguration('pdfRag.ollamaBaseUrl') ||
          e.affectsConfiguration('pdfRag.embeddingModel') ||
          e.affectsConfiguration('pdfRag.openaiApiKey')) {
        console.log('PDF RAG configuration changed, reinitializing...');
        await initializeRAGEngine(context);
        vscode.window.showInformationMessage('PDF RAG: Configuration updated');
      }
    })
  );
}

async function initializeRAGEngine(context: vscode.ExtensionContext) {
  try {
    const config = vscode.workspace.getConfiguration('pdfRag');
    const provider = config.get<string>('embeddingProvider', 'openai');
    const apiKey = config.get<string>('openaiApiKey', '');
    
    if (provider === 'openai' && !apiKey) {
      vscode.window.showWarningMessage(
        'PDF RAG: OpenAI API key not configured. Please set pdfRag.openaiApiKey in settings or switch to Ollama provider.'
      );
    }

    const embeddingModel = config.get<string>('embeddingModel', 'text-embedding-3-small');
    const ollamaModel = config.get<string>('ollamaModel', 'nomic-embed-text');
    const ollamaBaseUrl = config.get<string>('ollamaBaseUrl', 'http://localhost:11434');
    const chunkSize = config.get<number>('chunkSize', 1000);
    const chunkOverlap = config.get<number>('chunkOverlap', 200);

    // Initialize components
    const vectorStore = new VectorStore(context.globalStorageUri.fsPath);
    await vectorStore.initialize();

    // Create appropriate embedding provider based on configuration
    let embeddingProvider;
    if (provider === 'ollama') {
      embeddingProvider = new OllamaEmbeddingProvider(ollamaBaseUrl, ollamaModel);
      console.log(`Using Ollama embeddings with model: ${ollamaModel}`);
    } else {
      embeddingProvider = new OpenAIEmbeddingProvider(apiKey, embeddingModel);
      console.log(`Using OpenAI embeddings with model: ${embeddingModel}`);
    }

    const embeddingService = new EmbeddingService(embeddingProvider);
    const pdfProcessor = new PDFProcessor(chunkSize, chunkOverlap);

    ragEngine = new RAGEngine(vectorStore, embeddingService, pdfProcessor);

    console.log('RAG engine initialized successfully');
  } catch (error) {
    console.error('Error initializing RAG engine:', error);
    vscode.window.showErrorMessage(`Failed to initialize PDF RAG: ${error}`);
  }
}

async function addPdfFilesCommand(context: vscode.ExtensionContext) {
  if (!ragEngine) {
    vscode.window.showErrorMessage('RAG engine not initialized');
    return;
  }

  // Re-check current provider configuration (in case it changed)
  const config = vscode.workspace.getConfiguration('pdfRag');
  const provider = config.get<string>('embeddingProvider', 'openai');
  const apiKey = config.get<string>('openaiApiKey', '');
  
  // Reinitialize if provider might have changed
  console.log(`Current embedding provider: ${provider}`);
  
  if (provider === 'openai' && !apiKey) {
    const response = await vscode.window.showErrorMessage(
      'OpenAI API key not configured. Would you like to set it now?',
      'Open Settings',
      'Switch to Ollama'
    );
    
    if (response === 'Open Settings') {
      vscode.commands.executeCommand('workbench.action.openSettings', 'pdfRag.openaiApiKey');
    } else if (response === 'Switch to Ollama') {
      await config.update('embeddingProvider', 'ollama', vscode.ConfigurationTarget.Global);
      vscode.window.showInformationMessage('Switched to Ollama provider. Reinitializing...');
      // Reinitialize will happen via config change listener
      return;
    }
    return;
  }

  if (provider === 'ollama') {
    const ollamaModel = config.get<string>('ollamaModel', 'nomic-embed-text');
    vscode.window.showInformationMessage(`Using Ollama (${ollamaModel}) for embeddings. Make sure Ollama is running.`);
  }

  // Open file picker
  const fileUris = await vscode.window.showOpenDialog({
    canSelectMany: true,
    filters: {
      'PDF Files': ['pdf']
    },
    openLabel: 'Select PDF files to index'
  });

  if (!fileUris || fileUris.length === 0) {
    return;
  }

  const filePaths = fileUris.map(uri => uri.fsPath);

  // Show progress
  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: 'Indexing PDF files with Ollama',
      cancellable: false
    },
    async (progress) => {
      try {
        progress.report({ message: 'Extracting text from PDFs... (Check Debug Console for detailed progress)', increment: 0 });

        await ragEngine!.indexPDFs(filePaths, (current, total) => {
          progress.report({
            message: `Step 1/${2}: Extracted text from ${current}/${total} PDFs. Next: generating embeddings (this takes time)...`,
            increment: 0
          });
        });

        const count = await ragEngine!.getDocumentCount();
        progress.report({ message: 'Complete!', increment: 100 });
        
        vscode.window.showInformationMessage(
          `✓ Successfully indexed ${filePaths.length} PDF file(s). Total chunks in database: ${count}`
        );
      } catch (error) {
        console.error('Indexing error:', error);
        vscode.window.showErrorMessage(`Error indexing PDFs: ${error}`);
      }
    }
  );
}

async function clearDatabaseCommand() {
  if (!ragEngine) {
    vscode.window.showErrorMessage('RAG engine not initialized');
    return;
  }

  const response = await vscode.window.showWarningMessage(
    'Are you sure you want to clear the entire knowledge base?',
    { modal: true },
    'Yes, Clear Database'
  );

  if (response !== 'Yes, Clear Database') {
    return;
  }

  try {
    await ragEngine.clearDatabase();
    vscode.window.showInformationMessage('Knowledge base cleared successfully');
  } catch (error) {
    vscode.window.showErrorMessage(`Error clearing database: ${error}`);
  }
}

async function searchKnowledgeCommand() {
  if (!ragEngine) {
    vscode.window.showErrorMessage('RAG engine not initialized');
    return;
  }

  const query = await vscode.window.showInputBox({
    prompt: 'Enter your search query',
    placeHolder: 'What would you like to search for?'
  });

  if (!query) {
    return;
  }

  try {
    const config = vscode.workspace.getConfiguration('pdfRag');
    const maxResults = config.get<number>('maxResults', 5);

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'Searching knowledge base...',
        cancellable: false
      },
      async () => {
        const results = await ragEngine!.query(query, maxResults);

        if (results.length === 0) {
          vscode.window.showInformationMessage('No results found');
          return;
        }

        // Create a new document with results
        const doc = await vscode.workspace.openTextDocument({
          content: formatSearchResults(query, results),
          language: 'markdown'
        });

        await vscode.window.showTextDocument(doc);
      }
    );
  } catch (error) {
    vscode.window.showErrorMessage(`Error searching knowledge base: ${error}`);
  }
}

async function listDocumentsCommand() {
  if (!ragEngine) {
    vscode.window.showErrorMessage('RAG engine not initialized');
    return;
  }

  try {
    const documents = await ragEngine.listIndexedDocuments();

    if (documents.length === 0) {
      vscode.window.showInformationMessage('No documents indexed yet');
      return;
    }

    const totalCount = await ragEngine.getDocumentCount();

    const message = documents
      .map(doc => `${doc.source}: ${doc.count} chunks`)
      .join('\n');

    vscode.window.showInformationMessage(
      `Indexed Documents (${totalCount} total chunks):\n\n${message}`,
      { modal: true }
    );
  } catch (error) {
    vscode.window.showErrorMessage(`Error listing documents: ${error}`);
  }
}

function formatSearchResults(query: string, results: any[]): string {
  let output = `# Search Results for: "${query}"\n\n`;
  output += `Found ${results.length} result(s)\n\n`;
  output += '---\n\n';

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    output += `## Result ${i + 1}\n\n`;
    output += `**Source:** ${result.source}\n\n`;
    output += `**Page:** ${result.page}\n\n`;
    output += `**Similarity:** ${(result.similarity * 100).toFixed(1)}%\n\n`;
    output += `**Content:**\n\n`;
    output += `${result.content}\n\n`;
    output += '---\n\n';
  }

  return output;
}

function registerCopilotTool(context: vscode.ExtensionContext) {
  // Register as a language model tool that Copilot can call
  const tool: vscode.LanguageModelTool<{ query: string; maxResults?: number }> = {
    invoke: async (options: vscode.LanguageModelToolInvocationOptions<{ query: string; maxResults?: number }>, _token: vscode.CancellationToken) => {
      if (!ragEngine) {
        return new vscode.LanguageModelToolResult([new vscode.LanguageModelTextPart('RAG engine not initialized')]);
      }

      try {
        const parameters = options.input;
        const config = vscode.workspace.getConfiguration('pdfRag');
        const maxResults = parameters.maxResults || config.get<number>('maxResults', 5);
        
        const context = await ragEngine.getContextForQuery(parameters.query, maxResults);
        
        return new vscode.LanguageModelToolResult([new vscode.LanguageModelTextPart(context)]);
      } catch (error) {
        return new vscode.LanguageModelToolResult([
          new vscode.LanguageModelTextPart(`Error searching knowledge base: ${error}`)
        ]);
      }
    }
  };

  const registration = vscode.lm.registerTool('pdf-rag-search', tool);
  context.subscriptions.push(registration);
}

export function deactivate() {
  console.log('PDF RAG extension deactivated');
}
