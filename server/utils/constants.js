const CATEGORIES = [
  "food-drink",
  "cultural",
  "accommodation",
  "entertainment",
  "nature",
  "other",
];

const TAGS = [
  "free",
  "$",
  "$$",
  "$$$",
  "touristic",
  "local",
  "new",
  "crowded",
  "quiet",
];

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

module.exports = { CATEGORIES, TAGS, escapeRegex };
