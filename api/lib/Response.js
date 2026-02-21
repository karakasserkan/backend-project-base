const Enum = require("../config/Enum");
const CustomError = require("./Error");

class Response {
  constructor() {}

  static successResponse(data, code = 200) {
    return {
      code,
      data,
    };
  }

  static errorResponse(error) {
    console.error(error);
    if (error instanceof CustomError) {
      return {
        code: error.code,
        error: {
          message: error.message,
          description: error.description,
        },
      };
    } else if (
      error.message.includes("E11000 duplicate key error collection")
    ) {
      return {
        code: Enum.HTTP_CODES.CONFLICT,
        error: {
          message: "Duplicate key error!",
          description:
            "An item with the same unique field already exists in the database.",
        },
      };
    }
    return {
      code: Enum.HTTP_CODES.INTERNAL_SERVER_ERROR,
      error: {
        message: "Unknown error!",
        description: error.message,
      },
    };
  }
}

module.exports = Response;
