require("dotenv").config();
const express = require("express");
const path = require("path");
const engine = require("ejs-locals");
const cors = require("cors");
const BP = require("body-parser");
const cookieParser = require("cookie-parser");
const config = require("./app/config");
const { db } = require("./app/config/db");
const { logger, initiateErrorHandler } = require("./app/helpers");
const { readDir } = require("./app/helpers/utils");
const namedRouter = require("route-label")(express());

const app = express();
const PORT = process.env.PORT || 3005; // Use .env port or default to 3005

// Set up view directories correctly
app.set("views", [
    path.join("app/views"),
    path.join("app/modules/www"),
    path.join("app/modules/admin"),
]);
app.engine("ejs", engine);
app.set("view engine", "ejs");

// Serve static files
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Middleware
app.use(cors());
app.use(cookieParser());
app.use(BP.json({ limit: "10mb" }));
app.use(BP.urlencoded({ extended: true, limit: "10mb", parameterLimit: 10000 }));

// Security headers
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Cache-Control", "private, no-cache, max-age=0, must-revalidate");
    res.header("Expires", "-1");
    res.header("Pragma", "no-cache");
    
    if (req.session && req.session.token) {
        req.headers["token"] = req.session.token;
    }
    next();
});

// Global route helpers
global.generateApiUrl = (routeName, params = {}) => `/api${namedRouter.urlFor(routeName, params)}`;
global.generateDashUrl = (routeName, params = {}) => `/dashboard${namedRouter.urlFor(routeName, params)}`;
global.generateUrl = (routeName, params = {}) => namedRouter.urlFor(routeName, params);

// Global Sidebar Navigation
global.sidebar = [
    { title: "Stats", route: "dashboard.stats.ui" },
    { title: "Services", route: "products.list.ui" },
    { title: "Users", route: "users.list.ui" },
    { title: "Bookings", route: "booking.list.ui" },
    { title: "Contact", route: "contact.list.ui" },
    {
        title: "Destinations",
        items: {
            list: { title: "List", route: "category.list.ui" },
            create: { title: "Create", route: "category.single.create.ui" },
        },
    },
    {
        title: "Banners",
        items: {
            list: { title: "List", route: "banner.list.ui" },
            create: { title: "Create", route: "banner.single.create.ui" },
        },
    },
    {
        title: "Blog",
        items: {
            list: { title: "List", route: "blog.list.ui" },
            create: { title: "Create", route: "blog.single.create.ui" },
        },
    },
];

// Start the server
(async () => {
    try {
        initiateErrorHandler();

        // MongoDB Connection
        await db.connect();
        logger.info("✅ Successfully connected to MongoDB");

        // Auto-load API, Dashboard, and WWW routes
        const [apiRoutes, adminRoutes, wwwRoutes] = await Promise.all([
            readDir(path.join(__dirname, "app/routes", config.app.folders.api)),
            readDir(path.join(__dirname, "app/routes", config.app.folders.admin)),
            readDir(path.join(__dirname, "app/routes", config.app.folders.www)),
        ]);

        // Register routes dynamically
        for (const file of [...apiRoutes, ...adminRoutes, ...wwwRoutes]) {
            if (file && file[0] !== ".") {
                namedRouter.use(file.includes("admin") ? "/dashboard" : file.includes("www") ? "/" : "/api", require(file));
            }
        }

        namedRouter.buildRouteTable();

        // Start Express server
        app.listen(PORT, () => {
            logger.info(`🚀 Server is running on http://localhost:${PORT}`);
        });

    } catch (error) {
        logger.error("❌ Server failed to start:", error);
        process.exit(1); // Exit process on failure
    }
})();
