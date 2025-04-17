const express = require("express");
const bcrypt = require("bcryptjs");
const router = express.Router();
const User = require("../models/User");

router.post("/register", async (req, res) => {
  console.log("➡️ /register endpoint hit");
  try {
    const { username, email, password } = req.body;

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
    });
    const savedUser = await newUser.save();
    res
      .status(201)
      .json({ message: "User registered successfully", user: savedUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error while registering" });
  }
});

router.get("/ping", (req, res) => {
  console.log("✅ /ping endpoint hit");
  res.json({ message: "Ping successful!" });
});

module.exports = router;
