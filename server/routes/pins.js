const express = require("express");
const router = express.Router();
const Pin = require("../models/Pin");
const Comment = require("../models/Comment");
const List = require("../models/List");
const verifyToken = require("../middleware/verifyToken");
const validateObjectId = require("../middleware/validateObjectId");
const { TAGS, escapeRegex } = require("../utils/constants");

router.param("id", validateObjectId);

const sanitizeTags = (tags) =>
  Array.isArray(tags) ? [...new Set(tags.filter((t) => TAGS.includes(t)))] : [];

const sanitizeUrls = (urls) =>
  Array.isArray(urls)
    ? urls.filter((u) => typeof u === "string" && /^https?:\/\//.test(u))
    : [];

router.post("/", verifyToken, async (req, res) => {
  try {
    const { title, category, tags, description, latitude, longitude, city } =
      req.body;

    const newPin = new Pin({
      title,
      category,
      tags: sanitizeTags(tags),
      description,
      latitude: Number(latitude),
      longitude: Number(longitude),
      createdBy: req.user.username,
      imageUrl: sanitizeUrls([req.body.imageUrl])[0],
      images: sanitizeUrls(req.body.images),
      city,
    });

    const saved = await newPin.save();
    res.status(201).json(saved);
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }
    console.error("❌ Pin eklenemedi:", err);
    res.status(500).json({ message: "Error while creating pin" });
  }
});

router.put("/:id", verifyToken, async (req, res) => {
  try {
    const { title, category, description, tags, imageUrl, images } = req.body;
    const pin = await Pin.findById(req.params.id);

    if (!pin) return res.status(404).json({ message: "Pin not found" });
    if (pin.createdBy !== req.user.username)
      return res
        .status(403)
        .json({ message: "You can only update your own pins" });

    if (title !== undefined) pin.title = title;
    if (category !== undefined) pin.category = category;
    if (description !== undefined) pin.description = description;
    if (tags !== undefined) pin.tags = sanitizeTags(tags);
    if (imageUrl !== undefined) pin.imageUrl = sanitizeUrls([imageUrl])[0];
    if (images !== undefined) pin.images = sanitizeUrls(images);

    const updated = await pin.save({ validateModifiedOnly: true });
    res.json(updated);
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }
    console.error("❌ Pin update error:", err);
    res.status(500).json({ message: "Error while updating pin" });
  }
});

router.get("/by-city/:city", async (req, res) => {
  try {
    const city = escapeRegex(req.params.city);
    const pins = await Pin.find({
      city: { $regex: new RegExp(`^${city}$`, "i") },
    });
    res.json(pins);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error while fetching pins" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const pin = await Pin.findById(req.params.id);
    if (!pin) return res.status(404).json({ message: "Pin not found" });
    return res.status(200).json(pin);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error while fetching pin" });
  }
});

router.get("/", async (req, res) => {
  try {
    const pins = await Pin.find();
    res.status(200).json(pins);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error while fetching pins" });
  }
});

// Like/dislike are toggles: voting the same way twice removes the vote.
async function vote(req, res, type) {
  const username = req.user.username;
  const [field, byField, oppField, oppByField] =
    type === "like"
      ? ["likes", "likedBy", "dislikes", "dislikedBy"]
      : ["dislikes", "dislikedBy", "likes", "likedBy"];

  try {
    const pin = await Pin.findById(req.params.id);
    if (!pin) return res.status(404).json({ message: "Pin not found" });

    if (pin[byField].includes(username)) {
      pin[field] = Math.max(0, pin[field] - 1);
      pin[byField] = pin[byField].filter((u) => u !== username);
    } else {
      if (pin[oppByField].includes(username)) {
        pin[oppField] = Math.max(0, pin[oppField] - 1);
        pin[oppByField] = pin[oppByField].filter((u) => u !== username);
      }
      pin[field] += 1;
      pin[byField].push(username);
    }

    const updated = await pin.save({ validateModifiedOnly: true });
    res.status(200).json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
}

router.put("/:id/like", verifyToken, (req, res) => vote(req, res, "like"));
router.put("/:id/dislike", verifyToken, (req, res) =>
  vote(req, res, "dislike")
);

router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const pin = await Pin.findById(req.params.id);

    if (!pin) return res.status(404).json({ message: "Pin not found" });

    if (pin.createdBy !== req.user.username) {
      return res
        .status(403)
        .json({ message: "You can only delete your own pins" });
    }
    await pin.deleteOne();
    await Promise.all([
      Comment.deleteMany({ pinId: pin._id }),
      List.updateMany({ pins: pin._id }, { $pull: { pins: pin._id } }),
    ]);
    return res.status(200).json({ message: "Pin deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error while deleting pin" });
  }
});

module.exports = router;
