const Joi = require("joi");

const envSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid("development", "production", "test")
    .default("development"),

  PORT: Joi.number().default(3000),

  CONNECTION_STRING: Joi.string().required(),

  JWT_SECRET: Joi.string().min(32).required(),

  TOKEN_EXPIRE_TIME: Joi.number().default(86400),

  LOG_LEVEL: Joi.string()
    .valid("error", "warn", "info", "http", "verbose", "debug", "silly")
    .default("debug"),

  FILE_UPLOAD_PATH: Joi.string().required(),

  DEFAULT_LANG: Joi.string().valid("EN", "TR").default("EN"),

  ALLOWED_ORIGINS: Joi.string().default("http://localhost:3000"),
  SENDGRID_API_KEY: Joi.string().required(),
  SENDGRID_FROM_EMAIL: Joi.string().email().required(),
  APP_URL: Joi.string().uri().required(),
}).unknown(true); // bilinmeyen değişkenlere izin ver

const { error, value } = envSchema.validate(process.env);

if (error) {
  console.error("Environment validation failed:");
  console.error(error.details.map((d) => `  - ${d.message}`).join("\n"));
  process.exit(1); // Eksik değişken varsa uygulama başlamasın
}

module.exports = value;
