// One-off maintenance script: fills in `city` for pins that don't have one.
// Usage: node scripts/updateCities.js  (reads server/.env)
const path = require("path");
const mongoose = require("mongoose");
const fetch = require("node-fetch");
const Pin = require("../models/Pin");
const { TAGS } = require("../utils/constants");

require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

if (!process.env.MONGO_URL || !process.env.GEOAPIFY_API_KEY) {
  console.error("MONGO_URL and GEOAPIFY_API_KEY must be set in server/.env");
  process.exit(1);
}

const getCityFromCoords = async (lat, lon) => {
  const res = await fetch(
    `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lon}&apiKey=${process.env.GEOAPIFY_API_KEY}`
  );
  if (!res.ok) throw new Error(`Geoapify responded with ${res.status}`);
  const data = await res.json();
  const props = data.features?.[0]?.properties;

  return props?.city || props?.county || props?.state || "Unknown";
};

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    const pins = await Pin.find({
      $or: [{ city: { $exists: false } }, { city: "Unknown" }],
    });

    for (const pin of pins) {
      try {
        const city = await getCityFromCoords(
          Number(pin.latitude),
          Number(pin.longitude)
        );
        pin.tags = (pin.tags || []).filter((tag) => TAGS.includes(tag));
        pin.city = city;
        await pin.save();
        console.log(`✅ Updated ${pin.title} → ${city}`);
      } catch (err) {
        console.error(`⚠️  Skipped ${pin.title}:`, err.message);
      }
    }

    console.log("🎉 City update complete.");
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
