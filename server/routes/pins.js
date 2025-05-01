const express = require("express");
const path = require("path");
const router = express.Router();
const Pin = require("../models/Pin");
const cloudinary = require("../config/cloudinary");
const fs = require("fs");

router.post("/", async (req, res) => {
  try {
    const {
      title,
      category,
      tags = Array.isArray(req.body.tags)
   ? req.body.tags
   : JSON.parse(req.body.tags || '[]');,
      description,
      latitude,
      longitude,
      createdBy,
      imageUrl,
      images,
    } = req.body;

    const newPin = new Pin({
      title,
      category,
      tags,
      description,
      latitude,
      longitude,
      createdBy,
      imageUrl,
      images,
    });

    const saved = await newPin.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error("❌ Pin eklenemedi:", err);
    res.status(500).json({ message: "Error while creating pin" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { title, category, description, username, imageUrl, images, tags } =
      req.body;
    const pin = await Pin.findById(req.params.id);

    if (!pin) return res.status(404).json({ message: "Pin not found" });
    if (pin.createdBy !== username)
      return res
        .status(403)
        .json({ message: "You can only update your own pins" });

    pin.title = title || pin.title;
    pin.category = category || pin.category;
    pin.description = description || pin.description;
    pin.tags = tags || pin.tags;
    pin.imageUrl = imageUrl || pin.imageUrl;
    pin.images = images || pin.images;

    const updated = await pin.save();
    res.json(updated);
  } catch (err) {
    console.error("❌ Pin update error:", err);
    res.status(500).json({ message: "Error while updating pin" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const pin = await Pin.findById(req.params.id);
    return res.status(200).json(pin);
  } catch (err) {
    res.status(500).json({ message: "Error while fetching pin" });
  }
});

router.get("/", async (req, res) => {
  try {
    const pins = await Pin.find();
    res.status(200).json(pins);
  } catch (err) {
    res.status(500).json({ message: "Error while fetching pins" });
  }
});

router.put("/:id/like", async (req, res) => {
  const { username } = req.body;

  try {
    const pin = await Pin.findById(req.params.id);

    if (!pin) return res.status(404).json({ message: "Pin not found" });

    if (pin.likedBy.includes(username)) {
      return res.status(200).json({ message: "Already liked" });
    }
    if (pin.dislikedBy.includes(username)) {
      pin.dislikes -= 1;
      pin.dislikedBy = pin.dislikedBy.filter((u) => u !== username);
    }

    pin.likes += 1;
    pin.likedBy.push(username);

    const updated = await pin.save();
    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/:id/dislike", async (req, res) => {
  const { username } = req.body;

  try {
    const pin = await Pin.findById(req.params.id);

    if (!pin) return res.status(404).json({ message: "Pin not found" });

    if (pin.dislikedBy.includes(username)) {
      return res.status(200).json({ message: "Already disliked" });
    }

    if (pin.likedBy.includes(username)) {
      pin.likes -= 1;
      pin.likedBy = pin.likedBy.filter((u) => u !== username);
    }

    pin.dislikes += 1;
    pin.dislikedBy.push(username);

    const updated = await pin.save();
    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/:id", async (req, res) => {
  const { username } = req.body;
  try {
    const pin = await Pin.findById(req.params.id);

    if (!pin) return res.status(404).json({ message: "Pin not found" });

    if (pin.createdBy !== username) {
      return res
        .status(403)
        .json({ message: "You can only delete your own pins" });
    }
    await pin.deleteOne();
    return res.status(200).json({ message: "Pin deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error while deleting pin" });
  }
});

// router.post("/upload-images", upload.array("images", 10), async (req, res) => {
//   if (!req.files || req.files.length === 0) {
//     return res.status(400).json({ message: "No files uploaded" });
//   }

//   try {
//     const imageUrls = await Promise.all(
//       req.files.map(async (file) => {
//         const result = await cloudinary.uploader.upload(file.path);
//         fs.unlinkSync(file.path);
//         return result.secure_url;
//       })
//     );
//     res.status(200).json({ images: imageUrls });
//   } catch (err) {
//     res.status(500).json({ message: "Error while uploading images" });
//   }
// });
module.exports = router;
