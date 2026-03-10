const Enum = require("../config/Enum");
const CustomError = require("./Error");
const config = require("../config");
const i18n = new (require("./i18n"))(config.DEFAULT_LANG);

class Response {
  constructor() {}

  static successResponse(data, code = 200) {
    return {
      success: true, //frontend için kullanışlı
      code,
      data,
    };
  }

  static errorResponse(error, lang = config.DEFAULT_LANG) {
    console.error(error);

    // CustomError — bizim fırlattığımız hatalar
    if (error instanceof CustomError) {
      return {
        success: false,
        code: error.code,
        error: {
          message: error.message, //kendi mesajını döndür
          description: error.description,
        },
      };
    }

    // MongoDB duplicate key
    if (error.message?.includes("E11000 duplicate key error collection")) {
      return {
        success: false,
        code: Enum.HTTP_CODES.CONFLICT,
        error: {
          message: i18n.translate("COMMON.ALREADY_EXISTS", lang),
          description: i18n.translate("COMMON.ALREADY_EXISTS", lang),
        },
      };
    }

    // MongoDB validation error
    if (error.name === "ValidationError") {
      return {
        success: false,
        code: Enum.HTTP_CODES.BAD_REQUEST,
        error: {
          message: i18n.translate("COMMON.VALIDATION_ERROR_TITLE", lang),
          description: Object.values(error.errors)
            .map((e) => e.message)
            .join(", "),
        },
      };
    }

    // Genel hata
    return {
      success: false,
      code: Enum.HTTP_CODES.INTERNAL_SERVER_ERROR,
      error: {
        message: i18n.translate("COMMON.UNKNOWN_ERROR", lang),
        description:
          process.env.NODE_ENV !== "production"
            ? error.message
            : "Something went wrong",
      },
    };
  }
}

module.exports = Response;
