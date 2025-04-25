const express = require("express");
const router = express.Router();
const Pin = require("../models/Pin");
const Comment = require("../models/Comment");

router.get("/:username/pins", async (req, res) => {
  try {
    const pins = await Pin.find({ createdBy: req.params.username });
    res.status(200).json(pins);
  } catch (err) {
    res.status(500).json({ message: "Error while fetching pins" });
  }
});
router.get("/:username/liked", async (req, res) => {
  try {
    const pins = await Pin.find({ likedBy: req.params.username });
    res.status(200).json(pins);
  } catch (err) {
    res.status(500).json({ message: "Error while fetching pins" });
  }
});
router.get("/:username/comments", async (req, res) => {
  try {
    const comments = await Comment.find({ username: req.params.username });
    res.status(200).json(comments);
  } catch (err) {
    res.status(500).json({ message: "Error while fetching pins" });
  }
});

module.exports = router;
