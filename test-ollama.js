const { Ollama } = require('ollama');

async function testOllama() {
  console.log('Testing Ollama client...');
  
  const client = new Ollama({ host: 'http://localhost:11434' });
  
  try {
    console.log('Generating embedding for test text...');
    const start = Date.now();
    
    const response = await client.embeddings({
      model: 'mxbai-embed-large',
      prompt: 'This is a test embedding'
    });
    
    const duration = Date.now() - start;
    
    console.log(`Success! Generated embedding in ${duration}ms`);
    console.log(`Embedding dimensions: ${response.embedding.length}`);
    console.log(`First 5 values: ${response.embedding.slice(0, 5)}`);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testOllama();
