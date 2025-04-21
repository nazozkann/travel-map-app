const mongoose = require("mongoose");

const PinSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    category: { type: String, required: true },
    description: String,
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    createdBy: { type: String, default: "anonim" },
    likes: { type: Number, default: 0 },
    dislikes: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Pin", PinSchema);
