const express = require("express");
const router = express.Router();
const Comment = require("../models/Comment");

router.get("/", async (req, res) => {
  try {
    const comments = await Comment.find();
    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: "Error while fetching comments" });
  }
});

router.post("/", async (req, res) => {
  try {
    const newComment = new Comment(req.body);
    const saved = await newComment.save();
    res.status(201).json(saved);
  } catch (err) {
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
    res.status(500).json({ message: "Error while fetching comments" });
  }
});

router.delete("/:id", async (req, res) => {
  const { username } = req.body;
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }
    if (comment.username !== username) {
      return res
        .status(403)
        .json({ message: "You can only delete your own comments" });
    }
    await comment.deleteOne();
    res.status(200).json({ message: "Comment deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error while deleting comment" });
  }
});

module.exports = router;
