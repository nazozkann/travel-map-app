const express = require("express");
const router = express.Router();
const List = require("../models/List");
const Pin = require("../models/Pin");
const mongoose = require("mongoose");

const ObjectId = mongoose.Types.ObjectId;

router.post("/", async (req, res) => {
  try {
    const newList = new List(req.body);
    const saved = await newList.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ message: "List couldn't made" });
  }
});
router.get("/id/:listId", async (req, res) => {
  try {
    const list = await List.findById(req.params.listId).populate("pins");
    if (!list) return res.status(404).json({ message: "List not found" });
    res.status(200).json(list);
  } catch (err) {
    console.error("Liste detay çekme hatası:", err);
    res.status(500).json({ message: "Error fetching list" });
  }
});

router.get("/:username", async (req, res) => {
  try {
    const lists = await List.find({ createdBy: req.params.username }).populate(
      "pins"
    );
    res.status(200).json(lists);
  } catch (err) {
    res.status(500).json({ message: "Couldn't get lists" });
  }
});

router.put("/:listId/add-pin", async (req, res) => {
  try {
    const { pinId } = req.body;

    const pin = await Pin.findById(pinId);
    if (!pin) {
      return res.status(404).json({ message: "Pin not found" });
    }

    const list = await List.findById(req.params.listId);
    if (!list) {
      return res.status(404).json({ message: "List not found" });
    }

    const alreadyInList = list.pins.some((p) => p.toString() === pinId);
    if (!alreadyInList) {
      list.pins.push(pin._id);
    }

    const updated = await list.save();
    const populated = await updated.populate("pins");
    res.status(200).json(populated);
  } catch (err) {
    console.error("Couldn't add pin to list:", err);
    res.status(500).json({ message: "Couldn't add pin to list" });
  }
});

router.put("/:listId/remove-pin", async (req, res) => {
  try {
    const { pinId, username } = req.body;

    const list = await List.findById(req.params.listId);
    if (!list) return res.status(404).json({ message: "List not found" });

    if (list.createdBy !== username) {
      return res
        .status(403)
        .json({ message: "Only the list owner can remove pins." });
    }

    list.pins = list.pins.filter((p) => p.toString() !== pinId);
    const updated = await list.save();
    const populated = await updated.populate("pins");
    res.status(200).json(populated);
  } catch (err) {
    res.status(500).json({ message: "Couldn't remove pin from list" });
  }
});

module.exports = router;
