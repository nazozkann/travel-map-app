const mongoose = require("mongoose");

const CommentSchema = new mongoose.Schema({
  username: { type: String, required: true },
  text: { type: String, required: true, trim: true, maxlength: 1000 },
  createdAt: { type: Date, default: Date.now },
});

const ListSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, trim: true, maxlength: 1000 },
  createdBy: { type: String, required: true, index: true },
  pins: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pin",
    },
  ],
  comments: [CommentSchema],
  coverImage: { type: String },
  likes: { type: Number, default: 0, min: 0 },
  dislikes: { type: Number, default: 0, min: 0 },
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
