const express = require("express");
const router = express.Router();
const List = require("../models/List");
const Pin = require("../models/Pin");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");

const ObjectId = mongoose.Types.ObjectId;

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // uploads klasörüne kaydediyoruz
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // benzersiz isim ver
  },
});

const upload = multer({ storage });

router.post("/upload-cover", upload.single("cover"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }
  const filePath = `/uploads/${req.file.filename}`;
  res.status(200).json({ filePath });
});

router.get("/all", async (req, res) => {
  try {
    const lists = await List.find().populate("pins");
    res.json(lists);
  } catch (err) {
    console.error("Error fetching all lists:", err);
    res.status(500).json({ message: "Error fetching lists" });
  }
});

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

router.put("/:listId/add-pin", async (req, res) => {
  try {
    const { pinId, username } = req.body;

    const list = await List.findById(req.params.listId);
    if (!list) return res.status(404).json({ message: "List not found" });

    if (list.createdBy !== username && !list.collaborators.includes(username)) {
      return res.status(403).json({ message: "Not allowed to add pins" });
    }

    const pin = await Pin.findById(pinId);
    if (!pin) return res.status(404).json({ message: "Pin not found" });

    list.pins.addToSet(pin._id);
    const updated = await list.save();
    const populated = await updated.populate("pins");

    res.json(populated);
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

    if (list.createdBy !== username && !list.collaborators.includes(username)) {
      return res
        .status(403)
        .json({ message: "Only the owner or collaborators can edit." });
    }

    list.pins = list.pins.filter((p) => p.toString() !== pinId);
    const updated = await list.save();
    const populated = await updated.populate("pins");
    res.status(200).json(populated);
  } catch (err) {
    res.status(500).json({ message: "Couldn't remove pin from list" });
  }
});

router.put("/:listId/request-collab", async (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ message: "Username required" });

  const list = await List.findById(req.params.listId);
  if (!list) return res.status(404).json({ message: "List not found" });

  if (
    list.collabRequests.some(
      (r) => r.username === username && r.status === "pending"
    )
  ) {
    return res.status(400).json({ message: "Already requested" });
  }

  list.collabRequests.push({ username, status: "pending", notified: false });
  await list.save();
  res.status(200).json({ message: "Request sent" });
});

router.put("/:listId", async (req, res) => {
  try {
    const { name, description, username, coverImage } = req.body;

    const list = await List.findById(req.params.listId);
    if (!list) return res.status(404).json({ message: "List not found" });

    if (list.createdBy !== username) {
      return res.status(403).json({ message: "Only the list owner can edit." });
    }

    list.name = name || list.name;
    list.description = description || list.description;
    list.coverImage = coverImage || list.coverImage;

    const updated = await list.save();
    res.status(200).json(updated);
  } catch (err) {
    console.error("Couldn't update list:", err);
    res.status(500).json({ message: "Couldn't update list" });
  }
});

