// Checks a MongoDB connection string before you deploy it.
// Usage: put MONGO_URL in server/.env, then: npm run check-db
// Never prints the password.
const path = require("path");
const mongoose = require("mongoose");

require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const url = process.env.MONGO_URL;

function describe(url) {
  try {
    const u = new URL(url);
    return {
      scheme: u.protocol.replace(":", ""),
      user: decodeURIComponent(u.username) || "(none)",
      passwordSet: Boolean(u.password),
      host: u.host,
      database: u.pathname.replace("/", "") || "(none → mongoose uses 'test')",
    };
  } catch {
    return null;
  }
}

(async () => {
  if (!url) {
    console.error("✗ MONGO_URL is not set in server/.env");
    process.exit(1);
  }

  const info = describe(url);
  if (!info) {
    console.error(
      "✗ MONGO_URL is not a valid URL. Special characters in the password (@ : / ? # %) must be URL-encoded."
    );
    process.exit(1);
  }
  console.log("Connection string:", info);
  if (url.includes("<") || url.includes(">")) {
    console.error("✗ The URL still contains a <placeholder> (e.g. <db_password>).");
    process.exit(1);
  }

  try {
    await mongoose.connect(url, { serverSelectionTimeoutMS: 8000 });
    const db = mongoose.connection.db;
    const pins = await db.collection("pins").estimatedDocumentCount();
    console.log(`✓ Connected. Database "${db.databaseName}" has ${pins} pins.`);

    if (pins === 0) {
      const { databases } = await db.admin().listDatabases({ nameOnly: true });
      const withPins = [];
      for (const { name } of databases) {
        const n = await mongoose.connection.client
          .db(name)
          .collection("pins")
          .estimatedDocumentCount()
          .catch(() => 0);
        if (n > 0) withPins.push(`${name} (${n} pins)`);
      }
      console.warn(
        `⚠ No pins here. Databases that do have pins: ${
          withPins.join(", ") || "none"
        }. Put that name after ".mongodb.net/" in the URL.`
      );
    }
  } catch (err) {
    const msg = err.message || String(err);
    if (/bad auth|authentication failed/i.test(msg)) {
      console.error(
        "✗ Authentication failed: wrong username/password (Atlas → Database Users). The password is the database user's, not your Atlas login."
      );
    } else if (/ENOTFOUND|querySrv/i.test(msg)) {
      console.error("✗ Host not found: check the cluster address in the URL.");
    } else {
      console.error("✗ Could not connect:", msg);
    }
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
