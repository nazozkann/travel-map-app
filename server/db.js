const mongoose = require("mongoose");

let connection = null;

// Reuses one connection per process (important for serverless, where the
// module stays warm between invocations).
function connectDb() {
  if (!process.env.MONGO_URL) {
    return Promise.reject(new Error("MONGO_URL is not set"));
  }
  if (!connection) {
    connection = mongoose
      .connect(process.env.MONGO_URL, { serverSelectionTimeoutMS: 5000 })
      .catch((err) => {
        connection = null;
        throw err;
      });
  }
  return connection;
}

module.exports = connectDb;
