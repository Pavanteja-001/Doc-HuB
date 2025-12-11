const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["pdf", "txt"],
      required: true,
    },

    text: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["processing", "ready", "error"],
      default: "processing",
    },

    fileSize: Number,
    uploadedAt: { type: Date, default: Date.now },

    chunks: [
      {
        text: String,
        embedding: [Number],
        startIndex: Number,
        endIndex: Number,
      },
    ],
  },
  {
    timestamps: true,
  }
);

documentSchema.index({ userId: 1, createdAt: -1 });
documentSchema.index({ userId: 1, status: 1 });

documentSchema.methods.isReady = function () {
  return this.status === "ready" && this.text && this.text.length > 0;
};

// Optional: Add a static method to get user's ready documents
documentSchema.statics.findReadyByUser = function (userId) {
  return this.find({ userId, status: "ready" }).sort({ createdAt: -1 });
};

module.exports = mongoose.model("Document", documentSchema);
