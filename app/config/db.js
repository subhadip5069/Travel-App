require("dotenv").config(); // Load environment variables
const mongoose = require("mongoose");
const { logger } = require("../helpers");
const user = require("../modules/api/users/models/user");
const category = require("../modules/api/categories/models/category");
const product = require("../modules/api/products/models/product");

class Database {
    static instance = null; // Singleton instance
    #uri;

    /**
     * @param {string} uri MongoDB connection URI
     */
    constructor(uri) {
        if (!uri) {
            throw new Error("❌ Database URI is missing! Check your environment variables.");
        }

        if (!Database.instance) {
            this.#uri = uri;
            this.connection = null;
            this.users = user;
            this.categories = category;
            this.products = product;
            Database.instance = this; // Save singleton instance
        }

        return Database.instance; // Return existing instance
    }

    /**
     * Connects to MongoDB only once
     */
    async connect() {
        if (this.connection) {
            logger.info("✅ Already connected to MongoDB");
            return this.connection;
        }

        try {
            this.connection = await mongoose.connect(this.#uri);

            logger.info(`✅ Successfully connected to MongoDB: ${this.connection.connection.name}`);
        } catch (error) {
            logger.error(` MongoDB connection failed: ${error.message}`);
            process.exit(1); // Stop the app if DB connection fails
        }
    }

    /**
     * Disconnect from MongoDB
     */
    async disconnect() {
        if (!this.connection) {
            logger.warn("⚠️ No active MongoDB connection to close.");
            return;
        }

        try {
            await mongoose.disconnect();
            logger.info("✅ Disconnected from MongoDB");
            this.connection = null;
        } catch (error) {
            logger.error(`❌ Error disconnecting from MongoDB: ${error.message}`);
        }
    }
}

// Load MongoDB URI from .env file
const mongoUri = process.env.MONGO_URI;

// Create and export the singleton instance
const db = new Database(mongoUri);
module.exports = { db };