router.get("/collab-requests/:username", async (req, res) => {
  const { username } = req.params;

  try {
    const lists = await List.find({
      createdBy: username,
      "collabRequests.status": "pending",
    });

    const requests = [];

    lists.forEach((list) => {
      list.collabRequests
        .filter((r) => r.status === "pending")
        .forEach((r) => {
          requests.push({
            listId: list._id,
            listName: list.name,
            username: r.username,
          });
        });
    });

    res.json(requests);
  } catch (err) {
    console.error("Collab request fetch error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/:listId/collab-response", async (req, res) => {
  const { requester, action } = req.body;

  if (!["accepted", "rejected"].includes(action)) {
    return res.status(400).json({ message: "Invalid action" });
  }

  try {
    const list = await List.findById(req.params.listId);
    if (!list) {
      return res.status(404).json({ message: "List not found" });
    }

    const reqEntry = list.collabRequests.find(
      (r) => r.username === requester && r.status === "pending"
    );
    if (!reqEntry) {
      return res
        .status(404)
        .json({ message: "Request not found or already handled" });
    }

    reqEntry.status = action;
    reqEntry.notified = false;

    if (action === "accepted" && !list.collaborators.includes(requester)) {
      list.collaborators.push(requester);
    }

    await list.save();
    return res.status(200).json({ message: `Request ${action}` });
  } catch (err) {
    console.error("Collab-response error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.put("/collab-requests/respond", async (req, res) => {
  const { listId, username, action, owner } = req.body;

  if (!["accepted", "rejected"].includes(action)) {
    return res.status(400).json({ message: "Invalid action" });
  }

  try {
    const list = await List.findById(listId);
    if (!list) return res.status(404).json({ message: "List not found" });

    if (list.createdBy !== owner) {
      return res
        .status(403)
        .json({ message: "Only list owner can respond to requests" });
    }

    const request = list.collabRequests.find((r) => r.username === username);
    if (!request) return res.status(404).json({ message: "Request not found" });

    request.status = action;
    request.notified = false;

    if (action === "accepted" && !list.collaborators.includes(username)) {
      list.collaborators.push(username);
    }

    await list.save();
    res.status(200).json({ message: `Request ${action}` });
  } catch (err) {
    console.error("❌ Collab response error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/notifications/:username", async (req, res) => {
  try {
    const lists = await List.find({
      "collabRequests.username": req.params.username,
      "collabRequests.status": { $in: ["accepted", "rejected"] },
      "collabRequests.notified": false,
    });

    const notifications = [];

    for (const list of lists) {
      let hasUpdates = false;
      for (const r of list.collabRequests) {
        if (
          r.username === req.params.username &&
          (r.status === "accepted" || r.status === "rejected") &&
          !r.notified
        ) {
          notifications.push({
            listId: list._id,
            listName: list.name,
            status: r.status,
          });
          r.notified = true;
          hasUpdates = true;
        }
      }
      if (hasUpdates) {
        await list.save();
      }
    }

    res.json(notifications);
  } catch (err) {
    console.error("❌ Bildirimler alınamadı:", err);
    res.status(500).json({ message: "Bildirim alınırken hata oluştu" });
  }
});

router.get("/:username", async (req, res) => {
  try {
    const lists = await List.find({
      $or: [
        { createdBy: req.params.username },
        { collaborators: req.params.username },
      ],
    }).populate("pins");

    res.status(200).json(lists);
  } catch (err) {
    res.status(500).json({ message: "Couldn't get lists" });
  }
});
router.get("/share/:listId", async (req, res) => {
  try {
    const list = await List.findById(req.params.listId).populate("pins");
    if (!list) return res.status(404).json({ message: "List not found" });
    res.status(200).json(list);
  } catch (err) {
    console.error("Error fetching shared list:", err);
    res.status(500).json({ message: "Error fetching shared list" });
  }
});
router.post("/:listId/comments", async (req, res) => {
  const { listId } = req.params;
  const { username, text } = req.body;

  try {
    const list = await List.findById(listId);
    if (!list) {
      return res.status(404).json({ message: "List not found" });
    }

    list.comments.unshift({ username, text });
    await list.save();
    const savedComment = list.comments[0];
    if (!savedComment._id) {
      return res.status(500).json({ message: "Comment save failed" });
    }
    res.status(201).json(savedComment);
  } catch (err) {
    res.status(500).json({ message: "Couldn't add comment", error: err });
  }
});

router.get("/:listId/comments", async (req, res) => {
  const { listId } = req.params;

  try {
    const list = await List.findById(listId);
    if (!list) {
      return res.status(404).json({ message: "List not found" });
    }
    res.json(list.comments);
  } catch (err) {
    res.status(500).json({ message: "Couldn't fetch comments", error: err });
  }
});

router.delete("/:listId/comments/:commentId", async (req, res) => {
  const { listId, commentId } = req.params;
  const { username } = req.body;

  try {
    const list = await List.findById(listId);

    if (!list) return res.status(404).json({ message: "List not found" });

    const comment = list.comments.id(commentId);

    if (!comment) return res.status(404).json({ message: "Comment not found" });

    if (comment.username !== username) {
      return res
        .status(403)
        .json({ message: "You can only delete your own comment" });
    }

    comment.deleteOne();
    await list.save();

    res.json({ message: "Comment deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
router.put("/:listId/like", async (req, res) => {
  const { username } = req.body;

  try {
    const list = await List.findById(req.params.listId);
    if (!list) return res.status(404).json({ message: "List not found" });

    const alreadyLiked = list.likedBy.includes(username);

    if (alreadyLiked) {
      list.likes--;
      list.likedBy = list.likedBy.filter((u) => u !== username);
    } else {
      list.likes++;
      list.likedBy.push(username);
    }

    await list.save();
    res.json({ likes: list.likes, likedBy: list.likedBy });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
