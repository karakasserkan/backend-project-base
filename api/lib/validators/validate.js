const CustomError = require("../Error");
const Enum = require("../../config/Enum");
const i18n = new (require("../i18n"))(require("../../config").DEFAULT_LANG);

const validate = (schema) => (req, res, next) => {
  const lang = req.user?.language || req.headers["accept-language"] || "EN";

  const { error } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    const description = error.details.map((d) => d.message).join(", ");
    return next(
      new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        i18n.translate("COMMON.VALIDATION_ERROR_TITLE", lang),
        description,
      ),
    );
  }

  next();
};

module.exports = validate;
