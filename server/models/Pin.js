const mongoose = require("mongoose");

const PinSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    category: String,
    latitude: Number,
    longitude: Number,
    createdBy: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Pin", PinSchema);
