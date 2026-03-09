const CustomError = require("./Error");
const { HTTP_CODES } = require("../config/Enum");

module.exports = (err, req, res, next) => {
  console.error(err);

  // CustomError ise direkt kullan
  if (err instanceof CustomError) {
    return res.status(err.code).json({
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
      code: HTTP_CODES.CONFLICT,
      error: {
        message: "Already exists",
        description: err.message,
      },
    });
  }

  // MongoDB validation error
  if (err.name === "ValidationError") {
    return res.status(HTTP_CODES.BAD_REQUEST).json({
      code: HTTP_CODES.BAD_REQUEST,
      error: {
        message: "Validation Error",
        description: Object.values(err.errors)
          .map((e) => e.message)
          .join(", "),
      },
    });
  }

  // JWT hataları
  if (err.name === "UnauthorizedError" || err.name === "JsonWebTokenError") {
    return res.status(HTTP_CODES.UNAUTHORIZED).json({
      code: HTTP_CODES.UNAUTHORIZED,
      error: {
        message: "Invalid token",
        description: err.message,
      },
    });
  }

  // Genel hata
  return res.status(HTTP_CODES.INTERNAL_SERVER_ERROR).json({
    code: HTTP_CODES.INTERNAL_SERVER_ERROR,
    error: {
      message: "Internal Server Error",
      description:
        process.env.NODE_ENV !== "production"
          ? err.message
          : "Something went wrong",
    },
  });
};
