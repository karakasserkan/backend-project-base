const CustomError = require("./Error");
const { HTTP_CODES } = require("../config/Enum");
const config = require("../config");
const i18n = new (require("./i18n"))(config.DEFAULT_LANG);

module.exports = (err, req, res, next) => {
  console.error(err);

  // Kullanıcının diline göre hata dön
  const lang =
    req.user?.language || req.headers["accept-language"] || config.DEFAULT_LANG;

  // CustomError — bizim fırlattığımız hatalar
  if (err instanceof CustomError) {
    return res.status(err.code).json({
      success: false,
      code: err.code,
      error: {
        message: err.message,
        description: err.description,
      },
    });
  }

  // MongoDB duplicate key
  if (err.message?.includes("E11000 duplicate key error")) {
    return res.status(HTTP_CODES.CONFLICT).json({
      success: false,
      code: HTTP_CODES.CONFLICT,
      error: {
        message: i18n.translate("COMMON.ALREADY_EXISTS", lang),
        description: i18n.translate("COMMON.ALREADY_EXISTS", lang),
      },
    });
  }

  // MongoDB validation error
  if (err.name === "ValidationError") {
    return res.status(HTTP_CODES.BAD_REQUEST).json({
      success: false,
      code: HTTP_CODES.BAD_REQUEST,
      error: {
        message: i18n.translate("COMMON.VALIDATION_ERROR_TITLE", lang),
        description: Object.values(err.errors)
          .map((e) => e.message)
          .join(", "),
      },
    });
  }

  // JWT hataları
  if (err.name === "UnauthorizedError" || err.name === "JsonWebTokenError") {
    return res.status(HTTP_CODES.UNAUTHORIZED).json({
      success: false,
      code: HTTP_CODES.UNAUTHORIZED,
      error: {
        message: i18n.translate("USERS.AUTH_ERROR", lang),
        description: err.message,
      },
    });
  }

  // Genel hata
  return res.status(HTTP_CODES.INTERNAL_SERVER_ERROR).json({
    success: false,
    code: HTTP_CODES.INTERNAL_SERVER_ERROR,
    error: {
      message: i18n.translate("COMMON.UNKNOWN_ERROR", lang),
      description:
        process.env.NODE_ENV !== "production"
          ? err.message
          : "Something went wrong",
    },
  });
};
