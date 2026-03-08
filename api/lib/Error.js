class CustomError extends Error {
  constructor(code, message, description) {
    super(message);
    this.code = code;
    this.message = message;
    this.description = description;
  }
}

module.exports = CustomError;
