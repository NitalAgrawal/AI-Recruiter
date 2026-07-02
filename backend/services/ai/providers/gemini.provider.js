const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Gemini Provider Abstraction
 * Generates JSON content using Google's Gemini Models.
 */
class GeminiProvider {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    if (!this.apiKey) {
      console.warn('GEMINI_API_KEY is not set in the environment variables.');
    } else {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
    }
  }

  /**
   * Send a prompt and system instruction to Gemini, requesting JSON output.
   * @param {string} prompt - The user prompt/data
   * @param {string} systemInstruction - Instructions detailing the JSON schema
   * @returns {Promise<string>} The raw text response (expected to be JSON)
   */
  async generateJSON(prompt, systemInstruction) {
    if (!this.genAI) throw new Error('AI provider is not initialized (Missing API Key)');

    const model = this.genAI.getGenerativeModel({
      model: this.modelName,
      generationConfig: {
        responseMimeType: 'application/json',
      },
      systemInstruction,
    });

    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      return { rawText: text, modelUsed: this.modelName };
    } catch (error) {
      console.error('Gemini Provider Error:', error);
      throw new Error(`AI Generation Failed: ${error.message}`);
    }
  }
}

module.exports = new GeminiProvider();
