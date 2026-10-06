const express = require("express");
const router = express.Router();
const Pin = require("../models/Pin");
const Comment = require("../models/Comment");
const User = require("../models/User");

router.get("/", async (req, res) => {
  try {
    // Public listing: never expose emails or password hashes.
    const users = await User.find().select("username createdAt");
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error while fetching users" });
  }
});

router.get("/:username/pins", async (req, res) => {
  try {
    const pins = await Pin.find({ createdBy: req.params.username });
    res.status(200).json(pins);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error while fetching pins" });
  }
});

router.get("/:username/liked", async (req, res) => {
  try {
    const pins = await Pin.find({ likedBy: req.params.username });
    res.status(200).json(pins);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error while fetching pins" });
  }
});

router.get("/:username/comments", async (req, res) => {
  try {
    const comments = await Comment.find({ username: req.params.username });
    res.status(200).json(comments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error while fetching comments" });
  }
});

module.exports = router;
