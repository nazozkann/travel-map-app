const mongoose = require("mongoose");

const PinSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    category: { type: String, required: true },
    tags: [
      {
        type: String,
        enum: [
          "free",
          "$",
          "$$",
          "$$$",
          "touristic",
          "local",
          "new",
          "crowded",
          "quiet",
        ],
      },
    ],
    description: String,
    imageUrl: String,
    images: [{ type: String }],
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    createdBy: { type: String, default: "anonim" },
    likes: { type: Number, default: 0 },
    dislikes: { type: Number, default: 0 },
    likedBy: { type: [String], default: [] },
    dislikedBy: { type: [String], default: [] },
    city: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Pin", PinSchema);
