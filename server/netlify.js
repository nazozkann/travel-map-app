// Netlify Functions entry points (see /netlify/functions). Kept inside server/
// so dependencies resolve from server/node_modules.
const serverless = require("serverless-http");
const mongoose = require("mongoose");
const app = require("./app");
const connectDb = require("./db");

const FUNCTION_PREFIX = /^\/\.netlify\/functions\/api/;

const expressHandler = serverless(app, {
  request(req) {
    // Requests can arrive as /.netlify/functions/api/... or already rewritten to /api/...
    req.url = req.url.replace(FUNCTION_PREFIX, "/api");
  },
});

function missingEnv() {
  return ["MONGO_URL", "JWT_SECRET"].filter((key) => !process.env[key]);
}

exports.api = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  const missing = missingEnv();
  if (missing.length > 0) {
    console.error(`Missing required env variables: ${missing.join(", ")}`);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Server is not configured" }),
    };
  }

  try {
    await connectDb();
  } catch (err) {
    console.error("MongoDB connection error:", err);
    return {
      statusCode: 503,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Database unavailable" }),
    };
  }

  return expressHandler(event, context);
};

// Scheduled ping so the free MongoDB Atlas cluster isn't paused for inactivity.
exports.keepalive = async () => {
  await connectDb();
  await mongoose.connection.db.admin().ping();
  console.log("MongoDB keepalive ok");
  return { statusCode: 200 };
};
