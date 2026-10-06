// One-off data fix: older pins were saved with the misspelled category
// "accomodation", which the map filters (and validation) don't recognise.
// Usage: npm run fix-categories  (reads server/.env). Pass --dry-run to only count.
const path = require("path");
const mongoose = require("mongoose");

require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const FIXES = { accomodation: "accommodation" };
const dryRun = process.argv.includes("--dry-run");

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    const pins = mongoose.connection.db.collection("pins");

    for (const [wrong, right] of Object.entries(FIXES)) {
      const count = await pins.countDocuments({ category: wrong });
      if (dryRun) {
        console.log(`${count} pins with category "${wrong}"`);
        continue;
      }
      const { modifiedCount } = await pins.updateMany(
        { category: wrong },
        { $set: { category: right } }
      );
      console.log(`"${wrong}" → "${right}": ${modifiedCount}/${count} pins updated`);
    }
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
