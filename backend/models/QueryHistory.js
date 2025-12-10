const mongoose = require("mongoose");

const querySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  question: String,
  answer: String,
  references: [{ docName: String, excerpt: String }],
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model("QueryHistory", querySchema);
