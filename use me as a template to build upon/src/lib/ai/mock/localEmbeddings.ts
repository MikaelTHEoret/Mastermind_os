// Mock local embeddings using a simple but deterministic algorithm
export async function generateLocalEmbedding(text: string): Promise<number[]> {
  // Convert text to a numerical representation
  const textBytes = new TextEncoder().encode(text);
  
  // Generate a fixed-size embedding (768 dimensions)
  const embedding = new Array(768).fill(0);
  
  // Fill embedding vector using text bytes
  for (let i = 0; i < textBytes.length; i++) {
    const value = textBytes[i];
    const position = i % embedding.length;
    
    // Use trigonometric functions to create a smooth distribution
    embedding[position] += Math.sin(value * 0.1) * 0.1;
    embedding[(position + 1) % embedding.length] += Math.cos(value * 0.1) * 0.1;
  }
  
  // Normalize the embedding
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  return embedding.map(val => val / magnitude);
}