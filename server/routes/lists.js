const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const List = require("../models/List");
const Pin = require("../models/Pin");
const verifyToken = require("../middleware/verifyToken");
const validateObjectId = require("../middleware/validateObjectId");

router.param("listId", validateObjectId);
router.param("commentId", validateObjectId);

const isHttpUrl = (u) => typeof u === "string" && /^https?:\/\//.test(u);
const canEdit = (list, username) =>
  list.createdBy === username || list.collaborators.includes(username);

router.get("/", async (req, res) => {
  try {
    const lists = await List.find();
    res.json(lists);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error while fetching lists" });
  }
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

// Pending collaboration requests on lists owned by the current user.
router.get("/me/collab-requests", verifyToken, async (req, res) => {
  try {
    const lists = await List.find({
      createdBy: req.user.username,
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

// Unread answers to collaboration requests the current user sent.
router.get("/me/notifications", verifyToken, async (req, res) => {
  const username = req.user.username;
  try {
    const lists = await List.find({
      collabRequests: {
        $elemMatch: {
          username,
          status: { $in: ["accepted", "rejected"] },
          notified: false,
        },
      },
    });

    const notifications = [];
    for (const list of lists) {
      for (const r of list.collabRequests) {
        if (
          r.username === username &&
          ["accepted", "rejected"].includes(r.status) &&
          !r.notified
        ) {
          notifications.push({
            listId: list._id,
            listName: list.name,
            status: r.status,
          });
        }
      }
    }

    res.json(notifications);
  } catch (err) {
    console.error("❌ Bildirimler alınamadı:", err);
    res.status(500).json({ message: "Bildirim alınırken hata oluştu" });
  }
});

router.post("/me/notifications/:listId/read", verifyToken, async (req, res) => {
  const username = req.user.username;
  try {
    const list = await List.findById(req.params.listId);
    if (!list) return res.status(404).json({ message: "List not found" });

    const entries = list.collabRequests.filter(
      (r) =>
        r.username === username &&
        ["accepted", "rejected"].includes(r.status) &&
        !r.notified
    );
    if (entries.length === 0) {
      return res.status(404).json({ message: "Notification not found" });
    }

    entries.forEach((r) => {
      r.notified = true;
    });
    await list.save({ validateModifiedOnly: true });
    res.json({ message: "Marked read" });
  } catch (err) {
    console.error("Error marking read:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/", verifyToken, async (req, res) => {
  try {
    const { name, description, coverImage } = req.body;
    const newList = new List({
      name,
      description,
      coverImage: isHttpUrl(coverImage) ? coverImage : undefined,
      createdBy: req.user.username,
      pins: [],
    });
    const saved = await newList.save();
    res.status(201).json(saved);
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }
    console.error(err);
    res.status(500).json({ message: "List couldn't be created" });
  }
});

async function getPopulatedList(req, res) {
  try {
    const list = await List.findById(req.params.listId).populate("pins");
    if (!list) return res.status(404).json({ message: "List not found" });
    res.status(200).json(list);
  } catch (err) {
    console.error("Liste detay çekme hatası:", err);
    res.status(500).json({ message: "Error fetching list" });
  }
}

router.get("/id/:listId", getPopulatedList);
router.get("/share/:listId", getPopulatedList);

router.put("/:listId/add-pin", verifyToken, async (req, res) => {
  try {
    const { pinId } = req.body;
    if (!mongoose.isValidObjectId(pinId)) {
      return res.status(400).json({ message: "Invalid pin id" });
    }

    const list = await List.findById(req.params.listId);
    if (!list) return res.status(404).json({ message: "List not found" });

    if (!canEdit(list, req.user.username)) {
      return res.status(403).json({ message: "Not allowed to add pins" });
    }

    const pin = await Pin.findById(pinId);
    if (!pin) return res.status(404).json({ message: "Pin not found" });

    list.pins.addToSet(pin._id);
    const updated = await list.save({ validateModifiedOnly: true });
    const populated = await updated.populate("pins");

    res.json(populated);
  } catch (err) {
    console.error("Couldn't add pin to list:", err);
    res.status(500).json({ message: "Couldn't add pin to list" });
  }
});

router.put("/:listId/remove-pin", verifyToken, async (req, res) => {
  try {
    const { pinId } = req.body;

    const list = await List.findById(req.params.listId);
    if (!list) return res.status(404).json({ message: "List not found" });

    if (!canEdit(list, req.user.username)) {
      return res
        .status(403)
        .json({ message: "Only the owner or collaborators can edit." });
    }

    list.pins = list.pins.filter((p) => p.toString() !== String(pinId));
    const updated = await list.save({ validateModifiedOnly: true });
    const populated = await updated.populate("pins");
    res.status(200).json(populated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Couldn't remove pin from list" });
  }
});

router.put("/:listId/request-collab", verifyToken, async (req, res) => {
  const username = req.user.username;
  try {
    const list = await List.findById(req.params.listId);
    if (!list) return res.status(404).json({ message: "List not found" });

    if (canEdit(list, username)) {
      return res
        .status(400)
        .json({ message: "You can already edit this list" });
    }
    if (
      list.collabRequests.some(
        (r) => r.username === username && r.status === "pending"
      )
    ) {
      return res.status(400).json({ message: "Already requested" });
    }

    list.collabRequests.push({ username, status: "pending", notified: false });
    await list.save({ validateModifiedOnly: true });
    res.status(200).json({ message: "Request sent" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Couldn't send request" });
  }
});

router.put("/:listId/collab-response", verifyToken, async (req, res) => {
  const { requester, action } = req.body;

  if (!["accepted", "rejected"].includes(action)) {
    return res.status(400).json({ message: "Invalid action" });
  }

  try {
    const list = await List.findById(req.params.listId);
    if (!list) {
      return res.status(404).json({ message: "List not found" });
    }
    if (list.createdBy !== req.user.username) {
      return res
        .status(403)
        .json({ message: "Only the list owner can respond to requests" });
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

    await list.save({ validateModifiedOnly: true });
    return res.status(200).json({ message: `Request ${action}` });
  } catch (err) {
    console.error("Collab-response error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.put("/:listId/like", verifyToken, async (req, res) => {
  const username = req.user.username;

  try {
    const list = await List.findById(req.params.listId);
    if (!list) return res.status(404).json({ message: "List not found" });

    if (list.likedBy.includes(username)) {
      list.likes = Math.max(0, list.likes - 1);
      list.likedBy = list.likedBy.filter((u) => u !== username);
    } else {
      list.likes++;
      list.likedBy.push(username);
    }

    await list.save({ validateModifiedOnly: true });
    res.json({ likes: list.likes, likedBy: list.likedBy });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/:listId", verifyToken, async (req, res) => {
  try {
    const { name, description, coverImage } = req.body;

    const list = await List.findById(req.params.listId);
    if (!list) return res.status(404).json({ message: "List not found" });

    if (!canEdit(list, req.user.username)) {
      return res
        .status(403)
        .json({ message: "Only the owner or collaborators can edit." });
    }

    if (name !== undefined && String(name).trim()) list.name = name;
    if (description !== undefined) list.description = description;
    if (isHttpUrl(coverImage)) list.coverImage = coverImage;

    const updated = await list.save({ validateModifiedOnly: true });
    // Return pins populated so the client can render the list right away.
    res.status(200).json(await updated.populate("pins"));
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }
    console.error("Couldn't update list:", err);
    res.status(500).json({ message: "Couldn't update list" });
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
    console.error(err);
    res.status(500).json({ message: "Couldn't get lists" });
  }
});

router.post("/:listId/comments", verifyToken, async (req, res) => {
  const { text } = req.body;
  if (!text || !String(text).trim()) {
    return res.status(400).json({ message: "Comment text is required" });
  }

  try {
    const list = await List.findById(req.params.listId);
    if (!list) {
      return res.status(404).json({ message: "List not found" });
    }

    list.comments.unshift({ username: req.user.username, text });
    await list.save({ validateModifiedOnly: true });
    res.status(201).json(list.comments[0]);
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }
    console.error(err);
    res.status(500).json({ message: "Couldn't add comment" });
  }
});

router.get("/:listId/comments", async (req, res) => {
  try {
    const list = await List.findById(req.params.listId);
    if (!list) {
      return res.status(404).json({ message: "List not found" });
    }
    res.json(list.comments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Couldn't fetch comments" });
  }
});

router.delete("/:listId/comments/:commentId", verifyToken, async (req, res) => {
  const { listId, commentId } = req.params;

  try {
    const list = await List.findById(listId);
    if (!list) return res.status(404).json({ message: "List not found" });

    const comment = list.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    if (comment.username !== req.user.username) {
      return res
        .status(403)
        .json({ message: "You can only delete your own comment" });
    }

    comment.deleteOne();
    await list.save({ validateModifiedOnly: true });

    res.json({ message: "Comment deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
