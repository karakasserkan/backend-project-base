const { format, createLogger, transports } = require("winston");
const path = require("path");
const { LOG_LEVEL } = require("../../config");

const logFormat = format.combine(
  format.timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
  format.simple(),
  format.splat(),
  format.printf(
    (info) =>
      `${info.timestamp} ${info.level.toUpperCase()}: [email:${info.message.email}] [location: ${info.message.location}] [procType: ${info.message.proc_type}] [log: ${JSON.stringify(info.message.log)}]`,
  ),
);

const logTransports = [
  // Her zaman konsola yaz
  new transports.Console({ format: logFormat }),
];

// Production'da dosyaya da yaz
if (process.env.NODE_ENV === "production") {
  logTransports.push(
    new transports.File({
      filename: path.join(__dirname, "../../../logs/error.log"),
      level: "error", // sadece error'ları yaz
      format: logFormat,
    }),
    new transports.File({
      filename: path.join(__dirname, "../../../logs/combined.log"),
      format: logFormat, // tüm logları yaz
    }),
  );
}

const logger = createLogger({
  level: LOG_LEVEL,
  transports: logTransports,
});

module.exports = logger;
