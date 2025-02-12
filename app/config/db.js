const mongoose = require("mongoose");
const { logger } = require("../helpers");

class Database {
    constructor(uri) {
        this.uri = uri;
    }

    async connect() {
        try {
            await mongoose.connect(this.uri, { dbName: process.env.DB_NAME });
            logger.info(`✅ MongoDB Connected to database: ${process.env.DB_NAME}`);
        } catch (err) {
            logger.error("❌ MongoDB Connection Error:", err);
            process.exit(1); // Exit if DB connection fails
        }
    }

    async disconnect() {
        await mongoose.disconnect();
        logger.info("🚪 MongoDB Disconnected");
    }
}

// Use single connection string from .env
const db = new Database(process.env.DB_URI);
module.exports = { db };
