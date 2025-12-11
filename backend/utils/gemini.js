/////// IT IS IMPLEMENTED BY GEMINI-SIMPLE.JS IT IS NOT WORKING MODULE ////////

const { GoogleGenerativeAI } = require("@google/generative-ai");

const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 2000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      const isRateLimitError = error.status === 429;
      const isLastRetry = i === maxRetries - 1;

      if (!isRateLimitError || isLastRetry) {
        throw error;
      }

      // Exponential backoff: 2s, 4s, 8s
      const waitTime = baseDelay * Math.pow(2, i);
      console.log(
        `Rate limit hit. Retrying in ${waitTime}ms... (Attempt ${
          i + 1
        }/${maxRetries})`
      );
      await delay(waitTime);
    }
  }
}

/**
 * Generates an embedding vector for a given text string.
 * @param {string} text The text chunk to embed.
 * @returns {Array<number>} The embedding vector.
 */
async function getEmbedding(text) {
  try {
    return await retryWithBackoff(async () => {
      const embeddingModel = ai.getGenerativeModel({
        model: "text-embedding-004",
      });

      const result = await embeddingModel.embedContent(text);
      return result.embedding.values;
    });
  } catch (error) {
    console.error("Error generating embedding:", error);

    try {
      console.log("Embedding failed. Retrying with ultra-filtered text...");

      const ultraFilteredText = text
        .replace(/[^a-zA-Z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      if (ultraFilteredText.length < 10) {
        throw new Error("Text content too short after filtering.");
      }

      return await retryWithBackoff(async () => {
        const embeddingModel = ai.getGenerativeModel({
          model: "text-embedding-004",
        });
        const fallbackResult = await embeddingModel.embedContent(
          ultraFilteredText
        );
        return fallbackResult.embedding.values;
      });
    } catch (fallbackError) {
      console.error("Fallback embedding failed:", fallbackError);
      throw new Error(`Failed to generate embedding: ${fallbackError.message}`);
    }
  }
}

/**

 * @param {string} question User's question.
 * @param {Array<{text: string, docName: string}>} contextChunks Retrieved relevant chunks.
 * @returns {string} The AI-generated answer.
 */
async function askGemini(question, contextChunks) {
  const context = contextChunks
    .map((c) => `[From ${c.docName}]: ${c.text}`)
    .join("\n---\n");

  const prompt = `You are a document intelligence expert. Answer the following QUESTION strictly based on the provided CONTEXT. Do not use external knowledge.

CONTEXT:
${context}

QUESTION:
${question}

ANSWER:`;

  try {
    return await retryWithBackoff(async () => {
      const model = ai.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    });
  } catch (error) {
    console.error("Error generating answer:", error);
    throw new Error(`Failed to generate answer: ${error.message}`);
  }
}

module.exports = {
  getEmbedding,
  askGemini,
};
