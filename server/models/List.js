const mongoose = require("mongoose");

const CommentSchema = new mongoose.Schema({
  username: String,
  text: String,
  createdAt: { type: Date, default: Date.now },
});

const ListSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  createdBy: { type: String, required: true },
  pins: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pin",
    },
  ],
  comments: [CommentSchema],
  coverImage: { type: String },
  likes: { type: Number, default: 0 },
  dislikes: { type: Number, default: 0 },
  likedBy: [{ type: String }],
  collabRequests: [
    {
      username: String,
      status: {
        type: String,
        enum: ["pending", "accepted", "rejected"],
        default: "pending",
      },
      notified: { type: Boolean, default: false },
    },
  ],
  collaborators: [String],
});

module.exports = mongoose.model("List", ListSchema);
