const express = require("express");
const router = express.Router();
const Pin = require("../models/Pin");

router.post("/", async (req, res) => {
  console.log("📥 Gelen pin verisi:", req.body);
  try {
    const newPin = new Pin(req.body);
    const savedPin = await newPin.save();
    res.status(201).json(savedPin);
  } catch (err) {
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
  try {
    const pin = await Pin.findByIdAndUpdate(
      req.params.id,
      { $inc: { likes: 1 } },
      { new: true }
    );

    res.status(200).json(pin);
  } catch (err) {
    res.status(500).json({ message: "Error while liking pin" });
  }
});

router.put("/:id/dislike", async (req, res) => {
  try {
    const pin = await Pin.findByIdAndUpdate(
      req.params.id,
      { $inc: { dislikes: 1 } },
      { new: true }
    );
    res.status(200).json(pin);
  } catch (err) {
    console.log("🚨 Like işlemi hatası:", err);
    res.status(500).json({ message: "Error while liking pin" });
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

module.exports = router;
