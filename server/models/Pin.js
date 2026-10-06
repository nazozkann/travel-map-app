const mongoose = require("mongoose");
const { CATEGORIES, TAGS } = require("../utils/constants");

const PinSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    category: { type: String, required: true, enum: CATEGORIES },
    tags: [{ type: String, enum: TAGS }],
    description: { type: String, trim: true, maxlength: 2000 },
    imageUrl: String,
    images: [{ type: String }],
    latitude: { type: Number, required: true, min: -90, max: 90 },
    longitude: { type: Number, required: true, min: -180, max: 180 },
    createdBy: { type: String, default: "anonim", index: true },
    likes: { type: Number, default: 0, min: 0 },
    dislikes: { type: Number, default: 0, min: 0 },
    likedBy: { type: [String], default: [] },
    dislikedBy: { type: [String], default: [] },
    city: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Pin", PinSchema);
