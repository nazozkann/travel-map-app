const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();
const app = express();

const corsOptions = {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
};

app.use(cors(corsOptions));

// app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use((req, res, next) => {
  if (req.originalUrl.startsWith("/api/pins")) {
    next();
  } else {
    express.json({ limit: "10mb", type: "application/json" })(
      req,
      res,
      (err) => {
        if (err) {
          return res.status(400).send("Invalid JSON");
        }
        express.urlencoded({ extended: true, limit: "10mb" })(req, res, next);
      }
    );
  }
});
const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

const pinRoutes = require("./routes/pins");
app.use("/api/pins", pinRoutes);

const commentRoutes = require("./routes/comments");
app.use("/api/comments", commentRoutes);

const userRoutes = require("./routes/users");
app.use("/api/users", userRoutes);

const listRoutes = require("./routes/lists");
app.use("/api/lists", listRoutes);

app.get("/test", (req, res) => {
  res.send("Direct test route");
});

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(process.env.PORT, () => {
      console.log(`Server is running on port ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });
