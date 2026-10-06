const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const router = express.Router();
const User = require("../models/User");
const verifyToken = require("../middleware/verifyToken");

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Too many attempts, please try again later" },
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-zA-Z0-9_.-]{3,20}$/;

router.post("/register", authLimiter, async (req, res) => {
  try {
    const username = String(req.body.username || "").trim();
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();
    const password = String(req.body.password || "");

    if (!USERNAME_RE.test(username)) {
      return res.status(400).json({
        message:
          "Username must be 3-20 characters (letters, numbers, _ . - only)",
      });
    }
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ message: "Invalid email address" });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    const existing = await User.findOne({
      $or: [{ username }, { email }],
    }).collation({ locale: "en", strength: 2 });
    if (existing) {
      const field =
        existing.username.toLowerCase() === username.toLowerCase()
          ? "Username"
          : "Email";
      return res.status(409).json({ message: `${field} is already taken` });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const savedUser = await new User({
      username,
      email,
      password: hashedPassword,
    }).save();

    res.status(201).json({
      message: "User registered successfully",
      user: { id: savedUser._id, username: savedUser.username },
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Username or email is taken" });
    }
    console.error(err);
    res.status(500).json({ message: "Error while registering" });
  }
});

router.post("/login", authLimiter, async (req, res) => {
  try {
    const email = String(req.body.email || "").trim();
    const password = String(req.body.password || "");

    // Case-insensitive lookup so accounts saved before emails were lowercased still match.
    const user = await User.findOne({ email })
      .collation({ locale: "en", strength: 2 })
      .select("+password");

    const isPasswordValid =
      user && (await bcrypt.compare(password, user.password));
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "2d" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error while logging in" });
  }
});

router.get("/me", verifyToken, (req, res) => {
  res.status(200).json({ user: req.user });
});

module.exports = router;
