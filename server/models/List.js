const mongoose = require("mongoose");

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
});

module.exports = mongoose.model("List", ListSchema);
