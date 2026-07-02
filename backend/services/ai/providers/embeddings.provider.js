const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Embeddings Provider Abstraction
 * Wraps Google's text-embedding-004 to generate dense vector embeddings.
 */
class EmbeddingsProvider {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.modelName = 'text-embedding-004';
    if (!this.apiKey) {
      console.warn('GEMINI_API_KEY is not set. Embeddings provider will not work.');
    } else {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
      this.model = this.genAI.getGenerativeModel({ model: this.modelName });
    }
  }

  /**
   * Get an embedding vector for a single string.
   */
  async getEmbedding(text) {
    if (!this.model) throw new Error('Embedding provider is not initialized (Missing API Key)');
    try {
      const result = await this.model.embedContent(text);
      return result.embedding.values;
    } catch (error) {
      console.error('Embedding Generation Failed:', error);
      throw new Error(`Embedding Generation Failed: ${error.message}`);
    }
  }

  /**
   * Get embeddings for an array of strings in batch.
   */
  async getBatchEmbeddings(texts) {
    if (!this.model) throw new Error('Embedding provider is not initialized (Missing API Key)');
    if (texts.length === 0) return [];
    
    try {
      const requests = texts.map((t) => ({ content: { role: 'user', parts: [{ text: t }] } }));
      const result = await this.model.batchEmbedContents({ requests });
      return result.embeddings.map((e) => e.values);
    } catch (error) {
      console.error('Batch Embedding Generation Failed:', error);
      throw new Error(`Batch Embedding Generation Failed: ${error.message}`);
    }
  }

  getModelName() {
    return this.modelName;
  }
}

module.exports = new EmbeddingsProvider();
