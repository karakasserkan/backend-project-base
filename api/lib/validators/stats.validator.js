const Joi = require("joi");
module.exports = {
  auditlogs: Joi.object({
    location: Joi.string().optional(),
  }),
  usersCount: Joi.object({
    is_active: Joi.boolean().optional(),
  }),
  categoriesUnique: Joi.object({
    is_active: Joi.boolean().optional(),
  }),
};
