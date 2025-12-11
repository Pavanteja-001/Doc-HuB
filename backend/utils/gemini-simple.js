const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

function simpleSearch(query, documents) {
  if (!query || !documents || documents.length === 0) {
    console.log("Search called with empty query or no documents");
    return [];
  }

  const queryLower = query.toLowerCase();

  const stopWords = new Set([
    "the",
    "and",
    "for",
    "are",
    "but",
    "not",
    "you",
    "with",
    "this",
    "that",
    "from",
    "have",
    "has",
  ]);
  const words = queryLower
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w));

  if (words.length === 0) {
    console.log(" No meaningful keywords extracted from query");
    return documents.slice(0, 5);
  }

  console.log(` Searching for keywords: [${words.join(", ")}]`);

  const scoredDocs = documents
    .map((doc) => {
      if (!doc.text || typeof doc.text !== "string") {
        console.log(`Document ${doc.name} has no text content`);
        return null;
      }

      let score = 0;
      const textLower = doc.text.toLowerCase();
      const nameLower = (doc.name || "").toLowerCase();

      if (textLower.includes(queryLower)) {
        score += 200;
        console.log(`Exact match in ${doc.name}: +200`);
      }

      words.forEach((word) => {
        if (nameLower.includes(word)) {
          score += 100;
          console.log(`Keyword "${word}" in filename ${doc.name}: +100`);
        }
      });

      words.forEach((word) => {
        const regex = new RegExp(`\\b${word}\\b`, "gi");
        const matches = (textLower.match(regex) || []).length;
        if (matches > 0) {
          const wordScore = Math.min(matches * 15, 150);
          score += wordScore;
          console.log(
            ` Keyword "${word}" found ${matches}x in ${doc.name}: +${wordScore}`
          );
        }
      });

      if (words.length > 1) {
        const positions = words
          .map((word) => textLower.indexOf(word))
          .filter((pos) => pos !== -1);
        if (positions.length > 1) {
          const maxDistance = Math.max(...positions) - Math.min(...positions);
          if (maxDistance < 500) {
            score += 50;
            console.log(` Keywords clustered in ${doc.name}: +50`);
          }
        }
      }

      return { doc, score };
    })
    .filter((item) => item !== null && item.score > 0)
    .sort((a, b) => b.score - a.score);

  console.log(`Found ${scoredDocs.length} relevant documents`);
  scoredDocs.slice(0, 5).forEach((item, i) => {
    console.log(`   ${i + 1}. ${item.doc.name} (score: ${item.score})`);
  });

  const topDocs = scoredDocs.slice(0, 5).map((item) => item.doc);

  if (topDocs.length === 0) {
    console.log(" No keyword matches - returning all documents as fallback");
    return documents.slice(0, 5);
  }

  return topDocs;
}

async function askGemini(question, contextChunks) {
  if (!contextChunks || contextChunks.length === 0) {
    console.log(" No context provided to Gemini");
    return "No documents available to answer your question. Please upload documents first.";
  }

  console.log(`Asking Gemini with ${contextChunks.length} document(s)`);

  const context = contextChunks
    .map((chunk, idx) => {
      const docName = chunk.docName || chunk.name || `Document ${idx + 1}`;
      const text = (chunk.text || "").substring(0, 4000);
      return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DOCUMENT ${idx + 1}: ${docName}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${text}
`;
    })
    .join("\n");

  const prompt = `You are a precise document assistant. Your ONLY job is to answer questions using the provided documents.

STRICT RULES:
1. Answer ONLY using information explicitly stated in the documents below
2. If the information is not in the documents, respond: "I cannot find this information in the uploaded documents."
3. Always cite which document(s) you used: "According to [Document Name]..."
4. Be specific and quote key phrases when relevant
5. If documents conflict, mention both perspectives
6. Keep answers concise but complete (2-4 sentences ideal)

${context}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
USER QUESTION: ${question}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

YOUR ANSWER (with document citations):`;

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
      generationConfig: {
        temperature: 0.3,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 1024,
      },
    });

    console.log("⏳ Generating response...");
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const answer = response.text().trim();

    console.log(`Gemini response generated (${answer.length} chars)`);
    return answer;
  } catch (error) {
    console.error("Gemini API Error:", error.message);

    if (error.message?.includes("API key")) {
      return " API configuration error. Please check your Gemini API key.";
    }
    if (error.message?.includes("quota")) {
      return "API quota exceeded. Please try again later.";
    }

    return "Sorry, the AI service encountered an error. Please try again in a moment.";
  }
}

function validateDocument(doc) {
  if (!doc) return false;
  if (!doc.text || typeof doc.text !== "string") return false;
  if (doc.text.trim().length < 20) return false;
  return true;
}

function getDocumentStats(documents) {
  const valid = documents.filter(validateDocument);
  const totalChars = valid.reduce((sum, doc) => sum + doc.text.length, 0);

  return {
    total: documents.length,
    valid: valid.length,
    invalid: documents.length - valid.length,
    totalChars,
    avgCharsPerDoc:
      valid.length > 0 ? Math.round(totalChars / valid.length) : 0,
  };
}

module.exports = {
  simpleSearch,
  askGemini,
  validateDocument,
  getDocumentStats,
};
