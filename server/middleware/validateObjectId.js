const mongoose = require("mongoose");

// Use with router.param so malformed ids return 400 instead of a CastError 500.
const validateObjectId = (req, res, next, value) => {
  if (!mongoose.isValidObjectId(value)) {
    return res.status(400).json({ message: "Invalid id" });
  }
  next();
};

module.exports = validateObjectId;
