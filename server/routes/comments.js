const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const Comment = require("../models/Comment");
const Pin = require("../models/Pin");
const verifyToken = require("../middleware/verifyToken");
const validateObjectId = require("../middleware/validateObjectId");

router.param("pinId", validateObjectId);
router.param("id", validateObjectId);

router.get("/", async (req, res) => {
  try {
    const comments = await Comment.find();
    res.json(comments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error while fetching comments" });
  }
});

router.post("/", verifyToken, async (req, res) => {
  try {
    const { pinId, text } = req.body;
    if (!mongoose.isValidObjectId(pinId)) {
      return res.status(400).json({ message: "Invalid pin id" });
    }
    if (!text || !String(text).trim()) {
      return res.status(400).json({ message: "Comment text is required" });
    }
    if (!(await Pin.exists({ _id: pinId }))) {
      return res.status(404).json({ message: "Pin not found" });
    }

    const saved = await new Comment({
      pinId,
      text,
      username: req.user.username,
    }).save();
    res.status(201).json(saved);
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }
    console.error(err);
    res.status(500).json({ message: "Error while creating comment" });
  }
});

router.get("/:pinId", async (req, res) => {
  try {
    const comments = await Comment.find({ pinId: req.params.pinId }).sort({
      createdAt: -1,
    });
    res.status(200).json(comments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error while fetching comments" });
  }
});

router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }
    if (comment.username !== req.user.username) {
      return res
        .status(403)
        .json({ message: "You can only delete your own comments" });
    }
    await comment.deleteOne();
    res.status(200).json({ message: "Comment deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error while deleting comment" });
  }
});

module.exports = router;
