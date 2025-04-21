const express = require("express");
const router = express.Router();
const Comment = require("../models/Comment");

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

module.exports = router;
