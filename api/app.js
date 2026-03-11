if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var morgan = require("morgan");
const LoggerClass = require("./lib/logger/LoggerClass");
const mongoSanitize = require("express-mongo-sanitize");
const helmetMiddleware = require("./config/helmet");
const corsMiddleware = require("./config/cors");
const errorHandler = require("./lib/errorHandler");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");

var app = express();

// ─── GÜVENLIK MİDDLEWARE'LERİ  ─────────────────────────────
app.use(helmetMiddleware);
app.use(corsMiddleware);
app.use(mongoSanitize()); // NoSQL injection koruması

// ─── GENEL MİDDLEWARE'LER ────────────────────────────────────────────────────
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// LOGGER
app.use((req, res, next) => {
  LoggerClass.http(req.user?.email || "anonymous", req.path, req.method, {
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });
  next();
});
// SWAGGER
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ─── ROUTES ──────────────────────────────────────────────────────────────────
app.use("/api", require("./routes/index"));

// ─── 404 HANDLER ─────────────────────────────────────────────────────────────
app.use((req, res, next) => {
  next(createError(404));
});

// ─── GLOBAL ERROR HANDLER ───────────────────────────────────────
app.use(errorHandler);

module.exports = app;
