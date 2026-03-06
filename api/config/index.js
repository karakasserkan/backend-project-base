module.exports = {
  PORT: process.env.PORT || 3000,
  LOG_LEVEL: process.env.LOG_LEVEL || "debug",
  CONNECTION_STRING:
    process.env.CONNECTION_STRING ||
    "mongodb://localhost:27017/backend-project-base",

  JWT: {
    SECRET:
      process.env.JWT_SECRET ||
      "9f4c7d1e6a2b8c0f3e9d5b71a4c6f8d2e1b7c3a9f0d4e6c2b8a1f5d7c9e3a6b1",
    EXPIRE_TIME: !isNaN(parseInt(process.env.TOKEN_EXPIRE_TIME))
      ? parseInt(process.env.TOKEN_EXPIRE_TIME)
      : 24 * 60 * 60, //86400
  },
  FILE_UPLOAD_PATH: process.env.FILE_UPLOAD_PATH,
  DEFAULT_LANG: process.env.DEFAULT_LANG || "EN",
};
