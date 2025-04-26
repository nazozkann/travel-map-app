const express = require("express");
const multer = require("multer");
const path = require("path");
const router = express.Router();
const Pin = require("../models/Pin");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { title, category, description, latitude, longitude, createdBy } =
      req.body;

    const imageUrl = req.file
      ? `http://localhost:8000/uploads/${req.file.filename}`
      : "";

    const newPin = new Pin({
      title,
      category,
      description,
      latitude,
      longitude,
      createdBy,
      imageUrl,
    });

    const savedPin = await newPin.save();
    res.status(201).json(savedPin);
  } catch (err) {
    console.error("❌ Pin eklenemedi:", err);
    res.status(500).json({ message: "Error while creating pin" });
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

router.get("/:id", async (req, res) => {
  try {
    const pin = await Pin.findById(req.params.id);
    return res.status(200).json(pin);
  } catch (err) {
    res.status(500).json({ message: "Error while fetching pin" });
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
router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const { title, category, description, username } = req.body;
    const pin = await Pin.findById(req.params.id);

    if (!pin) return res.status(404).json({ message: "Pin not found" });
    if (pin.createdBy !== username) {
      return res
        .status(403)
        .json({ message: "You can only update your own pins" });
    }

    pin.title = title || pin.title;
    pin.category = category || pin.category;
    pin.description = description || pin.description;

    if (req.file) {
      pin.imageUrl = `http://localhost:8000/uploads/${req.file.filename}`;
    }

    const updated = await pin.save();
    res.status(200).json(updated);
  } catch (err) {
    console.error("❌ Pin update error:", err);
    res.status(500).json({ message: "Error while updating pin" });
  }
});

module.exports = router;
