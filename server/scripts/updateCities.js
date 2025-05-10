const mongoose = require("mongoose");
const fetch = require("node-fetch");
const Pin = require("./../models/Pin");

require("dotenv").config({ path: "../.env" });

console.log("🔑 API Key:", process.env.GEOAPIFY_API_KEY);

const getCityFromCoords = async (lat, lon) => {
  const res = await fetch(
    `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lon}&apiKey=${process.env.GEOAPIFY_API_KEY}`
  );
  const data = await res.json();

  console.log(`📍 (${lat}, ${lon}) ➜`, data.features?.[0]?.properties); // 🔍 Logla

  return (
    data.features?.[0]?.properties?.city ||
    data.features?.[0]?.properties?.county ||
    data.features?.[0]?.properties?.state ||
    "Unknown"
  );
};

(async () => {
  await mongoose.connect(process.env.MONGO_URL);
  const pins = await Pin.find({
    $or: [{ city: { $exists: false } }, { city: "Unknown" }],
  });

  for (const pin of pins) {
    const lat = Number(pin.latitude);
    const lon = Number(pin.longitude);

    const city = await getCityFromCoords(lat, lon);

    const allowedTags = [
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
    pin.tags = (pin.tags || []).filter((tag) => allowedTags.includes(tag));

    pin.city = city;
    await pin.save();

    console.log(`✅ Updated ${pin.title} → ${city}`);
  }

  console.log("🎉 City update complete.");
  process.exit();
})();
