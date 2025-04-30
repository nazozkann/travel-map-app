// seed.js
require("dotenv").config();
const mongoose = require("mongoose");
const Pin = require("../models/Pin"); // <- model yolu sizde farklıysa düzeltin
const faker = require("@faker-js/faker").faker;

const MONGO = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/travel-map";

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

const COUNT = 90; // kaç adet yeni pin atılacak

async function seed() {
  await mongoose.connect(MONGO);
  console.log("✅ MongoDB connected");

  const pins = [];

  for (let i = 0; i < COUNT; i++) {
    const category = faker.helpers.arrayElement(CATEGORIES);
    const randomTags = faker.helpers
      .arrayElements(TAGS, faker.number.int({ min: 1, max: 3 }))
      .sort(); // örnek: ["$", "touristic"]

    pins.push({
      title: faker.commerce.productName(),
      category,
      description: faker.lorem.sentences({ min: 1, max: 3 }),
      latitude: faker.location.latitude({ min: 35, max: 55 }),
      longitude: faker.location.longitude({ min: -10, max: 40 }),
      createdBy: faker.person.firstName().toLowerCase(),
      likes: faker.number.int({ min: 0, max: 100 }),
      dislikes: faker.number.int({ min: 0, max: 30 }),
      imageUrl: "", // gerçek görsel eklemiyorsanız boş bırakın
      tags: randomTags,
    });
  }

  await Pin.insertMany(pins);
  console.log(`🎉 ${COUNT} pin eklendi`);

  await mongoose.disconnect();
  console.log("🚪 MongoDB disconnected");
}

seed().catch((err) => {
  console.error("❌ Seed hatası:", err);
  mongoose.disconnect();
});
