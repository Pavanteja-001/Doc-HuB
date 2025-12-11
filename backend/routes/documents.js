const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Document = require("../models/Document");
const QueryHistory = require("../models/QueryHistory");
const {
  simpleSearch,
  askGemini,
  validateDocument,
  getDocumentStats,
} = require("../utils/gemini-simple");
const multer = require("multer");
const fs = require("fs");
const pdfParse = require("pdf-parse");

const upload = multer({ dest: "uploads/" });

router.post("/upload", auth, upload.single("file"), async (req, res) => {
  console.log("\n" + "=".repeat(60));
  console.log("NEW UPLOAD REQUEST");
  console.log("=".repeat(60));

  try {
    const file = req.file;
    if (!file) {
      console.log(" No file in request");
      return res.status(400).json({ error: "No file uploaded" });
    }

    console.log(`📁 File received: ${file.originalname}`);
    console.log(`   Type: ${file.mimetype}`);
    console.log(`   Size: ${(file.size / 1024).toFixed(2)} KB`);
    console.log(`   Temp path: ${file.path}`);

    let text = "";

    // Extract text based on file type
    if (file.mimetype === "application/pdf") {
      console.log("📖 Extracting text from PDF...");
      const dataBuffer = fs.readFileSync(file.path);
      const data = await pdfParse(dataBuffer);
      text = data.text;
      console.log(`   Raw PDF text length: ${text.length} chars`);
      console.log(`   PDF pages: ${data.numpages || "unknown"}`);
    } else if (file.mimetype === "text/plain") {
      console.log("📄 Reading text file...");
      text = fs.readFileSync(file.path, "utf8");
      console.log(`   Raw text length: ${text.length} chars`);
    } else {
      console.log(` Unsupported file type: ${file.mimetype}`);
      fs.unlinkSync(file.path);
      return res.status(400).json({ error: "Only PDF and TXT supported" });
    }

    // Clean the text
    console.log("🧹 Cleaning text...");
    const cleanedText = text
      .normalize("NFKC")
      .replace(/[^\x20-\x7E\u00A0-\uFFFF]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    console.log(`   Cleaned text length: ${cleanedText.length} chars`);
    console.log(`   Preview: "${cleanedText.substring(0, 100)}..."`);

    // Validate content
    if (cleanedText.length < 10) {
      console.log("Document too short or empty");
      fs.unlinkSync(file.path);
      return res.status(400).json({
        error: "Document is empty or unreadable.",
      });
    }

    fs.unlinkSync(file.path);
    console.log(" Temp file deleted");

    // Create document object
    console.log("Creating database document...");
    const doc = new Document({
      userId: req.userId,
      name: file.originalname,
      type: file.mimetype.includes("pdf") ? "pdf" : "txt",
      text: cleanedText,
      status: "ready",
      fileSize: file.size,
    });

    console.log("📋 Document object to save:");
    console.log(`   userId: ${doc.userId}`);
    console.log(`   name: ${doc.name}`);
    console.log(`   type: ${doc.type}`);
    console.log(`   text length: ${doc.text?.length || 0}`);
    console.log(`   status: ${doc.status}`);

    console.log("⏳ Saving to MongoDB...");
    const savedDoc = await doc.save();

    console.log("✅ Document saved successfully!");
    console.log(`   Database ID: ${savedDoc._id}`);
    console.log(`   Text stored: ${savedDoc.text ? "YES" : "NO"}`);
    console.log(`   Text length in DB: ${savedDoc.text?.length || 0}`);

    // Double-check by re-fetching
    const verifyDoc = await Document.findById(savedDoc._id);
    if (verifyDoc && verifyDoc.text) {
      console.log("✅ VERIFICATION: Document text confirmed in database");
    } else {
      console.log("⚠️  WARNING: Document saved but text field is empty!");
    }

    console.log("=".repeat(60));
    console.log("✅ UPLOAD COMPLETE\n");

    res.json({
      message: "Document uploaded and ready!",
      documentId: savedDoc._id,
      name: savedDoc.name,
      textLength: savedDoc.text?.length || 0,
    });
  } catch (err) {
    console.error("❌ Upload error:", err);
    console.error("Stack trace:", err.stack);

    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
      console.log("  Cleaned up temp file after error");
    }

    res.status(500).json({
      error: "Upload failed",
      details: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
});

router.post("/ask", auth, async (req, res) => {
  const { question } = req.body;
  if (!question?.trim())
    return res.status(400).json({ error: "Question required" });

  console.log(`\n🤔 Question: "${question}"`);

  try {
    const userDocs = await Document.find({
      userId: req.userId,
      status: "ready",
    });

    console.log(`Found ${userDocs.length} ready documents`);

    // Get document statistics
    const stats = getDocumentStats(userDocs);
    console.log(`Document stats:`, stats);

    if (userDocs.length === 0) {
      return res.json({
        answer: "Please upload at least one document first.",
        references: [],
      });
    }

    // Smart search with fallback
    let relevantDocs = simpleSearch(question, userDocs);

    if (relevantDocs.length === 0) {
      console.log(
        "⚠️  Keyword search failed → using all documents as fallback"
      );
      relevantDocs = userDocs.slice(0, 5);
    }

    // Prepare context
    const contextChunks = relevantDocs.map((doc) => ({
      text: (doc.text || "").substring(0, 4000),
      docName: doc.name,
    }));

    console.log(`Sending ${contextChunks.length} documents to AI`);

    const answer = await askGemini(question, contextChunks);

    const references = contextChunks.map((c) => ({
      docName: c.docName,
      excerpt:
        c.text.substring(0, 150).trim() + (c.text.length > 150 ? "..." : ""),
    }));

    // Save to history
    const history = new QueryHistory({
      userId: req.userId,
      question: question.trim(),
      answer,
      references,
    });
    await history.save();
    console.log("Saved to query history\n");

    res.json({ answer, references });
  } catch (err) {
    console.error(" Ask error:", err);
    res.status(500).json({ error: "Failed to process question" });
  }
});

/**
 * LIST DOCUMENTS - WITH STATS
 */
router.get("/list", auth, async (req, res) => {
  try {
    const docs = await Document.find({ userId: req.userId })
      .select("name type status createdAt fileSize") // Don't send full text to frontend
      .sort({ createdAt: -1 });

    console.log(`Listed ${docs.length} documents for user ${req.userId}`);
    res.json(docs);
  } catch (err) {
    console.error("❌ List error:", err);
    res.status(500).json({ error: "Failed to fetch documents" });
  }
});

/**
 * DELETE DOCUMENT
 */
router.delete("/:id", auth, async (req, res) => {
  try {
    const doc = await Document.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!doc) {
      console.log(`⚠️  Document ${req.params.id} not found`);
      return res.status(404).json({ error: "Document not found" });
    }

    console.log(`🗑️  Deleted document: ${doc.name}`);
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    console.error("❌ Delete error:", err);
    res.status(500).json({ error: "Delete failed" });
  }
});

/**
 * GET QUERY HISTORY
 */
router.get("/history", auth, async (req, res) => {
  try {
    const history = await QueryHistory.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(100);

    console.log(
      `📜 Fetched ${history.length} history items for user ${req.userId}`
    );
    res.json(history);
  } catch (err) {
    console.error("❌ History error:", err);
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

module.exports = router;
