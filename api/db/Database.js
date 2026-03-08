const mongoose = require("mongoose");
let instance = null;
class Database {
  constructor() {
    if (!instance) {
      this.mongoConnection = null;
      instance = this;
    }
    return instance;
  }

  async connect(options) {
    try {
      console.log("Connecting to database...");
      let db = await mongoose.connect(options.CONNECTION_STRING, {
        serverSelectionTimeoutMS: 5000,
      });
      this.mongoConnection = db;
      console.log("Database connection successful");
      // Bağlantı kopunca log bas
      mongoose.connection.on("disconnected", () => {
        console.warn("MongoDB disconnected!");
      });
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  }
}

module.exports = Database;
