const mongoose = require("mongoose");

const CommentSchema = new mongoose.Schema(
  {
    pinId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pin",
      required: true,
      index: true,
    },
    username: { type: String, required: true },
    text: { type: String, required: true, trim: true, maxlength: 1000 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Comment", CommentSchema);
